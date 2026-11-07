import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { test } from 'node:test';
import vm from 'node:vm';
import { createEditorApi, parseMarkdown } from './api.mjs';
import { COLLECTIONS } from './schema.mjs';
import { buildEditorTree, expandFileAncestors } from './note-navigation.mjs';
import { FOLLOWING_CATEGORIES } from '../data/following-config.mjs';
import { findSiblingFiles } from './file-order.mjs';
import { NOTE_SPACES } from '../data/note-space-config.mjs';
import { buildFollowingDraft, followingFilePath } from './following-input.mjs';
import { applyPreviewImage } from './preview-image-input.mjs';

async function fixture(t) {
	const root = await fs.mkdtemp(path.join(os.tmpdir(), 'editor-following-'));
	t.after(() => fs.rm(root, { recursive: true, force: true }));
	const api = createEditorApi(root);
	return {
		async request(method, url, payload) {
			const req = Readable.from(payload ? [Buffer.from(JSON.stringify(payload))] : []);
			req.method = method;
			req.url = url;
			let data;
			const res = { statusCode: 200, setHeader() {}, end(body) { data = JSON.parse(body); } };
			await api(req, res, () => assert.fail(`Unexpected route: ${url}`));
			return { status: res.statusCode, data };
		},
		read(file) { return fs.readFile(path.join(root, 'src/content', file), 'utf8'); },
	};
}

function source(category, file = category) {
	return {
		path: `following/${file}.md`,
		frontmatter: { name: 'A source', url: 'https://example.com', category, addedDate: '2026-11-06', active: true, tags: ['systems'] },
		body: '为什么关注：具体的实践记录。\n',
	};
}

test('Following offers its categories with free-text tags and no source type', () => {
	const field = COLLECTIONS.following.fields.find(field => field.key === 'category');
	assert.ok(field, 'Following needs a category selector');
	assert.equal(field.required, true);
	assert.deepEqual(field.options.map(option => option.value), ['research', 'engineering', 'design']);
	assert.equal(COLLECTIONS.following.fields.some(field => field.key === 'kind'), false);
	const tags = COLLECTIONS.following.fields.find(field => field.key === 'tags');
	assert.equal(tags.suggest, undefined);
	assert.equal(tags.options, undefined);
	const preview = COLLECTIONS.following.fields.find(field => field.key === 'previewImage');
	assert.equal(preview.type, 'image');
	assert.ok(!preview.required);
});

test('create, read and list previews point to the matching category and source anchor', async t => {
	const f = await fixture(t);
	for (const category of ['research', 'engineering', 'design']) {
		const payload = source(category);
		const created = await f.request('POST', '/create', payload);
		assert.equal(created.status, 201);
		assert.equal(created.data.url, `/following/${category}/#${category}.md`);
		const read = await f.request('GET', `/file?path=${payload.path}`);
		assert.equal(read.data.url, created.data.url);
		assert.equal(read.data.frontmatter.category, category);
		assert.equal(read.data.body.trim(), payload.body.trim());
	}
	const listed = await f.request('GET', '/files');
	assert.deepEqual(listed.data.files.map(file => file.url).sort(), [
		'/following/design/#design.md', '/following/engineering/#engineering.md', '/following/research/#research.md',
	]);
});

test('reclassifying a source changes its preview while retaining its body and custom tags', async t => {
	const f = await fixture(t);
	const payload = source('research', 'my-source');
	await f.request('POST', '/create', payload);
	payload.frontmatter.category = 'engineering';
	payload.frontmatter.previewImage = '/images/following/site.webp';
	const saved = await f.request('POST', '/save', payload);
	assert.equal(saved.status, 200);
	assert.equal(saved.data.url, '/following/engineering/#my-source.md');
	const stored = parseMarkdown(await f.read(payload.path));
	assert.equal(stored.frontmatter.category, 'engineering');
	assert.equal(stored.frontmatter.kind, undefined);
	assert.equal(stored.frontmatter.previewImage, '/images/following/site.webp');
	assert.deepEqual(stored.frontmatter.tags, ['systems']);
	assert.equal(stored.body.trim(), payload.body.trim());
});

