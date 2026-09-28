/**
 * 本地编辑器的后端。只在 `astro dev` 里通过 Vite 中间件挂载，
 * 生产构建完全不会包含这段代码（见 integration.mjs 的 command 判断）。
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import yaml from 'js-yaml';
import { COLLECTIONS, fieldOrder } from './schema.mjs';

const execFileAsync = promisify(execFile);

const CONTENT_SUBDIR = 'src/content';
const MARKDOWN_RE = /\.mdx?$/;
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

class HttpError extends Error {
	constructor(status, message) {
		super(message);
		this.status = status;
	}
}

/* ---------------------------------------------------------------- paths */

function contentRootOf(projectRoot) {
	return path.join(projectRoot, CONTENT_SUBDIR);
}

/** 把客户端传来的相对路径限制在 src/content/<已知 collection>/ 之内。 */
function resolveContentPath(projectRoot, relPath) {
	if (typeof relPath !== 'string' || relPath.trim() === '') {
		throw new HttpError(400, '缺少 path 参数');
	}

	const normalized = relPath.replace(/\\/g, '/').replace(/^\/+/, '');
	const contentRoot = contentRootOf(projectRoot);
	const absolute = path.resolve(contentRoot, normalized);
	const relative = path.relative(contentRoot, absolute);

	if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative)) {
		throw new HttpError(400, `路径越界：${relPath}`);
	}

	const [collection] = relative.split(path.sep);
	if (!COLLECTIONS[collection]) {
		throw new HttpError(400, `未知 collection：${collection}`);
	}

	if (!MARKDOWN_RE.test(absolute)) {
		throw new HttpError(400, '只能编辑 .md / .mdx 文件');
	}

	return { absolute, relative: relative.split(path.sep).join('/'), collection };
}

/** 复刻 Astro glob loader 的 id 生成规则，用来拼出这篇笔记的线上地址。 */
function toEntryId(relativePath) {
	const withoutExtension = relativePath.replace(MARKDOWN_RE, '');
	const segments = withoutExtension.split('/').slice(1); // 去掉 collection 目录

	if (segments.at(-1) === 'index') segments.pop();

	return segments
		.map((segment) =>
			segment
				.toLowerCase()
				.replace(/\s+/g, '-')
				.replace(/[^\p{L}\p{N}\-_]/gu, ''),
		)
		.filter(Boolean)
		.join('/');
}

function entryUrl(collection, relativePath) {
	const config = COLLECTIONS[collection];
	const base = config?.routeBase ?? '';

	// following 这类没有单条详情页的 collection，预览直接指向索引页
	if (config?.singlePage) return `${base}/`;

	const id = toEntryId(relativePath);
	return id ? `${base}/${id}/` : base;
}

async function walkMarkdown(dir) {
	let entries;
	try {
		entries = await fs.readdir(dir, { withFileTypes: true });
	} catch (error) {
		if (error.code === 'ENOENT') return [];
		throw error;
	}

	const files = [];
	for (const entry of entries) {
		if (entry.name.startsWith('.')) continue;
		const absolute = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await walkMarkdown(absolute)));
		} else if (MARKDOWN_RE.test(entry.name)) {
			files.push(absolute);
		}
	}
	return files;
}

/* ---------------------------------------------------------- frontmatter */

export function parseMarkdown(raw) {
	const match = raw.match(FRONTMATTER_RE);
	if (!match) return { frontmatter: {}, body: raw };

	let frontmatter;
	try {
		frontmatter = yaml.load(match[1]) ?? {};
	} catch (error) {
		throw new HttpError(422, `frontmatter YAML 解析失败：${error.message}`);
	}

	if (typeof frontmatter !== 'object' || Array.isArray(frontmatter)) {
		throw new HttpError(422, 'frontmatter 必须是一个对象');
	}

	// 未加引号的日期会被 YAML 解析成 Date，统一转回 YYYY-MM-DD 字符串方便表单编辑。
	for (const [key, value] of Object.entries(frontmatter)) {
		if (value instanceof Date) {
			frontmatter[key] = value.toISOString().slice(0, 10);
		}
	}

	return { frontmatter, body: raw.slice(match[0].length) };
}

