const PREFERENCE_KEY = 'ed-sidebar-collapsed';

// Keep the existing directory DOM mounted so search, expanded folders, and scroll survive.
export function initSidebar({ document, media, storage }) {
	const get = id => document.getElementById(id);
	const shell = get('editor-shell');
	const sidebar = get('sidebar');
	const toggle = get('btn-sidebar');
	const close = get('btn-sidebar-close');
	const backdrop = get('sidebar-backdrop');
	const search = get('search');
	const tree = get('tree');
	const background = [get('topbar'), get('main-pane'), get('preview-pane')];
	let desktopCollapsed = false;
	let drawerOpen = false;
	let treeScroll = tree.scrollTop;

	try {
		desktopCollapsed = storage().getItem(PREFERENCE_KEY) === 'true';
	} catch {
		// A blocked preference store must not prevent writing or navigation.
	}

	function render() {
		const open = media.matches ? drawerOpen : !desktopCollapsed;
		const modal = media.matches && open;
		const hadFocus = sidebar.contains(document.activeElement);
		const wasHidden = sidebar.hidden;
		if (!wasHidden) treeScroll = tree.scrollTop;

		shell.dataset.sidebarOpen = String(open);
		sidebar.hidden = !open;
		toggle.setAttribute('aria-expanded', String(open));
		toggle.setAttribute('aria-label', open ? '收起目录' : '展开目录');
		toggle.title = open ? '收起目录' : '展开目录';
		backdrop.hidden = !modal;
		for (const element of background) element.inert = modal;

		if (modal) {
			sidebar.setAttribute('role', 'dialog');
			sidebar.setAttribute('aria-modal', 'true');
		} else {
			sidebar.removeAttribute('role');
			sidebar.removeAttribute('aria-modal');
		}
		if (open && wasHidden) tree.scrollTop = treeScroll;
		if (!open && hadFocus) toggle.focus({ preventScroll: true });
	}

	function dismiss() {
		if (media.matches) drawerOpen = false;
		else {
			desktopCollapsed = true;
			persist();
		}
		render();
		toggle.focus({ preventScroll: true });
	}

	function persist() {
		try {
			storage().setItem(PREFERENCE_KEY, String(desktopCollapsed));
		} catch {
			// The current session still works without saved preferences.
		}
	}

	toggle.addEventListener('click', () => {
		if (media.matches) drawerOpen = !drawerOpen;
		else {
			desktopCollapsed = !desktopCollapsed;
			persist();
		}
		render();
		if (!sidebar.hidden) search.focus({ preventScroll: true });
	});
	close.addEventListener('click', dismiss);
	backdrop.addEventListener('click', dismiss);
	media.addEventListener('change', () => {
		drawerOpen = false;
		render();
	});

	document.addEventListener('keydown', event => {
		if (!media.matches || !drawerOpen || document.querySelector('dialog[open]')) return;
		if (event.key === 'Escape') {
			event.preventDefault();
			dismiss();
		} else if (event.key === 'Tab') {
			const focusable = [...sidebar.querySelectorAll('button:not([disabled]), input:not([disabled]), a[href], [tabindex="0"]')]
				.filter(element => element.getClientRects().length);
			const first = focusable[0];
			const last = focusable.at(-1);
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last?.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first?.focus();
			}
		}
	});

	render();
	return {
		onFileOpened() {
			if (media.matches && drawerOpen) dismiss();
		},
	};
}
