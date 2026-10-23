/**
 * Best-effort protection against browser tab-close shortcuts.
 * Browsers own Ctrl+W outside Keyboard Lock; JavaScript cannot universally
 * override it. Fullscreen can capture KeyW in supporting browsers.
 */
const BLOCKED = new Set(['KeyN', 'KeyT', 'KeyR', 'KeyQ', 'F4', 'F5']);

function isTyping(target) {
  if (!target) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

function isCloseShortcut(event) {
  return (event.ctrlKey || event.metaKey) &&
    (event.code === 'KeyW' || String(event.key || '').toLowerCase() === 'w');
}

export function installShortcutGuard(game) {
  // Capture browser navigation when the browser forwards the shortcut.
  // Do NOT stop propagation: Ctrl+W must still move while crouching.
  window.addEventListener('keydown', (event) => {
    if (isCloseShortcut(event)) {
      event.preventDefault();
      return;
    }
    if (isTyping(event.target)) return;
    const mod = event.ctrlKey || event.metaKey;
    const key = event.code;
    const blocked = (mod && BLOCKED.has(key)) ||
      (event.altKey && key === 'F4') || key === 'F5';
    if (!blocked) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
  }, true);

  window.addEventListener('keyup', (event) => {
    if (isCloseShortcut(event)) event.preventDefault();
  }, true);

  // For browsers intercepting Ctrl+W before DOM events, offer a native
  // unload confirmation after the user has interacted with the game.
  window.addEventListener('beforeunload', (event) => {
    if (!game || !['menu', 'playing', 'paused', 'roundover', 'loading'].includes(game.state)) return;
    event.preventDefault();
    event.returnValue = '';
  });
}
