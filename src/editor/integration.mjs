import { fileURLToPath } from 'node:url';
import { createEditorApi } from './api.mjs';
import { API_PREFIX } from './schema.mjs';

/**
 * 本地写作编辑器：只在 `npm run dev` 下启用。
 *
 * `command !== 'dev'` 时这个 integration 什么都不做 —— 既不注入 /editor 路由，
 * 也不挂载文件读写接口，所以 `npm run build` 产物里不会有任何编辑器代码。
 */
export default function noteEditor() {
	return {
		name: 'note-editor',
		hooks: {
			'astro:config:setup': ({ command, config, injectRoute, updateConfig, logger }) => {
				if (command !== 'dev') return;

				const projectRoot = fileURLToPath(config.root);

				injectRoute({
					pattern: '/editor',
					entrypoint: './src/editor/EditorPage.astro',
				});

				updateConfig({
					vite: {
						plugins: [
							{
								name: 'note-editor-api',
								apply: 'serve',
								configureServer(server) {
									server.middlewares.use(API_PREFIX, createEditorApi(projectRoot));
								},
							},
						],
					},
				});

				logger.info(`写作编辑器已启用：http://localhost:${config.server.port}/editor`);
			},
		},
	};
}
