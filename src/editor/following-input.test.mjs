import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as following from '../data/following-config.mjs';

const input = () => import('./following-input.mjs');

test('a new Following source stores its chosen category, real URL, RSS and Markdown reason', async () => {
	const { buildFollowingDraft } = await input();
	const result = buildFollowingDraft({
		name: '  Design Notes  ', url: ' https://example.com/design ', category: 'design', tags: ' 灵感，网页设计,自定义标签,灵感 ',
		previewImage: '/images/following/inspora.webp',
		rss: 'https://example.com/feed.xml', note: '记录 **界面细节**。\n', addedDate: '2026-11-06',
	});
	assert.equal(result.path, 'following/design-notes.md');
	assert.deepEqual(result.frontmatter, {
		name: 'Design Notes', url: 'https://example.com/design', category: 'design',
		previewImage: '/images/following/inspora.webp',
		rss: 'https://example.com/feed.xml', addedDate: '2026-11-06', active: true, tags: ['灵感', '网页设计', '自定义标签'],
	});
	assert.equal(result.body, '记录 **界面细节**。\n');
});

test('automatic names support Unicode and avoid existing Markdown files without changing explicit names', async () => {
	const { followingFilePath } = await input();
	assert.equal(followingFilePath({ name: '新 灵感 & Tools' }), 'following/新-灵感-tools.md');
	assert.equal(followingFilePath({ name: 'Example', existingPaths: ['following/example.mdx', 'following/Example-2.md'] }), 'following/example-3.md');
	assert.equal(followingFilePath({ name: 'Example', filename: 'chosen', dir: 'studio' }), 'following/studio/chosen.md');
	assert.equal(followingFilePath({ name: '' }), '');
	assert.throws(() => followingFilePath({ name: 'Example', filename: 'chosen', existingPaths: ['following/chosen.md'] }), /已存在/);
	assert.throws(() => followingFilePath({ name: 'Example', filename: '../escape' }), /路径/);
});

test('minimal source creation uses an empty reason and omits optional RSS', async () => {
	const { buildFollowingDraft } = await input();
	const draft = buildFollowingDraft({ name: 'A', url: 'https://example.com', category: 'engineering', addedDate: '2026-11-06' });
	assert.equal(draft.frontmatter.kind, undefined);
	assert.deepEqual(draft.frontmatter.tags, []);
	assert.equal(draft.frontmatter.rss, undefined);
	assert.equal(draft.frontmatter.previewImage, undefined);
	assert.equal(draft.body, '');
});

test('invalid source fields are rejected before a draft is produced', async () => {
	const { buildFollowingDraft } = await input();
	const valid = { name: 'A', url: 'https://example.com', category: 'research', addedDate: '2026-11-06' };
	for (const fields of [{ name: '' }, { url: '' }, { url: 'example.com' }, { url: 'javascript:alert(1)' }, { category: 'typo' }, { tags: 123 }, { tags: ['valid', 123] }, { rss: 'bad RSS' }, { previewImage: 'javascript:alert(1)' }, { previewImage: 'file:///private/image.png' }]) {
		assert.throws(() => buildFollowingDraft({ ...valid, ...fields }));
	}
});

test('a website homepage cannot be used as its screenshot image URL', async () => {
	const { buildFollowingDraft } = await input();
	const source = { name: 'Awwwards', url: 'https://www.awwwards.com/', category: 'design' };
	for (const previewImage of ['https://www.awwwards.com/', 'https://awwwards.com', 'http://www.awwwards.com/#home', 'https://www.awwwards.com/?utm_source=test']) {
		assert.throws(() => buildFollowingDraft({ ...source, previewImage }), /图片直链/);
	}
	for (const previewImage of ['/images/following/awwwards.webp', 'https://www.awwwards.com/assets/home.webp', 'https://images.example.com/render?id=awwwards']) {
		assert.equal(buildFollowingDraft({ ...source, previewImage }).frontmatter.previewImage, previewImage);
	}
});

test('Following content IDs keep distinct filenames distinct through punctuation and index paths', () => {
	assert.equal(typeof following.followingEntryId, 'function');
	const paths = ['C++.md', 'c.md', 'studio/index.md', 'studio.md', 'studio.mdx', 'foo.md', 'following/foo.md', 'src/content/following/foo.md'];
	const ids = paths.map(file => following.followingEntryId(file));
	assert.equal(new Set(ids).size, paths.length);
	assert.deepEqual(ids, paths);
});


test('source anchors distinguish Markdown extensions and nested directories', () => {
 const files = ['studio.md', 'studio.mdx', 'studio.mdx.md', 'following/studio.md'];
 const anchors = files.map(file => following.followingEntryAnchor(`src/content/following/${file}`));
 assert.equal(new Set(anchors).size, files.length);
 assert.deepEqual(anchors, files);
});