export function serializeMarkdown(collection, frontmatter, body) {
	const ordered = {};
	const known = fieldOrder(collection);

	for (const key of known) {
		const value = frontmatter[key];
		if (value === undefined || value === null || value === '') continue;
		if (Array.isArray(value) && value.length === 0) continue;
		ordered[key] = value;
	}

	// schema 之外的字段（heroImage、coverImage 等）原样保留，避免编辑时丢数据。
	for (const [key, value] of Object.entries(frontmatter)) {
		if (key in ordered || known.includes(key)) continue;
		if (value === undefined || value === null || value === '') continue;
		ordered[key] = value;
	}

	// forceQuotes 让标量保持站点现有的 'xxx' 写法（也避免 pubDate: '2026-06' 被当成日期），
	// 但列表项（tags）现有风格是不带引号的，这里按需还原，免得一编辑就产生纯格式 diff。
	const yamlText = relaxSequenceQuotes(
		yaml.dump(ordered, { lineWidth: -1, quotingType: "'", forceQuotes: true, noRefs: true }),
	).trimEnd();

	const trimmedBody = body.replace(/^\s+/, '').replace(/\s+$/, '');
	return `---\n${yamlText}\n---\n\n${trimmedBody}\n`;
}

/** YAML 1.1 里会被解析成布尔/空值的裸词，这些必须保留引号。 */
const AMBIGUOUS_SCALARS = new Set(['y', 'n', 'yes', 'no', 'true', 'false', 'on', 'off', 'null']);

// 必须以字母开头（\p{L} 覆盖中文），这样 '123'、'1-2' 这类会被 YAML 读成数字的值仍然保留引号。
function relaxSequenceQuotes(yamlText) {
	return yamlText.replace(/^(\s*- )'(\p{L}[\p{L}\p{N}_-]*)'$/gmu, (match, prefix, value) =>
		AMBIGUOUS_SCALARS.has(value.toLowerCase()) ? match : prefix + value,
	);
}

