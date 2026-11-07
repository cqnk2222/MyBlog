const uploads = new WeakMap();
/** Keep a delayed upload from overwriting another source or a newer edit. */
export async function applyPreviewImage({ file, input, upload, isCurrent, onChange }) {
	if (!file || !['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) throw new Error('请选择 PNG、JPEG、WebP 或 GIF 截图');
	if (file.size > 10 * 1024 * 1024) throw new Error('单张图片不能超过 10 MiB');
	if (input.readOnly) throw new Error('请等待当前截图上传完成');
	const previous = input.value;
	const token = {};
	uploads.set(input, token);
	input.readOnly = true;
	try {
		const asset = await upload(file);
		if (!isCurrent() || uploads.get(input) !== token || input.value !== previous) throw new Error('截图已上传；当前来源已切换，请重新选择截图');
		input.value = asset.url;
		onChange();
		return asset;
	} finally {
		if (uploads.get(input) === token) { input.readOnly = false; uploads.delete(input); }
	}
}
