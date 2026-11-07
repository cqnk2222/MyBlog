// A lightweight canvas interpretation of the drifting dot field on antfu.me/projects.
// Independent sine fields give neighboring dots a shared direction without a rendering dependency.
export function createProjectBackdrop(canvas, env = window) {
	const context = canvas.getContext('2d');
	if (!context) return () => {};

	const motion = env.matchMedia('(prefers-reduced-motion: reduce)');
	let width = 0;
	let height = 0;
	let points = [];
	let frameId = null;
	let lastDraw = -Infinity;
	let time = 0;
	let disposed = false;

	function draw(seconds) {
		context.clearRect(0, 0, width, height);
		context.fillStyle = '#cccccc';
		for (const point of points) {
			const field = (
				Math.sin(point.x / 200 + seconds * 0.14)
				+ Math.cos(point.y / 240 - seconds * 0.18)
				+ Math.sin((point.x + point.y) / 300 + seconds * 0.11)
			) / 3;
			const angle = field * Math.PI * 2;
			const distance = 3 + Math.sin(point.y / 180 + seconds * 0.2) * 2;
			context.globalAlpha = (Math.abs(Math.cos(angle)) * 0.8 + 0.2) * point.opacity;
			context.beginPath();
			context.arc(point.x + Math.cos(angle) * distance, point.y + Math.sin(angle) * distance, 1, 0, Math.PI * 2);
			context.fill();
		}
		context.globalAlpha = 1;
	}

	function resize() {
		width = env.innerWidth;
		height = env.innerHeight;
		const ratio = Math.min(env.devicePixelRatio || 1, 2);
		canvas.width = Math.round(width * ratio);
		canvas.height = Math.round(height * ratio);
		context.setTransform(ratio, 0, 0, ratio, 0, 0);
		points = [];
		for (let x = -7.5; x < width + 15; x += 15) {
			for (let y = -7.5; y < height + 15; y += 15) {
				const seed = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
				points.push({ x, y, opacity: 0.5 + (seed - Math.floor(seed)) * 0.5 });
			}
		}
		draw(time);
		canvas.dataset.ready = 'true';
	}

	function frame(timestamp) {
		frameId = null;
		if (disposed || motion.matches || env.document.hidden) return;
		if (timestamp - lastDraw >= 1000 / 30) {
			time = timestamp / 1000;
			draw(time);
			lastDraw = timestamp;
		}
		frameId = env.requestAnimationFrame(frame);
	}

	function syncAnimation() {
		if (frameId !== null) env.cancelAnimationFrame(frameId);
		frameId = null;
		lastDraw = -Infinity;
		if (!disposed && !motion.matches && !env.document.hidden) {
			frameId = env.requestAnimationFrame(frame);
		}
	}

	resize();
	syncAnimation();
	env.addEventListener('resize', resize);
	motion.addEventListener('change', syncAnimation);
	env.document.addEventListener('visibilitychange', syncAnimation);

	return () => {
		disposed = true;
		syncAnimation();
		env.removeEventListener('resize', resize);
		motion.removeEventListener('change', syncAnimation);
		env.document.removeEventListener('visibilitychange', syncAnimation);
	};
}