/** 中文按 400 字/分钟、英文按 200 词/分钟估算。 */
export function estimateReadingTime(body) {
	const text = body.replace(/```[\s\S]*?```/g, ' ').replace(/<[^>]+>/g, ' ');
	const cjk = (text.match(/[一-鿿㐀-䶿]/g) ?? []).length;
	const words = (text.replace(/[一-鿿㐀-䶿]/g, ' ').match(/[A-Za-z0-9][A-Za-z0-9'-]*/g) ?? []).length;
	const minutes = Math.max(1, Math.ceil(cjk / 400 + words / 200));
	return `${minutes} min read`;
}

/* -------------------------------------------------------------- preview */

let processorPromise;

async function renderMarkdown(body) {
	processorPromise ??= import('@astrojs/markdown-remark').then((module) => module.createMarkdownProcessor({}));
	const processor = await processorPromise;
	const result = await processor.render(body);
	return result.code;
}

/* ------------------------------------------------------------------ git */

async function git(projectRoot, args) {
	try {
		const { stdout, stderr } = await execFileAsync('git', args, { cwd: projectRoot, maxBuffer: 8 * 1024 * 1024 });
		return { ok: true, stdout, stderr, command: `git ${args.join(' ')}` };
	} catch (error) {
		return {
			ok: false,
			stdout: error.stdout ?? '',
			stderr: error.stderr ?? error.message,
			command: `git ${args.join(' ')}`,
		};
	}
}

async function gitStatus(projectRoot) {
	const branch = await git(projectRoot, ['rev-parse', '--abbrev-ref', 'HEAD']);
	const status = await git(projectRoot, ['status', '--porcelain', '--', CONTENT_SUBDIR]);

	const changes = status.stdout
		.split('\n')
		.filter(Boolean)
		.map((line) => ({ state: line.slice(0, 2).trim(), path: line.slice(3).trim() }));

	return {
		branch: branch.ok ? branch.stdout.trim() : null,
		changes,
		error: branch.ok ? null : branch.stderr.trim(),
	};
}

async function publish(projectRoot, { message, push }) {
	if (typeof message !== 'string' || message.trim() === '') {
		throw new HttpError(400, '请填写 commit message');
	}

	const steps = [];
	const run = async (args) => {
		const result = await git(projectRoot, args);
		steps.push(result);
		return result;
	};

	const status = await gitStatus(projectRoot);
	if (status.changes.length === 0) {
		return { ok: false, steps, status, note: 'src/content 下没有待提交的改动' };
	}

	const added = await run(['add', '--', CONTENT_SUBDIR]);
	if (!added.ok) return { ok: false, steps, status: await gitStatus(projectRoot) };

	const committed = await run(['commit', '-m', message.trim(), '--', CONTENT_SUBDIR]);
	if (!committed.ok) return { ok: false, steps, status: await gitStatus(projectRoot) };

	if (push) {
		const pushed = await run(['push', '-u', 'origin', 'HEAD']);
		if (!pushed.ok) return { ok: false, steps, status: await gitStatus(projectRoot) };
	}

	return { ok: true, steps, status: await gitStatus(projectRoot) };
}

/* ------------------------------------------------------------- handlers */

async function listFiles(projectRoot) {
	const contentRoot = contentRootOf(projectRoot);
	const files = [];

	for (const [collection, config] of Object.entries(COLLECTIONS)) {
		const absolutePaths = await walkMarkdown(path.join(contentRoot, config.dir));

		for (const absolute of absolutePaths) {
			const relative = path.relative(contentRoot, absolute).split(path.sep).join('/');
			const stats = await fs.stat(absolute);

			let data = {};
			try {
				data = parseMarkdown(await fs.readFile(absolute, 'utf8')).frontmatter;
			} catch {
				// frontmatter 坏了也要能在列表里看到并打开修复
			}

			files.push({
				path: relative,
				collection,
				dir: path.dirname(relative).split('/').slice(1).join('/'),
				name: path.basename(relative),
				// following 用 name 而不是 title
				title:
					typeof data.title === 'string'
						? data.title
						: typeof data.name === 'string'
							? data.name
							: path.basename(relative),
				order: typeof data.order === 'number' ? data.order : null,
				series: typeof data.series === 'string' ? data.series : null,
				section: typeof data.section === 'string' ? data.section : null,
				org: typeof data.org === 'string' ? data.org : null,
				url: entryUrl(collection, relative),
				modified: stats.mtimeMs,
			});
		}
	}

	return files;
}

async function readFile(projectRoot, relPath) {
	const { absolute, relative, collection } = resolveContentPath(projectRoot, relPath);

	let raw;
	try {
		raw = await fs.readFile(absolute, 'utf8');
	} catch (error) {
		if (error.code === 'ENOENT') throw new HttpError(404, `文件不存在：${relative}`);
		throw error;
	}

	const { frontmatter, body } = parseMarkdown(raw);
	return { path: relative, collection, frontmatter, body, url: entryUrl(collection, relative) };
}

async function writeFile(projectRoot, payload, { mustBeNew }) {
	const { absolute, relative, collection } = resolveContentPath(projectRoot, payload.path);
	const frontmatter = payload.frontmatter ?? {};
	const body = typeof payload.body === 'string' ? payload.body : '';

	const exists = await fs
		.access(absolute)
		.then(() => true)
		.catch(() => false);

	if (mustBeNew && exists) throw new HttpError(409, `文件已存在：${relative}`);
	if (!mustBeNew && !exists) throw new HttpError(404, `文件不存在：${relative}`);

	for (const field of COLLECTIONS[collection].fields) {
		if (!field.required) continue;
		const value = frontmatter[field.key];
		if (value === undefined || value === null || String(value).trim() === '') {
			throw new HttpError(422, `「${field.label}」是必填字段`);
		}
	}

	await fs.mkdir(path.dirname(absolute), { recursive: true });
	await fs.writeFile(absolute, serializeMarkdown(collection, frontmatter, body), 'utf8');

	return { path: relative, collection, url: entryUrl(collection, relative) };
}

/** 删除/移动后清掉留下的空目录，避免侧栏出现空文件夹。collection 根目录本身保留。 */
async function pruneEmptyDirs(projectRoot, startDir) {
	const contentRoot = contentRootOf(projectRoot);
	let current = startDir;

	while (path.relative(contentRoot, current).split(path.sep).length > 1) {
		const entries = await fs.readdir(current).catch(() => null);
		if (entries === null || entries.length > 0) return;
		await fs.rmdir(current).catch(() => {});
		current = path.dirname(current);
	}
}

async function deleteFile(projectRoot, relPath) {
	const { absolute, relative } = resolveContentPath(projectRoot, relPath);
	try {
		await fs.unlink(absolute);
	} catch (error) {
		if (error.code === 'ENOENT') throw new HttpError(404, `文件不存在：${relative}`);
		throw error;
	}
	await pruneEmptyDirs(projectRoot, path.dirname(absolute));
	return { path: relative };
}

async function moveFile(projectRoot, from, to) {
	const source = resolveContentPath(projectRoot, from);
	const target = resolveContentPath(projectRoot, to);

	if (source.collection !== target.collection) {
		throw new HttpError(400, '暂不支持跨 collection 移动');
	}

	const targetExists = await fs
		.access(target.absolute)
		.then(() => true)
		.catch(() => false);
	if (targetExists) throw new HttpError(409, `目标已存在：${target.relative}`);

	await fs.mkdir(path.dirname(target.absolute), { recursive: true });
	await fs.rename(source.absolute, target.absolute);
	await pruneEmptyDirs(projectRoot, path.dirname(source.absolute));

	return { path: target.relative, url: entryUrl(target.collection, target.relative) };
}

/* ------------------------------------------------------------ transport */

function sendJson(res, status, data) {
	res.statusCode = status;
	res.setHeader('Content-Type', 'application/json; charset=utf-8');
	res.setHeader('Cache-Control', 'no-store');
	res.end(JSON.stringify(data));
}

async function readJsonBody(req) {
	const chunks = [];
	for await (const chunk of req) chunks.push(chunk);
	if (chunks.length === 0) return {};
	try {
		return JSON.parse(Buffer.concat(chunks).toString('utf8'));
	} catch {
		throw new HttpError(400, '请求体不是合法 JSON');
	}
}

/**
 * 返回一个 connect 风格的中间件，处理 /__note-editor/* 下的所有接口。
 * @param {string} projectRoot 项目根目录的绝对路径
 */
export function createEditorApi(projectRoot) {
	return async function editorApi(req, res, next) {
		const url = new URL(req.url ?? '/', 'http://localhost');
		const route = url.pathname.replace(/\/+$/, '') || '/';

		try {
			if (req.method === 'GET' && route === '/files') {
				return sendJson(res, 200, { files: await listFiles(projectRoot) });
			}

			if (req.method === 'GET' && route === '/file') {
				return sendJson(res, 200, await readFile(projectRoot, url.searchParams.get('path')));
			}

			if (req.method === 'GET' && route === '/git') {
				return sendJson(res, 200, await gitStatus(projectRoot));
			}

			if (req.method === 'POST' && route === '/save') {
				const body = await readJsonBody(req);
				return sendJson(res, 200, await writeFile(projectRoot, body, { mustBeNew: false }));
			}

			if (req.method === 'POST' && route === '/create') {
				const body = await readJsonBody(req);
				return sendJson(res, 201, await writeFile(projectRoot, body, { mustBeNew: true }));
			}

			if (req.method === 'POST' && route === '/delete') {
				const body = await readJsonBody(req);
				return sendJson(res, 200, await deleteFile(projectRoot, body.path));
			}

			if (req.method === 'POST' && route === '/move') {
				const body = await readJsonBody(req);
				return sendJson(res, 200, await moveFile(projectRoot, body.from, body.to));
			}

			if (req.method === 'POST' && route === '/render') {
				const body = await readJsonBody(req);
				return sendJson(res, 200, {
					html: await renderMarkdown(typeof body.body === 'string' ? body.body : ''),
					readingTime: estimateReadingTime(typeof body.body === 'string' ? body.body : ''),
				});
			}

			if (req.method === 'POST' && route === '/publish') {
				const body = await readJsonBody(req);
				return sendJson(res, 200, await publish(projectRoot, { message: body.message, push: body.push === true }));
			}

			return next();
		} catch (error) {
			const status = error instanceof HttpError ? error.status : 500;
			if (status === 500) console.error('[note-editor]', error);
			return sendJson(res, status, { error: error.message });
		}
	};
}
