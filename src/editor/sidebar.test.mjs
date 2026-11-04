import assert from 'node:assert/strict';
import { test } from 'node:test';

// Only the browser APIs used by the controller are stubbed. Layout is checked in Chrome.
async function fixture({ narrow = false, collapsed = false, blockedStorage = false } = {}) {
	const { initSidebar } = await import('./sidebar.mjs');
	const document = new EventTarget();
	const elements = new Map();
	function element(id) {
		const node = new EventTarget();
		Object.assign(node, { id, hidden: false, inert: false, dataset: {}, value: '', scrollTop: 0 });
		const attributes = new Map();
		node.setAttribute = (key, value) => attributes.set(key, String(value));
		node.getAttribute = (key) => attributes.get(key) ?? null;
		node.removeAttribute = (key) => attributes.delete(key);
		node.focus = () => { document.activeElement = node; };
		node.contains = target => target === node || (id === 'sidebar' && ['search', 'btn-sidebar-close', 'tree'].includes(target?.id));
		node.querySelectorAll = () => [elements.get('btn-sidebar-close'), elements.get('search')];
		node.querySelector = () => null;
		node.getClientRects = () => [1];
		elements.set(id, node);
		return node;
	}
	for (const id of ['editor-shell', 'sidebar', 'btn-sidebar', 'btn-sidebar-close', 'sidebar-backdrop', 'search', 'tree', 'topbar', 'main-pane', 'preview-pane']) element(id);
	document.getElementById = id => elements.get(id);
	document.querySelector = () => null;
	const media = new EventTarget();
	media.matches = narrow;
	const saved = new Map([['ed-sidebar-collapsed', String(collapsed)]]);
	const controller = initSidebar({ document, media, storage: () => {
		if (blockedStorage) throw new Error('Storage unavailable');
		return { getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, value) };
	} });
	const click = id => elements.get(id).dispatchEvent(new Event('click'));
	const resize = narrow => { media.matches = narrow; media.dispatchEvent(new Event('change')); };
	const key = (key, shiftKey = false) => {
		const event = new Event('keydown', { cancelable: true });
		Object.assign(event, { key, shiftKey });
		document.dispatchEvent(event);
		return event;
	};
	return { controller, document, get: id => elements.get(id), saved, click, resize, key };
}

test('desktop collapse persists and leaves the directory control available', async () => {
	const f = await fixture();
	assert.equal(f.get('sidebar').hidden, false);
	f.click('btn-sidebar');
	assert.equal(f.get('sidebar').hidden, true);
	assert.equal(f.get('btn-sidebar').getAttribute('aria-expanded'), 'false');
	assert.equal(f.get('btn-sidebar').inert, false);
	assert.equal(f.saved.get('ed-sidebar-collapsed'), 'true');
	const refreshed = await fixture({ collapsed: true });
	assert.equal(refreshed.get('sidebar').hidden, true);
	refreshed.click('btn-sidebar');
	assert.equal(refreshed.get('sidebar').hidden, false);
	assert.equal(refreshed.saved.get('ed-sidebar-collapsed'), 'false');
});

test('a narrow drawer starts closed and never overwrites the desktop preference', async () => {
	const f = await fixture({ narrow: true });
	assert.equal(f.get('sidebar').hidden, true);
	f.click('btn-sidebar');
	assert.equal(f.get('sidebar').hidden, false);
	assert.equal(f.get('sidebar-backdrop').hidden, false);
	assert.equal(f.get('sidebar').getAttribute('aria-modal'), 'true');
	assert.equal(f.get('main-pane').inert, true);
	assert.equal(f.document.activeElement, f.get('search'));
	f.click('sidebar-backdrop');
	assert.equal(f.get('sidebar').hidden, true);
	assert.equal(f.get('main-pane').inert, false);
	assert.equal(f.document.activeElement, f.get('btn-sidebar'));
	assert.equal(f.saved.get('ed-sidebar-collapsed'), 'false');
});

test('resizing resets the drawer and restores the independent desktop setting', async () => {
	const f = await fixture();
	f.resize(true);
	assert.equal(f.get('sidebar').hidden, true);
	f.click('btn-sidebar');
	f.resize(false);
	assert.equal(f.get('sidebar').hidden, false);
	assert.equal(f.get('sidebar-backdrop').hidden, true);
	assert.equal(f.get('main-pane').inert, false);
	assert.equal(f.get('sidebar').getAttribute('aria-modal'), null);
	f.click('btn-sidebar');
	f.resize(true);
	f.click('btn-sidebar');
	f.resize(false);
	assert.equal(f.get('sidebar').hidden, true);
	assert.equal(f.document.activeElement, f.get('btn-sidebar'));
	f.resize(true);
	assert.equal(f.get('sidebar').hidden, true);
});

test('Escape and the close control dismiss the drawer without clearing search or scroll', async () => {
	const f = await fixture({ narrow: true });
	f.get('search').value = 'NCCL';
	f.click('btn-sidebar');
	f.get('tree').scrollTop = 240;
	assert.equal(f.key('Escape').defaultPrevented, true);
	assert.equal(f.get('sidebar').hidden, true);
	assert.equal(f.document.activeElement, f.get('btn-sidebar'));
	f.click('btn-sidebar');
	assert.equal(f.get('search').value, 'NCCL');
	assert.equal(f.get('tree').scrollTop, 240);
	f.click('btn-sidebar-close');
	assert.equal(f.get('sidebar').hidden, true);
});

test('successful selection dismisses only the narrow drawer', async () => {
	const f = await fixture({ narrow: true });
	f.click('btn-sidebar');
	f.controller.onFileOpened();
	assert.equal(f.get('sidebar').hidden, true);
	f.resize(false);
	f.controller.onFileOpened();
	assert.equal(f.get('sidebar').hidden, false);
});

test('Tab stays in the drawer while a nested native dialog keeps its own keyboard handling', async () => {
	const f = await fixture({ narrow: true });
	f.click('btn-sidebar');
	f.get('search').focus();
	assert.equal(f.key('Tab').defaultPrevented, true);
	assert.equal(f.document.activeElement, f.get('btn-sidebar-close'));
	assert.equal(f.key('Tab', true).defaultPrevented, true);
	assert.equal(f.document.activeElement, f.get('search'));
	f.document.querySelector = () => ({ open: true });
	assert.equal(f.key('Escape').defaultPrevented, false);
	assert.equal(f.get('sidebar').hidden, false);
});

test('unavailable local storage does not break sidebar interaction', async () => {
	const f = await fixture({ blockedStorage: true });
	f.click('btn-sidebar');
	assert.equal(f.get('sidebar').hidden, true);
	f.click('btn-sidebar');
	assert.equal(f.get('sidebar').hidden, false);
});