test('moving a Following file preserves its category preview and updates its anchor', async t => {
	const f = await fixture(t);
	const payload = source('design', 'old');
	await f.request('POST', '/create', payload);
	const moved = await f.request('POST', '/move', { from: payload.path, to: 'following/studio/new.md' });
	assert.equal(moved.status, 200);
	assert.equal(moved.data.url, '/following/design/#studio/new.md');
	const read = await f.request('GET', '/file?path=following/studio/new.md');
	assert.equal(read.data.url, moved.data.url);
	assert.equal(read.data.frontmatter.category, 'design');
});

test('missing and invalid categories are rejected before creating or overwriting a source', async t => {
	const f = await fixture(t);
	for (const category of [undefined, '', 'engneering']) {
		const result = await f.request('POST', '/create', source(category, 'invalid'));
		assert.equal(result.status, 422);
	}
	assert.deepEqual((await f.request('GET', '/files')).data.files, []);
	const payload = source('research', 'valid');
	await f.request('POST', '/create', payload);
	const original = await f.read(payload.path);
	payload.frontmatter.category = 'unknown';
	assert.equal((await f.request('POST', '/save', payload)).status, 422);
	assert.equal(await f.read(payload.path), original);
});

test('preview anchors retain index filenames, repeated spaces and paths independently of frontmatter slugs', async t => {
	const f = await fixture(t);
	for (const [file, anchor] of [['index', 'index'], ['Studio/index', 'Studio/index'], ['two  spaces', 'two%20%20spaces']]) {
		const payload = source('design', file);
		payload.frontmatter.slug = 'custom-slug';
		const created = await f.request('POST', '/create', payload);
		assert.equal(created.status, 201);
		assert.equal(created.data.url, `/following/design/#${anchor}.md`);
	}
});

test('the editor applies a saved category URL to its current file, open link and live preview', async t => {
	const f = await fixture(t);
	const payload = source('research', 'my-source');
	await f.request('POST', '/create', payload);
	const editor = await fs.readFile(new URL('./EditorPage.astro', import.meta.url), 'utf8');
	const save = editor.slice(editor.indexOf('async function save('), editor.indexOf('async function removeFile('));
	const preview = editor.slice(editor.indexOf('const refreshPreview = debounce('), editor.indexOf('function setPreviewMode('));
	for (const mode of ['draft', 'page']) {
		const previous = '/following/research/#my-source.md';
		const next = '/following/engineering/#my-source.md';
		let reloads = 0;
		const state = { current: { ...payload, url: previous }, preview: mode, dirty: true, saving: false };
		const els = {
			body: { value: payload.body }, save: { setAttribute() {} },
			fields: { querySelector() { return null; } },
			openPage: { href: previous },
			frame: { src: previous, dataset: { src: previous }, contentWindow: { location: { reload() { reloads++; } } } },
			frameHint: { hidden: true },
		};
		const context = {
			state, els,
			api: async (url, options) => {
				const result = await f.request(options.method, url, JSON.parse(options.body));
				assert.equal(result.status, 200);
				return result.data;
			},
			collectFrontmatter: () => ({ ...payload.frontmatter, category: 'engineering' }),
			syncCurrentOrder() {}, setDirty(value) { state.dirty = value; },
			toast(message, kind) { if (kind === 'error') assert.fail(message); },
			loadFiles: async () => {}, loadGit: async () => {},
			visibleFiles: () => [], buildTree: () => ({}), expandFileAncestors() {}, renderTree() {},
			debounce: callback => callback,
		};
		const runSave = vm.runInNewContext(`${preview}\n${save}\nsave;`, context);
		await runSave({ silent: true });
		assert.equal(state.current.url, next, `${mode}: saved file URL`);
		assert.equal(els.openPage.href, next, `${mode}: open-page target`);
		if (mode === 'page') {
			assert.equal(els.frame.src, next, 'The iframe navigates to the new category');
			assert.equal(els.frame.dataset.src, next);
			assert.equal(reloads, 0, 'The old category is not reloaded');
			await runSave({ silent: true });
			assert.equal(reloads, 1, 'A subsequent save refreshes the unchanged page');
		}
	}
});

test('saving waits for a pending screenshot upload instead of dropping its dirty state', async () => {
	const editor = await fs.readFile(new URL('./EditorPage.astro', import.meta.url), 'utf8');
	const save = editor.slice(editor.indexOf('async function save('), editor.indexOf('async function removeFile('));
	const image = { readOnly: true };
	const state = { current: source('design'), dirty: true, saving: false };
	let warning = '';
	const run = vm.runInNewContext(`${save}\nsave;`, {
		state, els: { fields: { querySelector: () => image }, save: { setAttribute() {} } },
		setDirty() {}, collectFrontmatter() { assert.fail('must not snapshot metadata during upload'); },
		toast(message) { warning = message; },
	});
	await run();
	assert.match(warning, /截图上传/);
	assert.equal(state.dirty, true);
	assert.equal(state.saving, false);
});

