import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { test } from 'node:test';
import yaml from 'js-yaml';
import { createEditorApi, parseMarkdown } from './api.mjs';
import { buildEditorTree } from './note-navigation.mjs';
import * as ordering from './file-order.mjs';

async function fixture(t) {
	const root = await fs.mkdtemp(path.join(os.tmpdir(), 'editor-order-'));
	t.after(() => fs.rm(root, { recursive: true, force: true }));
	const api = createEditorApi(root);
	return {
		async write(file, raw) {
			const target = path.join(root, 'src/content', file);
			await fs.mkdir(path.dirname(target), { recursive: true });
			await fs.writeFile(target, raw);
		},
		async read(file) { return fs.readFile(path.join(root, 'src/content', file), 'utf8'); },
		async request(method, url, payload) {
			const req = Readable.from(payload ? [Buffer.from(JSON.stringify(payload))] : []);
			req.method = method;
			req.url = url;
			let data;
			const res = { statusCode: 200, setHeader() {}, end(body) { data = JSON.parse(body); } };
			await api(req, res, () => { res.statusCode = 404; data = { error: 'Missing route' }; });
			return { status: res.statusCode, data };
		},
	};
}

const note = (title, order = '') => `---\ntitle: '${title}'\ndescription: 'Fixture'\npubDate: '2026-11-03'\n${order === '' ? '' : `order: ${order}\n`}---\n\n  Body with leading spaces.\n\n`;

test('parent articles and ordinary files share one stable sibling order', () => {
	const files = [
		{ collection: 'notes', path: 'notes/topic/parent.md', title: 'Parent', order: 3, space: 'ai-infra' },
		{ collection: 'notes', path: 'notes/topic/parent/child.md', title: 'Child', order: 1, space: 'ai-infra' },
		{ collection: 'notes', path: 'notes/topic/plain.md', title: 'Plain', order: 2, space: 'ai-infra' },
	];
	const tree = buildEditorTree(files, { collection: 'notes' });
	const group = tree.dirs.get('ai-infra').dirs.get('topic');
	assert.deepEqual(ordering.orderedSiblingFiles(group).map(file => file.title), ['Plain', 'Parent']);
	assert.deepEqual(ordering.findSiblingFiles(tree, files[0].path).map(file => file.title), ['Plain', 'Parent']);
	assert.deepEqual(ordering.findSiblingFiles(tree, files[1].path).map(file => file.title), ['Child']);
});

test('moving a sibling respects the boundaries and does not mutate the original sequence', () => {
	const original = ['a', 'b', 'c'];
	assert.deepEqual(ordering.moveSibling(original, 'b', 'up'), ['b', 'a', 'c']);
	assert.deepEqual(ordering.moveSibling(original, 'b', 'down'), ['a', 'c', 'b']);
	assert.deepEqual(ordering.moveSibling(original, 'a', 'up'), original);
	assert.deepEqual(original, ['a', 'b', 'c']);
});

test('reordering persists across reloads and preserves raw Markdown and unrelated YAML', async t => {
	const f = await fixture(t);
	const a = 'notes/custom/A.md', b = 'notes/custom/中文 B.mdx';
	const rawA = note('A', 5).replace("title: 'A'", "# keep this comment\ntitle: 'A'\ncustom: { keep: true }");
	const rawB = note('B').replace(/\n/g, '\r\n') + '\r\n<!-- trailing MDX comment -->\r\n';
	await f.write(a, rawA); await f.write(b, rawB);
	const result = await f.request('POST', '/reorder', { paths: [b, a], previousPaths: [b, a] });
	// B has no order, so the stable default puts B before order=5 A. Normalize explicitly.
	assert.equal(result.status, 200);
	assert.equal(parseMarkdown(await f.read(b)).frontmatter.order, 1);
	assert.equal(parseMarkdown(await f.read(a)).frontmatter.order, 2);
	assert.ok((await f.read(a)).includes('# keep this comment'));
	assert.deepEqual(parseMarkdown(await f.read(a)).frontmatter.custom, { keep: true });
	assert.equal(parseMarkdown(await f.read(a)).body, parseMarkdown(rawA).body);
	assert.equal(parseMarkdown(await f.read(b)).body, parseMarkdown(rawB).body);
	const listed = await f.request('GET', '/files');
	assert.deepEqual(listed.data.files.sort((x, y) => x.order - y.order).map(file => file.path), [b, a]);
});

test('moving a parent article leaves its descendants and their metadata untouched', async t => {
	const f = await fixture(t);
	const a = 'notes/custom/parent.md', b = 'notes/custom/plain.md', child = 'notes/custom/parent/chapter.md';
	await f.write(a, note('Parent', 1)); await f.write(b, note('Plain', 2));
	const rawChild = note('Child', 42); await f.write(child, rawChild);
	const result = await f.request('POST', '/reorder', { paths: [b, a], previousPaths: [a, b] });
	assert.equal(result.status, 200);
	assert.equal(parseMarkdown(await f.read(a)).frontmatter.order, 2);
	assert.equal(parseMarkdown(await f.read(b)).frontmatter.order, 1);
	assert.equal(await f.read(child), rawChild);
});

