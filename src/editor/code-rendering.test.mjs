import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { Readable } from 'node:stream';
import { test } from 'node:test';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import astroConfig from '../../astro.config.mjs';
import { createEditorApi } from './api.mjs';

const editor = createEditorApi(process.cwd());

async function renderDraft(body) {
	const request = Readable.from([Buffer.from(JSON.stringify({ body }))]);
	request.method = 'POST';
	request.url = '/render';
	let result;
	const response = {
		statusCode: 200,
		setHeader() {},
		end(value) { result = JSON.parse(value); },
	};
	await editor(request, response, () => assert.fail('Render route missing'));
	assert.equal(response.statusCode, 200);
	return result.html;
}

test('article and draft renderers share token colors and preserve code whitespace', async () => {
	const processor = await createMarkdownProcessor(astroConfig.markdown ?? {});
	const source = '```python\n# 注释\ndef greet(name):\n    return "你好" if name else 42\n```';
	const article = (await processor.render(source)).code;
	const draft = await renderDraft(source);
	assert.equal(draft, article);
	assert.match(draft, /background-color:var\(--astro-code-background\)/);
	for (const token of ['comment', 'keyword', 'function', 'string-expression', 'constant']) {
		assert.ok(draft.includes(`var(--astro-code-token-${token})`), `Missing ${token} color`);
	}
	assert.match(draft, /    /);
	assert.doesNotMatch(draft, /pre-wrap/);
});

test('plaintext blocks share the same base color and escape HTML', async () => {
	const processor = await createMarkdownProcessor(astroConfig.markdown ?? {});
	for (const language of ['', 'text']) {
		const source = `\`\`\`${language}\n<div>  plain & text</div>\n\`\`\``;
		const draft = await renderDraft(source);
		assert.equal(draft, (await processor.render(source)).code);
		assert.match(draft, /color:var\(--astro-code-foreground\)/);
		assert.doesNotMatch(draft, /<div>/);
		assert.match(draft, /plain (?:&amp;|&#x26;) text/);
	}
});

test('shared styles define every color emitted for code, Markdown, diff and terminal output', async () => {
	const processor = await createMarkdownProcessor(astroConfig.markdown ?? {});
	const css = await fs.readFile(new URL('../styles/code.css', import.meta.url), 'utf8');
	const defined = new Set([...css.matchAll(/(--astro-code-[\w-]+)\s*:/g)].map(match => match[1]));
	for (const [language, code] of [
		['python', '# comment\ndef greet(name):\n    return "hello" if name else 42'],
		['markdown', '# Heading\n[link](https://example.test)'],
		['diff', '- removed\n+ added\n! changed'],
		['ansi', '\u001b[31mred\u001b[0m'],
	]) {
		const html = (await processor.render(`\`\`\`${language}\n${code}\n\`\`\``)).code;
		for (const [, variable] of html.matchAll(/var\((--astro-code-[\w-]+)\)/g)) {
			assert.ok(defined.has(variable), `${language}: undefined ${variable}`);
		}
	}
});
