// Astro 文章与编辑器草稿共用；具体配色由 styles/code.css 和 tokens.css 提供。
export const markdownConfig = {
	syntaxHighlight: 'shiki',
	shikiConfig: {
		theme: 'css-variables',
		wrap: false,
	},
};
