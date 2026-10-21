import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildSync } from 'esbuild';

function compiled(entry) {
	const bundle = buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'esm', write: false });
	return import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
}

const spaces = await compiled('src/data/note-spaces.ts');
const trees = await compiled('src/data/notes.ts');
const note = (id, title, data = {}) => ({ id, data: { title, description: 'Fixture', pubDate: new Date('2026-10-12'), ...data } });

test('category series points to a dedicated topic directory instead of the first article', () => {
	const group = spaces.buildSpaceSeries([note('rl/a', 'A', { series: 'RL Algorithm' })], spaces.getNoteSpace('posttrain'))[0];
	assert.equal(group.slug, 'rl-algorithm');
	assert.equal(group.href, '/notes/posttrain/series/rl-algorithm/');
	assert.equal(group.notes.length, 1);
});

test('topic routes distinguish categories and colliding series names regardless of insertion order', () => {
	const items = [note('a', 'A', { space: 'ai-product', series: 'C++' }), note('b', 'B', { space: 'ai-product', series: 'C#' })];
	const area = spaces.getNoteSpace('ai-product');
	const groups = spaces.buildSpaceSeries(items, area);
	assert.equal(new Set(groups.map(group => group.href)).size, 2);
	assert.ok(groups.every(group => typeof group.href === 'string' && !group.href.includes('#') && !group.href.includes('+')));
	assert.deepEqual(groups.map(group => group.href), spaces.buildSpaceSeries([...items].reverse(), area).map(group => group.href));
	const sameName = spaces.buildSpaceSeries([note('c', 'C', { space: 'ai-infra', series: 'C++' })], spaces.getNoteSpace('ai-infra'))[0];
	assert.ok(sameName.href.startsWith('/notes/ai-infra/series/'));
});

test('generated topic slugs cannot collide with another series natural slug', () => {
	const names = ['C++', 'C#', 'c-f1deb75fa2', 'c-f1deb75fa2-2'];
	const items = names.map((series, index) => note(`topic-${index}`, series, { space: 'ai-product', series }));
	const area = spaces.getNoteSpace('ai-product');
	const groups = spaces.buildSpaceSeries(items, area);
	assert.equal(new Set(groups.map(group => group.href)).size, names.length);
	assert.deepEqual(groups.map(group => group.href), spaces.buildSpaceSeries([...items].reverse(), area).map(group => group.href));
});

test('book contents pairs a parent with its children without losing the original article', () => {
	assert.equal(typeof trees.buildNoteContents, 'function');
	const items = [note('rl/一些杂谈', 'RL杂谈'), note('rl/一些杂谈/reward', '奖励设计', { order: 1 }), note('rl/mdp', 'MDP')];
	const nodes = trees.buildNoteContents(items);
	const parent = nodes.find(node => node.kind === 'group');
	assert.equal(parent.title, 'RL杂谈');
	assert.equal(parent.entry.id, 'rl/一些杂谈');
	assert.equal(parent.children[0].id, 'rl/一些杂谈/reward');
	assert.equal(nodes.filter(node => node.kind === 'item').length, 1);
});

test('book contents keeps folders without overview articles and handles empty topics', () => {
	assert.equal(typeof trees.buildNoteContents, 'function');
	const nodes = trees.buildNoteContents([note('ccl/index', 'Overview'), note('ccl/primitives/a', 'Primitive')]);
	assert.equal(nodes.find(node => node.kind === 'group').children[0].title, 'Primitive');
	assert.deepEqual(trees.buildNoteContents([]), []);
});
