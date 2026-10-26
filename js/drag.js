// Hold-and-drag reordering for a vertical list, with mouse or touch. Press
// the grip to drag straight away, or hold anywhere on a row for a moment.
// Rows are the list's children with a data-sort attribute; onMove(from, to)
// receives the result when the row is dropped somewhere new.
const HOLD_MS = 350;
const SLOP = 8;   // px a finger may wander while holding
const EDGE = 72;  // px from the top or bottom where the page starts scrolling
const TABBAR = 66;

export function sortable(list, { onMove, handle = '.grip', ignore = 'input, textarea, select, .edit-body' }) {
  let drag = null;
  let waiting = null;
  let suppressClick = false;

  list.addEventListener('pointerdown', down);
  // A drag ends with a click on the row; don't let it toggle the row open.
  list.addEventListener('click', e => {
    if (!suppressClick) return;
    suppressClick = false;
    e.preventDefault();
    e.stopPropagation();
  }, true);
  list.addEventListener('contextmenu', e => { if (drag || waiting) e.preventDefault(); });

  function down(e) {
    if (drag || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const item = e.target.closest('[data-sort]');
    if (!item || item.parentElement !== list) return;
    const onHandle = !!e.target.closest(handle);
    if (!onHandle && e.target.closest(ignore)) return;
    const start = { x: e.clientX, y: e.clientY, id: e.pointerId };
    if (onHandle) {
      e.preventDefault();
      begin(item, start);
      return;
    }
    waiting = { start, timer: setTimeout(() => { stopWaiting(); begin(item, start); }, HOLD_MS) };
    window.addEventListener('pointermove', waitMove);
    window.addEventListener('pointerup', stopWaiting);
    window.addEventListener('pointercancel', stopWaiting);
    window.addEventListener('scroll', stopWaiting, true);
  }

  function waitMove(e) {
    const { start } = waiting || {};
    if (start && e.pointerId === start.id && Math.hypot(e.clientX - start.x, e.clientY - start.y) > SLOP) stopWaiting();
  }

  function stopWaiting() {
    if (!waiting) return;
    clearTimeout(waiting.timer);
    waiting = null;
    window.removeEventListener('pointermove', waitMove);
    window.removeEventListener('pointerup', stopWaiting);
    window.removeEventListener('pointercancel', stopWaiting);
    window.removeEventListener('scroll', stopWaiting, true);
  }

  function begin(item, start) {
    const items = [...list.children].filter(el => el.hasAttribute('data-sort'));
    const rects = items.map(el => el.getBoundingClientRect());
    const index = items.indexOf(item);
    drag = {
      item, items, rects, index, target: index,
      gap: rects.length > 1 ? Math.max(0, rects[1].top - rects[0].bottom) : 0,
      id: start.id, startY: start.y, lastY: start.y, scroll0: window.scrollY, raf: 0,
    };
    item.classList.add('dragging');
    list.classList.add('sorting');
    try { navigator.vibrate?.(12); } catch { /* no haptics */ }
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    // Once a row is lifted, a finger moving should drag it, not scroll the page.
    document.addEventListener('touchmove', holdPage, { passive: false });
    drag.raf = requestAnimationFrame(autoScroll);
  }

  function holdPage(e) {
    if (drag) e.preventDefault();
  }

  function move(e) {
    if (!drag || e.pointerId !== drag.id) return;
    e.preventDefault();
    drag.lastY = e.clientY;
    layout();
  }

  // Positions are worked out in the viewport coordinates of the moment the
  // row was lifted, so scrolling during the drag is just another offset.
  function layout() {
    const { item, items, rects, index, gap } = drag;
    const dy = drag.lastY - drag.startY + (window.scrollY - drag.scroll0);
    const own = rects[index];
    const center = own.top + own.height / 2 + dy;
    let target = index;
    rects.forEach((r, i) => {
      const mid = r.top + r.height / 2;
      if (i < index && center < mid) target = Math.min(target, i);
      if (i > index && center > mid) target = Math.max(target, i);
    });
    const shift = own.height + gap;
    item.style.transform = `translateY(${dy}px)`;
    items.forEach((el, i) => {
      if (i === index) return;
      let offset = 0;
      if (index < target && i > index && i <= target) offset = -shift;
      if (index > target && i >= target && i < index) offset = shift;
      el.style.transform = offset ? `translateY(${offset}px)` : '';
    });
    drag.target = target;
  }

  function autoScroll() {
    if (!drag) return;
    const y = drag.lastY;
    const bottom = window.innerHeight - EDGE - TABBAR;
    const speed = y < EDGE ? -(EDGE - y) / 6 : y > bottom ? (y - bottom) / 6 : 0;
    if (speed) {
      window.scrollBy(0, Math.round(speed));
      layout();
    }
    drag.raf = requestAnimationFrame(autoScroll);
  }

  function end(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    const { item, items, index, target } = drag;
    cancelAnimationFrame(drag.raf);
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', end);
    window.removeEventListener('pointercancel', end);
    document.removeEventListener('touchmove', holdPage);
    items.forEach(el => { el.style.transform = ''; });
    item.classList.remove('dragging');
    list.classList.remove('sorting');
    drag = null;
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 350);
    if (target !== index) onMove(index, target);
  }
}
