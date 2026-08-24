const states = new Set(['expanded', 'compact', 'hidden']);

export function setSidebarState(sidebar, state) {
  if (!states.has(state)) throw new TypeError(`Unsupported sidebar state: ${state}`);
  sidebar.dataset.state = state;
  sidebar.toggleAttribute('hidden', state === 'hidden');
  return state;
}

/** Bind button-driven submenu disclosure without intercepting navigation links. */
export function bindSidebar(sidebar, { signal } = {}) {
  if (!sidebar?.addEventListener) throw new TypeError('sidebar must be an EventTarget element');
  signal?.throwIfAborted();
  const activate = event => {
    const button = event.target.closest('button[aria-controls][aria-expanded]');
    if (!button || !sidebar.contains(button)) return;
    const controlled = button.ownerDocument.getElementById(button.getAttribute('aria-controls'));
    if (!controlled || !sidebar.contains(controlled)) {
      throw new ReferenceError(`Sidebar control target not found: ${button.getAttribute('aria-controls')}`);
    }
    const expanded = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(expanded));
    controlled.hidden = !expanded;
    sidebar.dispatchEvent(new CustomEvent('sidebartoggle', {
      bubbles: true,
      detail: { control: button, expanded, panel: controlled },
    }));
  };
  sidebar.addEventListener('click', activate);
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    sidebar.removeEventListener('click', activate);
    signal?.removeEventListener('abort', dispose);
  };
  signal?.addEventListener('abort', dispose, { once: true });
  return dispose;
}
