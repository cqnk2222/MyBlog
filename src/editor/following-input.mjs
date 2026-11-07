import { getFollowingCategory } from '../data/following-config.mjs';

function requireWebUrl(value, label) {
	try {
		if (typeof value !== 'string' || !/^https?:\/\//i.test(value.trim())) throw new Error();
		const url = new URL(value);
		if (!url.hostname) throw new Error();
	} catch {
		throw new Error(`${label}请填写完整的 http:// 或 https:// 地址`);
	}
}

export function validateFollowingPreview(value, sourceUrl) {
	if (value === undefined) return;
	const localPreview = typeof value === 'string' && value.startsWith('/images/')
		&& !/[?#\\\s%]/.test(value) && !value.split('/').some(part => part === '.' || part === '..');
	if (localPreview) return;
	requireWebUrl(value, '网站截图');
	let source;
	try { source = new URL(sourceUrl); } catch { return; }
	const image = new URL(value);
	const host = url => url.host.replace(/^www\./i, '');
	const pathname = url => url.pathname.replace(/\/+$/, '');
	if (host(image) === host(source) && pathname(image) === pathname(source)) {
		throw new Error('网站截图需要图片直链，不能填写主页链接；请上传截图，或粘贴图片的完整地址');
	}
}

export function validateFollowingSource(data) {
	if (typeof data.name !== 'string' || !data.name.trim()) throw new Error('请填写来源名称');
	if (!getFollowingCategory(data.category)) throw new Error('请选择有效的关注分类');
	requireWebUrl(data.url, '主页链接');
	validateFollowingPreview(data.previewImage, data.url);
	if (data.rss !== undefined) requireWebUrl(data.rss, 'RSS');
	if (data.tags !== undefined && (!Array.isArray(data.tags) || data.tags.some(tag => typeof tag !== 'string'))) {
		throw new Error('标签需要是自定义文字列表');
	}
}

function customTags(value) {
	const tags = typeof value === 'string' ? value.split(/[,，]/) : value;
	if (!Array.isArray(tags) || tags.some(tag => typeof tag !== 'string')) throw new Error('标签需要是自定义文字列表');
	return [...new Set(tags.map(tag => tag.trim()).filter(Boolean))];
}

/** Blank filenames are generated without overwriting an existing Markdown source. */
export function followingFilePath({ name = '', filename = '', dir = '', existingPaths = [] } = {}) {
	const directory = dir.trim().replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
	const explicit = filename.trim().replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
	if ([directory, explicit].some(value => value.split('/').some(part => part === '..' || part === '.') || value.includes('\0'))) {
		throw new Error('文件路径不能包含 . 或 .. 目录');
	}
	const prefix = ['following', directory].filter(Boolean).join('/');
	const key = value => value.replace(/\.mdx?$/i, '').normalize('NFKC').toLowerCase();
	const used = new Set(existingPaths.map(key));
	if (explicit) {
		const file = /\.mdx?$/.test(explicit) ? explicit : `${explicit}.md`;
		const target = `${prefix}/${file}`;
		if (used.has(key(target))) throw new Error('文件名已存在，请更换文件名或留空自动生成');
		return target;
	}
	if (!name.trim()) return '';
	const stem = name.normalize('NFKC').trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '') || 'source';
	let candidate = `${prefix}/${stem}`;
	for (let index = 2; used.has(key(candidate)); index++) candidate = `${prefix}/${stem}-${index}`;
	return `${candidate}.md`;
}

export function buildFollowingDraft({ name = '', url = '', category, tags = '', rss = '', previewImage = '', note = '', addedDate = new Date().toISOString().slice(0, 10), ...location }) {
	const frontmatter = {
		name: name.trim(), url: url.trim(), category,
		...(previewImage.trim() ? { previewImage: previewImage.trim() } : {}),
		...(rss.trim() ? { rss: rss.trim() } : {}),
		addedDate, active: true, tags: customTags(tags),
	};
	validateFollowingSource(frontmatter);
	return {
		path: followingFilePath({ ...location, name: frontmatter.name }),
		frontmatter,
		body: note.trim() ? `${note.trimEnd()}\n` : '',
	};
}