test('stale sequences and incomplete sibling lists fail without changing files', async t => {
	const f = await fixture(t);
	const a = 'notes/custom/a.md', b = 'notes/custom/b.md', c = 'notes/custom/c.md';
	for (const [i, file] of [a, b, c].entries()) await f.write(file, note(file, i + 1));
	const before = await Promise.all([a, b, c].map(file => f.read(file)));
	for (const payload of [
		{ paths: [b, a], previousPaths: [a, b] },
		{ paths: [b, a, c], previousPaths: [b, a, c] },
	]) assert.equal((await f.request('POST', '/reorder', payload)).status, 409);
	assert.deepEqual(await Promise.all([a, b, c].map(file => f.read(file))), before);
});

test('duplicate, cross-directory, cross-category and traversal requests are rejected', async t => {
	const f = await fixture(t);
	const a = 'notes/custom/a.md', b = 'notes/custom/b.md', c = 'notes/another/c.md';
	await f.write(a, note('A').replace('---\n\n', "space: 'ai-infra'\n---\n\n"));
	await f.write(b, note('B').replace('---\n\n', "space: 'ai-product'\n---\n\n"));
	await f.write(c, note('C'));
	const before = await Promise.all([a, b, c].map(file => f.read(file)));
	for (const paths of [[a, a], [a, b], [a, c], [a, '../escape.md']]) {
		const result = await f.request('POST', '/reorder', { paths, previousPaths: paths });
		assert.ok(result.status >= 400 && result.status < 500, JSON.stringify(result));
	}
	assert.deepEqual(await Promise.all([a, b, c].map(file => f.read(file))), before);
});

test('invalid YAML in a sibling aborts the entire reorder before any writes', async t => {
	const f = await fixture(t);
	const a = 'essays/a.md', b = 'essays/b.md';
	const rawA = note('A');
	await f.write(a, rawA); await f.write(b, '---\ntitle: [invalid\n---\nBody');
	const result = await f.request('POST', '/reorder', { paths: [b, a], previousPaths: [a, b] });
	assert.equal(result.status, 422);
	assert.equal(await f.read(a), rawA);
});

test('other collections retain a persistent editor file order too', async t => {
	const f = await fixture(t);
	for (const collection of ['essays', 'thoughts', 'following']) {
		const a = `${collection}/a.md`, b = `${collection}/b.md`;
		await f.write(a, note('A', 1)); await f.write(b, note('B', 2));
		assert.equal((await f.request('POST', '/reorder', { paths: [b, a], previousPaths: [a, b] })).status, 200);
		assert.equal(parseMarkdown(await f.read(b)).frontmatter.order, 1);
	}
});

test('flow mappings and anchored order values remain valid and keep unrelated metadata', async t => {
	for (const raw of [
		"---\n{title: A, description: Fixture, pubDate: '2026-11-03', custom: keep}\n---\n\nBody\n",
		"---\ntitle: A\ndescription: Fixture\npubDate: '2026-11-03'\norder: &position 3\ncustom: *position\n---\n\nBody\n",
	]) {
		const f = await fixture(t);
		const a = 'essays/a.md', b = 'essays/b.md';
		await f.write(a, raw); await f.write(b, note('B', 4));
		const before = parseMarkdown(raw);
		assert.equal((await f.request('POST', '/reorder', { paths: [b, a], previousPaths: [a, b] })).status, 200);
		const after = parseMarkdown(await f.read(a));
		assert.deepEqual(after.frontmatter, { ...before.frontmatter, order: 2 });
		assert.equal(after.body, before.body);
	}
});

test('fallback YAML serialization preserves full timestamps and their types', async t => {
	const f = await fixture(t);
	const a = 'essays/a.md', b = 'essays/b.md';
	const raw = "---\n{title: A, description: Fixture, pubDate: 2026-11-03T12:34:56Z, customTimestamp: 2026-11-03T22:10:12Z}\n---\n\nBody\n";
	await f.write(a, raw); await f.write(b, note('B', 3));
	assert.equal((await f.request('POST', '/reorder', { paths: [b, a], previousPaths: [a, b] })).status, 200);
	const rawData = text => yaml.load(text.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1]);
	assert.deepEqual(rawData(await f.read(a)), { ...rawData(raw), order: 2 });
});

test('saving a body from another tab preserves the latest order when its order field was unchanged', async t => {
	const f = await fixture(t);
	const a = 'notes/custom/a.md', b = 'notes/custom/b.md';
	await f.write(a, note('A', 1)); await f.write(b, note('B', 2));
	const opened = (await f.request('GET', `/file?path=${a}`)).data;
	await f.request('POST', '/reorder', { paths: [b, a], previousPaths: [a, b] });
	const saved = await f.request('POST', '/save', { ...opened, originalOrder: 1, body: 'New body from the other tab' });
	assert.equal(saved.status, 200);
	assert.equal(saved.data.order, 2);
	assert.equal(parseMarkdown(await f.read(a)).frontmatter.order, 2);
	assert.match(parseMarkdown(await f.read(a)).body, /New body from the other tab/);
});

test('explicit order edits save normally and conflicting edits fail without overwriting anything', async t => {
	const f = await fixture(t);
	const a = 'notes/custom/a.md';
	await f.write(a, note('A', 1));
	const opened = (await f.request('GET', `/file?path=${a}`)).data;
	const changed = { ...opened, originalOrder: 1, frontmatter: { ...opened.frontmatter, order: 7 } };
	assert.equal((await f.request('POST', '/save', changed)).status, 200);
	const before = await f.read(a);
	assert.equal((await f.request('POST', '/save', { ...changed, frontmatter: { ...changed.frontmatter, order: 4 } })).status, 409);
	assert.equal(await f.read(a), before);
	assert.equal((await f.request('POST', '/save', opened)).status, 409, 'Older editor clients cannot silently reset a newer order');
});
