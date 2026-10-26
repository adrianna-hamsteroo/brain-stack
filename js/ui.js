// Tiny DOM helpers: h() builds elements, icon() inlines an SVG icon,
// ask() is an in-page confirm sheet (window.confirm is unavailable in some
// embedded views), toast() shows a short message.
import { ICONS } from './data.js';

export function h(tag, props, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (value == null || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key === 'html') el.innerHTML = value;
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'style' && typeof value === 'object') {
      for (const [prop, v] of Object.entries(value)) el.style.setProperty(prop.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`), v);
    }
    else if (key === 'value' || key === 'checked' || key === 'disabled' || key === 'hidden') el[key] = value;
    else el.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

export function icon(name, cls = '') {
  const span = document.createElement('span');
  span.className = `icon ${cls}`.trim();
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ICONS.leaf}</svg>`;
  return span;
}

export function svg(markup) {
  const wrap = document.createElement('div');
  wrap.innerHTML = markup.trim();
  return wrap.firstElementChild;
}

// A little wave that gets choppier as the mind gets louder (level 1–5).
export function noiseWave(level, width = 44, height = 20) {
  const amp = 1 + level * 1.5;
  const cycles = 0.8 + level * 0.65;
  const mid = height / 2;
  let d = `M0 ${mid}`;
  for (let x = 1; x <= width; x++) {
    const y = mid - amp * Math.sin((x / width) * cycles * Math.PI * 2);
    d += ` L${x} ${y.toFixed(2)}`;
  }
  return svg(`<svg class="wave" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
}

export function ask({ title, body = '', confirm = 'OK', cancel = 'Cancel', danger = false }) {
  return new Promise(resolve => {
    const dialog = h('dialog', { class: 'sheet', 'aria-labelledby': 'ask-title' },
      h('h2', { id: 'ask-title' }, title),
      body && h('p', null, body),
      h('div', { class: 'sheet-actions' },
        h('button', { class: 'btn ghost', value: 'cancel', onclick: () => close(false) }, cancel),
        h('button', { class: `btn ${danger ? 'danger' : 'primary'}`, onclick: () => close(true) }, confirm),
      ),
    );
    let done = false;
    function close(result) {
      if (done) return;
      done = true;
      dialog.close();
      dialog.remove();
      resolve(result);
    }
    dialog.addEventListener('cancel', e => { e.preventDefault(); close(false); });
    dialog.addEventListener('click', e => { if (e.target === dialog) close(false); });
    document.body.append(dialog);
    if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open', '');
  });
}

let toastTimer = 0;
export function toast(message) {
  let el = document.getElementById('toast');
  if (!el) {
    el = h('div', { id: 'toast', class: 'toast', role: 'status', 'aria-live': 'polite' });
    document.body.append(el);
  }
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

export function isEmbedded() {
  try { return window.self !== window.top; } catch { return true; }
}

// Downloads are blocked inside embedded previews; fall back to the clipboard.
export async function saveFile(name, text, type) {
  if (!isEmbedded()) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = h('a', { href: url, download: name });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return 'downloaded';
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}