test('an existing source cannot begin a screenshot upload while its save request is pending', async () => {
	const editor = await fs.readFile(new URL('./EditorPage.astro', import.meta.url), 'utf8');
	const render = editor.slice(editor.indexOf('function renderFields()'), editor.indexOf('function collectFrontmatter()'));
	const nodes = [];
	function element(tag) {
		const node = { tag, dataset: {}, value: '', handlers: {}, isConnected: true, append() {}, replaceChildren() {},
			addEventListener(type, handler) { this.handlers[type] = handler; } };
		nodes.push(node);
		return node;
	}
	const state = { current: { ...source('design'), collection: 'following' }, saving: true };
	let warning = '';
	vm.runInNewContext(`${render}\nrenderFields();`, {
		state, els: { fields: element('div') }, document: { createElement: element },
		SCHEMA: { following: { fields: COLLECTIONS.following.fields.filter(field => field.key === 'previewImage') } },
		setDirty() {}, applyPreviewImage,
		uploadFollowingPreview() { assert.fail('a pending save must prevent uploading'); },
		toast(message) { warning = message; },
	});
	const file = nodes.find(node => node.type === 'file');
	file.files = [{ type: 'image/webp', size: 10 }];
	await file.handlers.change();
	assert.match(warning, /保存/);
});

test('Following sidebar shows all categories, counts, nested source paths and category-specific siblings', () => {
	const files = [
		{ collection: 'following', path: 'following/a.md', title: 'A', category: 'research' },
		{ collection: 'following', path: 'following/b.md', title: 'B', category: 'engineering' },
		{ collection: 'following', path: 'following/c.md', title: 'C', category: 'engineering' },
		{ collection: 'following', path: 'following/studio/d.md', title: 'D', category: 'design' },
	];
	const tree = buildEditorTree(files, { collection: 'following' });
	assert.deepEqual([...tree.dirs.keys()], ['research', 'engineering', 'design']);
	assert.equal(tree.dirs.get('engineering').count, 2);
	assert.equal(tree.dirs.get('design').category, 'design');
	const studio = tree.dirs.get('design').dirs.get('studio');
	assert.equal(studio.dir, 'studio');
	assert.equal(studio.category, 'design');
	assert.deepEqual(findSiblingFiles(tree, 'following/b.md').map(file => file.path), ['following/b.md', 'following/c.md']);
	const collapsed = new Set(['following@design', 'following@design/studio']);
	assert.equal(expandFileAncestors(tree, 'following/studio/d.md', collapsed), true);
	assert.equal(collapsed.size, 0);
});

test('empty Following categories remain available and unclassified files can still be repaired', () => {
	const empty = buildEditorTree([], { collection: 'following' });
	assert.deepEqual([...empty.dirs.values()].map(dir => dir.name), FOLLOWING_CATEGORIES.map(category => category.title));
	assert.equal(empty.dirs.get('design').count, 0);
	const unknown = { collection: 'following', path: 'following/unknown.md', title: 'Unknown' };
	const tree = buildEditorTree([unknown], { collection: 'all' });
	assert.equal(tree.dirs.get('following').dirs.get('unclassified').files[0], unknown);
	const search = buildEditorTree([unknown], { collection: 'following', search: 'unknown' });
	assert.deepEqual([...search.dirs.keys()], ['unclassified']);
	assert.equal(buildEditorTree([], { collection: 'following', search: 'missing' }).dirs.size, 0);
});

test('the API includes Following categories in sidebar metadata and reordering stays within one category', async t => {
	const f = await fixture(t);
	for (const [category, file] of [['research', 'r'], ['engineering', 'a'], ['engineering', 'b']]) {
		await f.request('POST', '/create', source(category, file));
	}
	const { data: { files } } = await f.request('GET', '/files');
	assert.equal(files.find(file => file.path === 'following/a.md').category, 'engineering');
	const reordered = await f.request('POST', '/reorder', {
		paths: ['following/b.md', 'following/a.md'], previousPaths: ['following/a.md', 'following/b.md'],
	});
	assert.equal(reordered.status, 200);
	const rejected = await f.request('POST', '/reorder', {
		paths: ['following/a.md', 'following/r.md'], previousPaths: ['following/b.md', 'following/a.md'],
	});
	assert.equal(rejected.status, 409);
});

