import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { test } from 'node:test';
import { createEditorApi, serializeMarkdown } from './api.mjs';
import { buildEditorTree, expandFileAncestors } from './note-navigation.mjs';
import * as navigation from './note-navigation.mjs';
import { NOTE_SPACES } from '../data/note-space-config.mjs';

async function fixture(t) {
	const root = await fs.mkdtemp(path.join(os.tmpdir(), 'editor-spaces-'));
	t.after(() => fs.rm(root, { recursive: true, force: true }));
	const middleware = createEditorApi(root);
	return {
		async request(method, url, payload) {
			const req = Readable.from(payload ? [Buffer.from(JSON.stringify(payload))] : []);
			req.method = method;
			req.url = url;
			let data;
			const res = { statusCode: 200, setHeader() {}, end(body) { data = JSON.parse(body); } };
			await middleware(req, res, () => assert.fail(`Unexpected route: ${url}`));
			return { status: res.statusCode, data };
		},
		async note(file, frontmatter = {}) {
			const target = path.join(root, 'src/content/notes', file);
			await fs.mkdir(path.dirname(target), { recursive: true });
			await fs.writeFile(target, serializeMarkdown('notes', {
				title: file, description: 'Fixture', pubDate: '2026-10-09', ...frontmatter,
			}, 'Fixture body'));
		},
	};
}

test('editor classifies legacy series and slugged folder names in the website categories', async (t) => {
	const api = await fixture(t);
	const expected = [
		['computer-organization/a.md', { series: '计算机组成原理' }, 'course-notes'],
		['nlp/a.md', { series: 'Transformer 笔记' }, 'pretrain'],
		['rl-algorithm/a.md', { series: 'RL Algorithm' }, 'posttrain'],
		['CCL/a.md', { series: 'CCL' }, 'ai-infra'],
		['vLLM/1.md', {}, 'ai-infra'],
		['Kernel/FlashAttention/1.md', {}, 'ai-infra'],
		['Silicon & Photons/1.md', {}, 'ai-infra'],
		['AI Communication/CCL/1.md', {}, 'ai-infra'],
		['Agent/Prompt/Instruction.md', {}, 'ai-product'],
	];
	for (const [file, data] of expected) await api.note(file, data);
	const { data: { files } } = await api.request('GET', '/files');
	for (const [file, , space] of expected) {
		assert.equal(files.find(entry => entry.path === `notes/${file}`)?.space, space, file);
		const { data } = await api.request('GET', `/file?path=${encodeURIComponent(`notes/${file}`)}`);
		assert.equal(data.space, space, `Read category for ${file}`);
		assert.equal(data.frontmatter.space, undefined, 'Inference must not change frontmatter');
	}
});

test('new notes can be created in every category without relying on known series or directories', async (t) => {
	const api = await fixture(t);
	for (const space of ['course-notes', 'pretrain', 'posttrain', 'ai-infra', 'ai-product']) {
		const { status } = await api.request('POST', '/create', {
			path: `notes/new/${space}.md`,
			frontmatter: { title: space, description: 'Fixture', pubDate: '2026-10-09', space },
			body: 'New series',
		});
		assert.equal(status, 201);
	}
	const { data: { files } } = await api.request('GET', '/files');
	assert.deepEqual(files.map(file => file.space).sort(), ['ai-infra', 'ai-product', 'course-notes', 'posttrain', 'pretrain']);
});

test('explicit category overrides legacy membership on edit', async (t) => {
	const api = await fixture(t);
	await api.note('vLLM/1.md');
	const { data } = await api.request('GET', '/file?path=notes/vLLM/1.md');
	const saved = await api.request('POST', '/save', {
		...data, frontmatter: { ...data.frontmatter, space: 'posttrain' },
	});
	assert.equal(saved.status, 200);
	assert.equal(saved.data.space, 'posttrain');
	const { data: { files } } = await api.request('GET', '/files');
	assert.equal(files[0].space, 'posttrain');
});

test('invalid categories are rejected before creating a note', async (t) => {
	const api = await fixture(t);
	const { status } = await api.request('POST', '/create', {
		path: 'notes/invalid.md',
		frontmatter: { title: 'Invalid', description: 'Fixture', pubDate: '2026-10-09', space: 'typo' },
		body: 'Body',
	});
	assert.equal(status, 422);
	assert.deepEqual((await api.request('GET', '/files')).data.files, []);
});

