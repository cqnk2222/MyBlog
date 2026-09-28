// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import noteEditor from './src/editor/integration.mjs';

// https://astro.build/config
export default defineConfig({
	site: 'https://kk2222.ink',
	// noteEditor 只在 dev 下注入 /editor 写作台，build 时是空操作。
	integrations: [mdx(), sitemap(), noteEditor()],
});