test('invalid Following links and tags do not create files or overwrite an existing source', async t => {
	const f = await fixture(t);
	const payload = source('design', 'valid');
	await f.request('POST', '/create', payload);
	const original = await f.read(payload.path);
	for (const fields of [{ url: 'not a URL' }, { rss: 'bad RSS' }, { previewImage: 'javascript:alert(1)' }, { previewImage: '/images/../secret' }, { tags: 'not-an-array' }, { tags: ['valid', 3] }]) {
		const changed = { ...payload, frontmatter: { ...payload.frontmatter, ...fields } };
		assert.equal((await f.request('POST', '/save', changed)).status, 422);
		assert.equal(await f.read(payload.path), original);
		assert.equal((await f.request('POST', '/create', { ...changed, path: 'following/invalid.md' })).status, 422);
	}
	assert.equal((await f.request('GET', '/files')).data.files.length, 1);
});

test('homepage URLs in the screenshot field are rejected before saving or creating a source', async t => {
	const f = await fixture(t);
	const payload = source('design', 'awwwards');
	payload.frontmatter.url = 'https://www.awwwards.com/';
	await f.request('POST', '/create', payload);
	const original = await f.read(payload.path);
	const invalid = { ...payload, frontmatter: { ...payload.frontmatter, previewImage: 'https://awwwards.com/' } };
	for (const route of ['/save', '/create']) {
		const result = await f.request('POST', route, { ...invalid, path: route === '/save' ? payload.path : 'following/invalid.md' });
		assert.equal(result.status, 422);
		assert.match(result.data.error, /图片直链/);
	}
	assert.equal(await f.read(payload.path), original);
	assert.equal((await f.request('GET', '/files')).data.files.length, 1);
});

async function dialogFixture(t) {
	const f = await fixture(t);
	const editor = await fs.readFile(new URL('./EditorPage.astro', import.meta.url), 'utf8');
	const code = editor.slice(editor.indexOf('function newFilePath()'), editor.indexOf('async function loadGit()'));
	const elements = new Map();
	function element() {
		return {
			value: '', hidden: false, disabled: false, required: false, textContent: '', children: [],
			validationMessage: '', setCustomValidity(message) { this.validationMessage = message; },
			replaceChildren(...children) { this.children = children; this.value = children[0]?.value ?? ''; },
			prepend(child) { this.children.unshift(child); },
			showModal() { this.open = true; }, close() { this.open = false; }, focus() {},
		};
	}
	const $ = id => {
		if (!elements.has(id)) elements.set(id, element());
		return elements.get(id);
	};
	const state = { collection: 'following', current: null, files: [] };
	const context = {
		$, state, SCHEMA: COLLECTIONS, NOTE_SPACES, buildFollowingDraft, followingFilePath,
		document: { createElement: element },
		refreshDirList() {}, today: () => '2026-11-06',
		api: async (url, options) => {
			const response = await f.request(options.method, url, JSON.parse(options.body));
			if (response.status >= 400) throw new Error(response.data.error);
			return response.data;
		},
		loadFiles: async () => { state.files = (await f.request('GET', '/files')).data.files; },
		openFile: async path => { state.current = (await f.request('GET', `/file?path=${encodeURIComponent(path)}`)).data; },
		loadGit: async () => {}, toast() {},
	};
	const actions = vm.runInNewContext(`${code}\n({ openNewDialog, createFile, newFilePath, syncNewDialogLabel });`, context);
	return { ...f, $, state, ...actions, submit: () => actions.createFile({ preventDefault() {} }) };
}