test('navigation includes all categories, retains real folder context, and expands hash targets', () => {
	const file = { collection: 'notes', space: 'ai-product', path: 'notes/Agent/Prompt/instruction.md' };
	const tree = buildEditorTree([file], { collection: 'notes' });
	assert.deepEqual([...tree.dirs.values()].map(dir => dir.name), NOTE_SPACES.map(space => space.title));
	assert.equal(tree.dirs.get('posttrain').count, 0);
	assert.equal(tree.dirs.get('ai-product')?.count, 1);
	assert.equal(tree.dirs.get('ai-infra').count, 0);
	const folder = tree.dirs.get('ai-product').dirs.get('Agent').dirs.get('Prompt');
	assert.equal(folder.dir, 'Agent/Prompt');
	assert.equal(folder.collection, 'notes');
	assert.equal(folder.space, 'ai-product');
	const collapsed = new Set(['notes@ai-product', 'notes@ai-product/Agent', folder.key]);
	assert.equal(expandFileAncestors(tree, file.path, collapsed), true);
	assert.equal(collapsed.size, 0);
});

test('navigation retains unclassified notes and other collections; search hides empty categories', () => {
	const note = { collection: 'notes', space: null, path: 'notes/custom/a.md' };
	const essay = { collection: 'essays', path: 'essays/鲁迅/a.md' };
	const tree = buildEditorTree([note, essay]);
	assert.equal(tree.dirs.get('notes').dirs.get('unclassified').dirs.get('custom').files[0], note);
	assert.equal(tree.dirs.get('essays').dirs.get('鲁迅').dir, '鲁迅');
	const results = buildEditorTree([note], { collection: 'notes', search: 'custom' });
	assert.deepEqual([...results.dirs.keys()], ['unclassified']);
	assert.equal(buildEditorTree([], { collection: 'notes', search: 'missing' }).dirs.size, 0);
});

test('child note context inherits the parent metadata and continues child order', () => {
	assert.equal(typeof navigation.getChildNoteContext, 'function', 'Child creation is available');
	const parent = { collection: 'notes', path: 'notes/rl-algorithm/一些杂谈.md', url: '/notes/rl-algorithm/一些杂谈/',
		space: 'posttrain', frontmatter: { title: 'RL杂谈', series: 'RL Algorithm', section: '强化学习', order: 10 } };
	const context = navigation.getChildNoteContext(parent, [
		{ collection: 'notes', path: 'notes/rl-algorithm/一些杂谈/01.md', order: 11 },
		{ collection: 'notes', path: 'notes/rl-algorithm/一些杂谈/02.md', order: 15 },
		{ collection: 'notes', path: 'notes/other/99.md', order: 99 },
	]);
	assert.deepEqual(context, { collection: 'notes', dir: 'rl-algorithm/一些杂谈', space: 'posttrain',
		series: 'RL Algorithm', section: '强化学习', order: 16, parentPath: parent.path, parentTitle: 'RL杂谈' });
});

test('child note context supports nested chapters, index overviews and path-inferred series', () => {
	assert.equal(typeof navigation.getChildNoteContext, 'function');
	const base = { collection: 'notes', space: 'ai-infra', groupSeries: 'vLLM', frontmatter: { title: 'Overview' } };
	assert.equal(navigation.getChildNoteContext({ ...base, path: 'notes/vLLM/index.md' }, []).dir, 'vLLM');
	const child = navigation.getChildNoteContext({ ...base, path: 'notes/vLLM/chapter/01.mdx' }, []);
	assert.equal(child.dir, 'vLLM/chapter/01');
	assert.equal(child.series, 'vLLM');
	assert.equal(child.order, 1);
	const overview = navigation.getChildNoteContext({ ...base, path: 'notes/vLLM/index.md' }, [
		{ collection: 'notes', path: 'notes/vLLM/index.md', order: null },
		{ collection: 'notes', path: 'notes/vLLM/01.md', order: 1 },
	]);
	assert.equal(overview.order, 2, 'The overview itself is not counted as a chapter');
	assert.throws(() => navigation.getChildNoteContext({ ...base, collection: 'essays', path: 'essays/a.md' }, []));
});

