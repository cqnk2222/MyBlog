import assert from 'node:assert/strict';
import { test } from 'node:test';

const load = async () => (await import('./preview-image-input.mjs')).applyPreviewImage;
const file = { type: 'image/webp', size: 100, name: 'website.webp' };

test('a screenshot upload updates the optional field and marks it changed', async () => {
	const input = { value: '', readOnly: false };
	let changes = 0;
	await (await load())({ file, input, upload: async () => ({ url: '/images/following/preview.webp' }), isCurrent: () => true, onChange: () => changes++ });
	assert.equal(input.value, '/images/following/preview.webp');
	assert.equal(input.readOnly, false);
	assert.equal(changes, 1);
});

test('switching sources or changing the image path during upload does not overwrite the target', async () => {
	const input = { value: '/images/following/original.webp', readOnly: false };
	await assert.rejects((await load())({ file, input, upload: async () => { input.value = 'changed'; return { url: '/images/following/new.webp' }; }, isCurrent: () => true, onChange() { assert.fail(); } }));
	assert.equal(input.value, 'changed');
	await assert.rejects((await load())({ file, input, upload: async () => ({ url: '/images/following/new.webp' }), isCurrent: () => false, onChange() { assert.fail(); } }));
	assert.equal(input.readOnly, false);
});

test('failed or invalid screenshot uploads leave the field unchanged and unlocked', async () => {
	const input = { value: '', readOnly: false };
	await assert.rejects((await load())({ file, input, upload: async () => { throw new Error('offline'); }, isCurrent: () => true, onChange() {} }), /offline/);
	assert.equal(input.value, '');
	assert.equal(input.readOnly, false);
	await assert.rejects((await load())({ file: { type: 'text/html', size: 10 }, input, upload() { assert.fail(); }, isCurrent: () => true, onChange() {} }));
});

test('an old dialog upload cannot unlock or overwrite a newer upload', async () => {
	const apply = await load();
	const input = { value: '', readOnly: false };
	let resolveOld, resolveNew;
	const old = apply({ file, input, upload: () => new Promise(resolve => { resolveOld = resolve; }), isCurrent: () => false, onChange() { assert.fail(); } });
	// Reopening the dialog clears its input; a second upload can now start.
	input.readOnly = false;
	const next = apply({ file, input, upload: () => new Promise(resolve => { resolveNew = resolve; }), isCurrent: () => true, onChange() {} });
	resolveOld({ url: '/images/following/old.webp' });
	await assert.rejects(old);
	assert.equal(input.readOnly, true);
	assert.equal(input.value, '');
	resolveNew({ url: '/images/following/new.webp' });
	await next;
	assert.equal(input.value, '/images/following/new.webp');
	assert.equal(input.readOnly, false);
});