test('the actual new-source dialog preselects a clicked category and clears previous source inputs', async t => {
	const d = await dialogFixture(t);
	d.state.current = { collection: 'following', path: 'following/current.md', frontmatter: { category: 'research' } };
	d.$('new-following-url').value = 'https://old.example.com';
	d.$('new-following-note').value = 'Old reason';
	d.$('new-following-tags').value = '旧标签';
	d.$('new-following-preview').value = '/images/following/old.webp';
	d.$('new-following-preview').setCustomValidity('之前的截图地址无效');
	d.openNewDialog({ collection: 'following', category: 'design' });
	assert.equal(d.$('new-following-category').value, 'design');
	assert.equal(d.$('new-title').value, '');
	assert.equal(d.$('new-following-url').value, '');
	assert.equal(d.$('new-following-note').value, '');
	assert.equal(d.$('new-following-tags').value, '');
	assert.equal(d.$('new-following-preview').value, '');
	assert.equal(d.$('new-following-preview').validationMessage, '');
	assert.equal(d.$('new-dialog-title').textContent, '添加关注');
	assert.equal(d.$('new-following-fields').hidden, false);
	assert.equal(d.$('new-space-field').hidden, true);
});

test('the actual creation form adds Design sources without filenames and keeps duplicate names separate', async t => {
	const d = await dialogFixture(t);
	for (let index = 1; index <= 2; index++) {
		d.openNewDialog({ collection: 'following', category: 'design' });
		d.$('new-title').value = 'Example Design';
		d.$('new-following-url').value = 'https://example.com/design';
		d.$('new-following-tags').value = '灵感, 自己的标签';
		d.$('new-following-note').value = `Reason ${index}`;
		d.$('new-following-preview').value = '/images/following/site.webp';
		await d.submit();
		assert.equal(d.$('new-error').hidden, true, d.$('new-error').textContent);
		const path = `following/example-design${index === 1 ? '' : '-2'}.md`;
		assert.equal(d.state.current.path, path);
		assert.equal(d.state.current.frontmatter.category, 'design');
		assert.equal(d.state.current.frontmatter.url, 'https://example.com/design');
		assert.equal(d.state.current.frontmatter.kind, undefined);
		assert.equal(d.state.current.frontmatter.previewImage, '/images/following/site.webp');
		assert.deepEqual(d.state.current.frontmatter.tags, ['灵感', '自己的标签']);
		assert.equal(d.state.current.url, `/following/design/#example-design${index === 1 ? '' : '-2'}.md`);
	}
	assert.equal(parseMarkdown(await d.read('following/example-design.md')).body.trim(), 'Reason 1');
	assert.equal(d.state.files.length, 2);
});

test('the creation form reports invalid Following links without creating a file', async t => {
	const d = await dialogFixture(t);
	d.openNewDialog({ collection: 'following', category: 'engineering' });
	d.$('new-title').value = 'A source';
	d.$('new-following-url').value = 'not a URL';
	await d.submit();
	assert.equal(d.$('new-error').hidden, false);
	assert.match(d.$('new-error').textContent, /主页链接/);
	assert.equal((await d.request('GET', '/files')).data.files.length, 0);
});

test('the shared creation dialog still creates Notes with their selected space and manual filename', async t => {
	const d = await dialogFixture(t);
	d.$('new-following-preview').setCustomValidity('之前的截图地址无效');
	d.openNewDialog({ collection: 'notes', space: 'pretrain' });
	d.$('new-title').value = 'A note';
	d.$('new-slug').value = 'new-note';
	await d.submit();
	assert.equal(d.$('new-error').hidden, true, d.$('new-error').textContent);
	assert.equal(d.$('new-following-fields').hidden, true);
	assert.equal(d.$('new-following-preview').disabled, true);
	assert.equal(d.$('new-following-preview-file').disabled, true);
	assert.equal(d.$('new-following-preview').validationMessage, '');
	assert.equal(d.state.current.path, 'notes/new-note.md');
	assert.equal(d.state.current.frontmatter.space, 'pretrain');
	assert.equal(d.state.current.frontmatter.category, undefined);
});


test('saving a source removes a legacy source type and preserves its custom tags and body', async t => {
 const f = await fixture(t);
 const payload = source('design', 'legacy');
 payload.frontmatter.kind = 'blog';
 assert.equal((await f.request('POST', '/create', payload)).status, 201);
 const saved = await f.request('POST', '/save', { ...payload, frontmatter: { ...payload.frontmatter, tags: ['灵感库', '我的标签'] } });
 assert.equal(saved.status, 200);
 const stored = parseMarkdown(await f.read(payload.path));
 assert.equal(Object.hasOwn(stored.frontmatter, 'kind'), false);
 assert.deepEqual(stored.frontmatter.tags, ['灵感库', '我的标签']);
 assert.equal(stored.body.trim(), payload.body.trim());
});