test('a parent note and matching directory appear as one expandable note with its original path', () => {
	const parent = { collection: 'notes', space: 'posttrain', path: 'notes/rl-algorithm/一些杂谈.md', title: 'RL杂谈' };
	const child = { collection: 'notes', space: 'posttrain', path: 'notes/rl-algorithm/一些杂谈/01.md', title: '奖励设计' };
	const tree = buildEditorTree([parent, child], { collection: 'notes' });
	const folder = tree.dirs.get('posttrain').dirs.get('rl-algorithm');
	const group = folder.dirs.get('一些杂谈');
	assert.equal(group.entry, parent);
	assert.equal(group.name, 'RL杂谈');
	assert.deepEqual(group.files, [child]);
	assert.deepEqual(folder.files, []);
	const collapsed = new Set([group.key]);
	assert.equal(expandFileAncestors(tree, parent.path, collapsed), true);
	assert.equal(collapsed.size, 0);
});

test('an unclassified parent keeps its child unclassified and in the same hierarchy', async (t) => {
	const api = await fixture(t);
	await api.note('custom/parent.md');
	const { data: parent } = await api.request('GET', '/file?path=notes/custom/parent.md');
	const context = navigation.getChildNoteContext(parent, []);
	assert.equal(context.space, null);
	const created = await api.request('POST', '/create', {
		path: `notes/${context.dir}/child.md`,
		frontmatter: { title: 'Child', description: 'Fixture', pubDate: '2026-10-12' }, body: 'Child body',
	});
	assert.equal(created.status, 201);
	assert.equal(created.data.space, null);
	const { data: { files } } = await api.request('GET', '/files');
	const tree = buildEditorTree(files, { collection: 'notes' });
	const group = tree.dirs.get('unclassified').dirs.get('custom').dirs.get('parent');
	assert.equal(group.entry.path, parent.path);
	assert.equal(group.files[0].title, 'Child');
});

test('consecutive editor saves keep a changed inferred category without persisting the stale selector', async (t) => {
	const api = await fixture(t);
	await api.note('custom/a.md', { series: 'Transformer 笔记' });
	const { data: current } = await api.request('GET', '/file?path=notes/custom/a.md');
	const source = await fs.readFile(new URL('./EditorPage.astro', import.meta.url), 'utf8');
	const collector = source.slice(source.indexOf('function collectFrontmatter()'), source.indexOf('/* ------------------------------------------------------------- file */'));
	const saver = source.slice(source.indexOf('async function save('), source.indexOf('async function removeFile('));
	const orderSync = source.slice(source.indexOf('function syncCurrentOrder('), source.indexOf('function renderTabs('));
	const spaceInput = { dataset: { key: 'space', type: 'select' }, value: 'pretrain' };
	const seriesInput = { dataset: { key: 'series', type: 'text' }, value: 'CCL' };
	const state = { current, preview: 'draft', collapsed: new Set() };
	const els = {
		fields: { querySelectorAll: () => [spaceInput, seriesInput], querySelector: selector => selector.includes('space') ? spaceInput : null },
		body: { value: current.body }, save: { setAttribute() {} },
	};
	const globals = {
		state, els,
		api: async (url, options) => {
			const response = await api.request(options.method, url, JSON.parse(options.body));
			assert.equal(response.status, 200);
			return response.data;
		},
		setDirty() {}, toast(message, kind) { if (kind === 'error') assert.fail(message); },
		loadFiles: async () => {}, loadGit: async () => {}, renderTree() {},
		visibleFiles: () => [], buildTree: files => buildEditorTree(files, { collection: 'notes' }),
		expandFileAncestors,
	};
	const save = Function(...Object.keys(globals), `${collector}\n${orderSync}\n${saver}\nreturn save;`)(...Object.values(globals));
	await save();
	assert.equal(state.current.space, 'ai-infra');
	assert.equal(state.current.frontmatter.space, undefined);
	els.body.value += '\nBody-only edit';
	await save();
	assert.equal(state.current.space, 'ai-infra');
	assert.equal(state.current.frontmatter.space, undefined);
});
