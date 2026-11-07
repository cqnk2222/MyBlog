import assert from 'node:assert/strict';
import test from 'node:test';
import { createProjectBackdrop } from './project-backdrop.mjs';

function fixture({ reducedMotion = false } = {}) {
	const env = new EventTarget();
	const document = new EventTarget();
	document.hidden = false;
	const motion = new EventTarget();
	motion.matches = reducedMotion;
	const frames = new Map();
	let nextFrame = 0;
	let dots = 0;
	let clears = 0;
	Object.assign(env, {
		innerWidth: 300,
		innerHeight: 150,
		devicePixelRatio: 3,
		document,
		matchMedia: () => motion,
		requestAnimationFrame: (callback) => {
			frames.set(++nextFrame, callback);
			return nextFrame;
		},
		cancelAnimationFrame: (id) => frames.delete(id),
	});
	const context = {
		setTransform() {},
		clearRect() { clears++; dots = 0; },
		beginPath() {},
		arc() { dots++; },
		fill() {},
	};
	const canvas = { dataset: {}, getContext: () => context };
	const tick = (time) => {
		const [id, callback] = frames.entries().next().value;
		frames.delete(id);
		callback(time);
	};
	return { env, document, motion, frames, canvas, tick, get dots() { return dots; }, get clears() { return clears; } };
}

test('draws the full viewport at capped resolution and rebuilds points after shrinking', () => {
	const view = fixture({ reducedMotion: true });
	const cleanup = createProjectBackdrop(view.canvas, view.env);
	assert.equal(view.canvas.width, 600);
	assert.equal(view.canvas.height, 300);
	assert.equal(view.canvas.dataset.ready, 'true');
	const fullSizeDots = view.dots;
	assert.ok(fullSizeDots > 200);
	view.env.innerWidth = 75;
	view.env.innerHeight = 75;
	view.env.dispatchEvent(new Event('resize'));
	assert.equal(view.canvas.width, 150);
	assert.ok(view.dots > 0 && view.dots < fullSizeDots / 2);
	cleanup();
});

test('renders a still field for reduced motion and stops animation while hidden', () => {
	const view = fixture({ reducedMotion: true });
	const cleanup = createProjectBackdrop(view.canvas, view.env);
	assert.equal(view.frames.size, 0);
	view.motion.matches = false;
	view.motion.dispatchEvent(new Event('change'));
	assert.equal(view.frames.size, 1);
	view.tick(100);
	assert.equal(view.frames.size, 1);
	view.document.hidden = true;
	view.document.dispatchEvent(new Event('visibilitychange'));
	assert.equal(view.frames.size, 0);
	view.document.hidden = false;
	view.document.dispatchEvent(new Event('visibilitychange'));
	assert.equal(view.frames.size, 1);
	cleanup();
	assert.equal(view.frames.size, 0);
	const clears = view.clears;
	view.env.dispatchEvent(new Event('resize'));
	view.motion.dispatchEvent(new Event('change'));
	assert.equal(view.clears, clears);
	assert.equal(view.frames.size, 0);
});

test('leaves the CSS fallback when a canvas context is unavailable', () => {
	const canvas = { dataset: {}, getContext: () => null };
	assert.doesNotThrow(() => createProjectBackdrop(canvas, {})());
	assert.equal(canvas.dataset.ready, undefined);
});
