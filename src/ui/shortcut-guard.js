/**
 * Evita atajos de navegación que el navegador entrega al documento.
 * La protección temprana de Ctrl+W y beforeunload está en index.html
 * para cubrir también la carga inicial, errores y cualquier estado del juego.
 */
const BLOCKED = new Set(['KeyN', 'KeyT', 'KeyR', 'KeyQ', 'F4', 'F5']);

function isTyping(target) {
  if (!target) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

export function installShortcutGuard() {
  window.addEventListener('keydown', (event) => {
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
}
