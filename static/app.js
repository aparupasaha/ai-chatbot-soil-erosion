// SoilSense - chat client. Vanilla JS, no dependencies.
(() => {
'use strict';

// ---------- Icons (lucide-style strokes) ----------
const P = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  panel: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2.5"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/>',
  stop: '<rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" stroke="none"/>',
  pause: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  up: '<path d="M12 19V5M5 12l7-7 7 7"/>',
  down: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
  chev: '<path d="m9 18 6-6-6-6"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
  sprout: '<path d="M12 21v-9"/><path d="M12 12c0-4 3-7 8-7 0 5-3 7-8 7Z"/><path d="M12 15c0-3-2.5-5.5-7-5.5 0 4 2.5 5.5 7 5.5Z"/>',
  steps: '<path d="M3 20h18"/><path d="M3 20v-4h6v-4h6V8h6v12"/>',
  wind: '<path d="M3 8h10a3 3 0 1 0-3-3"/><path d="M3 12h15a3 3 0 1 1-3 3"/><path d="M3 16h7"/>',
  drop: '<path d="M12 3s-6 6.5-6 11a6 6 0 0 0 12 0c0-4.5-6-11-6-11Z"/>',
  compare: '<rect x="3" y="4" width="7" height="16" rx="2"/><rect x="14" y="4" width="7" height="16" rx="2"/>'
};
const icon = (n, s = 18, cls = '') => `<svg${cls ? ` class="${cls}"` : ''} width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${P[n]}</svg>`;
const LOGO = '<svg width="60%" height="60%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 20v-7"/><path d="M12 13c0-3.6 2.6-6.5 7-6.5 0 4.5-2.6 6.5-7 6.5Z"/><path d="M12 15.5c0-2.8-2.2-5-6-5 0 3.6 2.2 5 6 5Z"/><path d="M4 20h16" opacity=".55"/></svg>';
document.querySelectorAll('[data-i]').forEach(el => { el.outerHTML = icon(el.dataset.i); });
document.querySelectorAll('[data-logo]').forEach(el => { el.innerHTML = LOGO; el.setAttribute('aria-hidden', 'true'); });

// ---------- Data & storage ----------
const CATS = { Overview: 'layers', Agronomic: 'sprout', Mechanical: 'steps', Wind: 'wind', Water: 'drop', Comparison: 'compare' };
const SUGGESTIONS = [
  ['Overview', 'What are the major techniques used to control soil erosion?'],
  ['Agronomic', 'Explain contour farming.'],
  ['Mechanical', 'Explain terracing.'],
  ['Comparison', 'What is the difference between contour farming and terracing?'],
  ['Wind', 'What methods control wind erosion?'],
  ['Water', 'What methods control water erosion?'],
  ['Agronomic', 'What are agronomic methods of soil conservation?'],
  ['Mechanical', 'What are mechanical methods?'],
  ['Agronomic', 'How does mulching reduce soil erosion?'],
  ['Wind', 'What is the role of windbreaks?']
];
const KEY = 'soilsense.chats', CUR_KEY = 'soilsense.current', THEME_KEY = 'soilsense.theme', SIDE_KEY = 'soilsense.sidebar';
const MAXLEN = 500;
const THEME_COLORS = { light: '#ffffff', dark: '#0a0b0a' };

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* quota / private mode */ } }
};

let chats = store.get(KEY, []);
if (!Array.isArray(chats)) chats = [];
chats = chats.filter(c => c && Array.isArray(c.messages));
// An answer still pending at load time was cut off by a reload/close.
chats.forEach(c => c.messages.forEach(m => {
  if (m.pending) { m.pending = false; if (!m.error) m.error = 'This answer was interrupted.'; }
}));
let currentId = null;
let streaming = null;     // { chat, msg, ctrl }
let kbSections = 0;       // from /api/status, shown in the hero chip
const elOf = new WeakMap(); // message -> DOM node (kept out of storage)
const save = () => store.set(KEY, chats);
const current = () => chats.find(c => c.id === currentId) || null;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// ---------- DOM ----------
const $ = id => document.getElementById(id);
const app = $('app'), view = $('view'), scroller = $('scroller'), input = $('input'), sendBtn = $('send'),
  form = $('form'), countEl = $('count'), historyEl = $('history'), titleEl = $('chatTitle'), toBottom = $('toBottom');
const mq = matchMedia('(max-width: 767.98px)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

// ---------- Markdown (escape first, then format) ----------
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
function inline(s) {
  const codes = [];
  s = s.replace(/`([^`\n]+)`/g, (_, c) => { codes.push(c); return '\u0000' + (codes.length - 1) + '\u0000'; });
  s = s.replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, '<strong>$1</strong>')
       .replace(/__(?=\S)([\s\S]*?\S)__/g, '<strong>$1</strong>')
       .replace(/(^|[^*\w])\*(?=\S)([^*\n]*?\S)\*(?!\*)/g, '$1<em>$2</em>')
       .replace(/(^|[^_\w])_(?=\S)([^_\n]*?\S)_(?!\w)/g, '$1<em>$2</em>');
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => '<code>' + codes[i] + '</code>');
  // Accent a leading "**Label:**" (e.g. Definition:, How it works:) so KB answers scan easily.
  return s.replace(/^<strong>(?=[^<]+(?::<\/strong>|<\/strong>:))/, '<strong class="lbl">');
}
function md(src) {
  const lines = esc(src.replace(/\r\n?/g, '\n')).split('\n');
  let out = '', para = [], stack = [], inCode = false, code = [];
  const flushPara = () => { if (para.length) { out += '<p>' + para.map(inline).join('<br>') + '</p>'; para = []; } };
  const closeLists = (to = 0) => { while (stack.length > to) out += '</li></' + stack.pop().tag + '>'; };
  const openList = (tag, ind, marker) => {
    const n = parseInt(marker, 10);
    out += '<' + tag + (tag === 'ol' && n > 1 ? ` start="${n}"` : '') + '><li>';
    stack.push({ tag, ind });
  };
  for (const raw of lines) {
    if (inCode) {
      if (/^\s*```/.test(raw)) { out += '<pre><code>' + code.join('\n') + '</code></pre>'; code = []; inCode = false; }
      else code.push(raw);
      continue;
    }
    if (/^\s*```/.test(raw)) { flushPara(); closeLists(); inCode = true; continue; }
    const line = raw.replace(/\t/g, '    ');
    if (!line.trim()) { flushPara(); continue; }
    let m;
    if ((m = line.match(/^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/))) {
      flushPara(); closeLists();
      const lvl = Math.min(Math.max(m[1].length, 2), 4);
      out += `<h${lvl}>${inline(m[2])}</h${lvl}>`; continue;
    }
    if (/^\s{0,3}([-*_])(\s*\1){2,}\s*$/.test(line)) { flushPara(); closeLists(); out += '<hr>'; continue; }
    if ((m = line.match(/^(\s*)([-*+•–]|\d{1,3}[.)])\s+(.*)$/))) {
      flushPara();
      const ind = m[1].length, tag = /\d/.test(m[2]) ? 'ol' : 'ul';
      while (stack.length && ind < stack[stack.length - 1].ind - 1) closeLists(stack.length - 1);
      const top = stack[stack.length - 1];
      if (top && ind <= top.ind + 1) {
        if (top.tag !== tag) { closeLists(stack.length - 1); openList(tag, ind, m[2]); }
        else out += '</li><li>';
      } else openList(tag, ind, m[2]);
      out += inline(m[3]); continue;
    }
    if ((m = line.match(/^\s*&gt;\s?(.*)$/))) { flushPara(); closeLists(); out += '<blockquote>' + inline(m[1]) + '</blockquote>'; continue; }
    if (stack.length && /^\s+/.test(line)) { out += '<br>' + inline(line.trim()); continue; } // list continuation
    closeLists();
    para.push(line.trim());
  }
  if (inCode) out += '<pre><code>' + code.join('\n') + '</code></pre>';
  flushPara(); closeLists();
  return out;
}

// ---------- Theme ----------
const effectiveDark = () => { const t = document.documentElement.dataset.theme; return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; };
function applyTheme(t) {
  if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
  const dark = effectiveDark();
  $('themeBtn').innerHTML = icon(dark ? 'sun' : 'moon');
  $('themeBtn').setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  document.querySelectorAll('meta[name="theme-color"]').forEach(el => {
    el.content = t ? THEME_COLORS[t] : THEME_COLORS[el.media.includes('dark') ? 'dark' : 'light'];
  });
}
applyTheme(store.get(THEME_KEY, null));
$('themeBtn').onclick = () => { const t = effectiveDark() ? 'light' : 'dark'; store.set(THEME_KEY, t); applyTheme(t); };
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme(document.documentElement.dataset.theme || null));

// ---------- Sidebar / drawer ----------
let lastFocus = null;
const drawerOpen = () => app.classList.contains('drawer');
function syncSide() {
  const open = mq.matches ? drawerOpen() : !app.classList.contains('collapsed');
  $('toggleSide').setAttribute('aria-expanded', String(open));
  $('toggleSide').setAttribute('aria-label', open ? 'Close sidebar' : 'Open sidebar');
  $('toggleSide').innerHTML = icon(mq.matches ? 'menu' : 'panel');
  // The open drawer is modal: hide the page behind it from AT and pointer/keyboard.
  const d = drawerOpen(), side = $('sidebar');
  $('main').inert = d;
  if (d) { side.setAttribute('role', 'dialog'); side.setAttribute('aria-modal', 'true'); }
  else { side.removeAttribute('role'); side.removeAttribute('aria-modal'); }
}
function openDrawer() {
  lastFocus = document.activeElement;
  app.classList.add('drawer'); syncSide();
  $('closeDrawer').focus(); // drawer becomes visible instantly (visibility has no delay on open)
}
function closeDrawer(restore = true) {
  if (!drawerOpen()) return;
  app.classList.remove('drawer'); syncSide();
  if (restore && lastFocus && lastFocus.isConnected) lastFocus.focus();
}
$('toggleSide').onclick = () => {
  if (mq.matches) { drawerOpen() ? closeDrawer() : openDrawer(); return; }
  app.classList.toggle('collapsed'); store.set(SIDE_KEY, app.classList.contains('collapsed')); syncSide();
};
$('closeDrawer').onclick = () => closeDrawer();
$('backdrop').onclick = () => closeDrawer();
if (store.get(SIDE_KEY, false)) app.classList.add('collapsed');
mq.addEventListener('change', () => { app.classList.remove('drawer'); syncSide(); });
syncSide();

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && drawerOpen()) { e.preventDefault(); closeDrawer(); }
  else if (e.key === 'Escape' && streaming && document.activeElement === input) streaming.ctrl.abort();
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'o' || e.key === 'O')) { e.preventDefault(); newChat(); }
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z') && undoFn && document.activeElement !== input) { e.preventDefault(); $('toastUndo').click(); }
  if (e.key === 'Tab' && drawerOpen()) trapFocus(e);
});
function trapFocus(e) {
  const f = [...$('sidebar').querySelectorAll('button'), ...(toastEl.classList.contains('show') ? toastEl.querySelectorAll('button:not([hidden])') : [])].filter(b => b.offsetParent);
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (!f.includes(document.activeElement)) { e.preventDefault(); first.focus(); }
  else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

// ---------- History list ----------
function renderHistory() {
  const sorted = [...chats].sort((a, b) => b.updated - a.updated);
  if (!sorted.length) { historyEl.innerHTML = '<p class="history-empty">No conversations yet. Ask a question to start.</p>'; return; }
  const day = 864e5, now = new Date(), startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const groups = [['Today', c => c.updated >= startToday], ['Previous 7 days', c => c.updated >= startToday - 7 * day], ['Older', () => true]];
  const used = new Set();
  let html = '';
  for (const [label, fn] of groups) {
    const items = sorted.filter(c => !used.has(c.id) && fn(c));
    if (!items.length) continue;
    items.forEach(c => used.add(c.id));
    html += `<h2>${label}</h2><ul>` + items.map(c => `<li class="h-item${c.id === currentId ? ' active' : ''}">
      <button type="button" class="h-link" data-open="${c.id}"${c.id === currentId ? ' aria-current="page"' : ''} title="${esc(c.title)}">${esc(c.title)}</button>
      <button type="button" class="h-del" data-del="${c.id}" aria-label="Delete chat: ${esc(c.title)}">${icon('trash', 16)}</button></li>`).join('') + '</ul>';
  }
  historyEl.innerHTML = html;
}
historyEl.addEventListener('click', e => {
  const o = e.target.closest('[data-open]'), d = e.target.closest('[data-del]');
  if (o) { openChat(o.dataset.open); if (mq.matches) closeDrawer(false); input.focus(); }
  else if (d) deleteChat(d.dataset.del, e.detail === 0); // detail 0 = keyboard activation
});

// ---------- Toast with undo ----------
let toastTimer = null, undoFn = null;
const toastEl = $('toast');
function toast(text, undo) {
  $('toastText').textContent = text; undoFn = undo;
  $('toastUndo').hidden = !undo;
  toastEl.classList.add('show');
  armToast();
}
function armToast() {
  clearTimeout(toastTimer);
  if (toastEl.classList.contains('show') && !toastEl.matches(':hover') && !toastEl.contains(document.activeElement))
    toastTimer = setTimeout(hideToast, 6000);
}
function hideToast() { clearTimeout(toastTimer); toastEl.classList.remove('show'); undoFn = null; }
const pauseToast = () => clearTimeout(toastTimer);
toastEl.addEventListener('mouseenter', pauseToast);
toastEl.addEventListener('focusin', pauseToast);
toastEl.addEventListener('mouseleave', armToast);
toastEl.addEventListener('focusout', () => setTimeout(armToast)); // activeElement settles after focusout
$('toastUndo').onclick = () => { const f = undoFn; hideToast(); if (f) f(); };

function deleteChat(id, viaKeyboard = false) {
  const idx = chats.findIndex(c => c.id === id);
  if (idx < 0) return;
  if (streaming && streaming.chat.id === id) streaming.ctrl.abort();
  const [removed] = chats.splice(idx, 1);
  const wasCurrent = currentId === id;
  save();
  if (wasCurrent) openChat(null); else renderHistory();
  toast('Chat deleted', () => {
    chats.splice(Math.min(idx, chats.length), 0, removed); save();
    if (wasCurrent) { openChat(removed.id); input.focus(); }
    else { renderHistory(); const b = historyEl.querySelector(`[data-open="${removed.id}"]`); (b || input).focus(); }
  });
  // Keyboard users land on Undo (the toast stays while it has focus); pointer users stay in the list.
  (viaKeyboard ? $('toastUndo') : historyEl.querySelector('.h-link') || $('newChat')).focus();
}

// ---------- Views ----------
function setTitle() {
  const c = current();
  titleEl.textContent = c ? c.title : 'New chat';
  document.title = c ? `${c.title} · SoilSense` : 'SoilSense · Soil-erosion control assistant';
}
function newChat() { if (mq.matches) closeDrawer(false); openChat(null); input.focus(); }
$('newChat').onclick = newChat; $('newChat2').onclick = newChat;

function openChat(id) {
  // Leaving a chat mid-answer stops the stream; the partial text is kept.
  if (streaming && streaming.chat.id !== id) { streaming.ctrl.abort(); streaming = null; syncComposer(); }
  currentId = id; store.set(CUR_KEY, id);
  setTitle(); renderHistory(); renderView();
  scroller.scrollTop = id ? scroller.scrollHeight : 0;
  updateToBottom();
}

function heroChip() {
  return kbSections ? `${kbSections} curated knowledge-base sections` : 'Soil &amp; water conservation';
}
function renderWelcome() {
  view.className = 'col welcome';
  view.removeAttribute('role'); view.removeAttribute('aria-label'); view.removeAttribute('aria-busy');
  view.innerHTML = `<div class="welcome-bg" aria-hidden="true"></div>
    <div class="hero">
      <div class="logo">${LOGO}</div>
      <span class="eyebrow">${icon('book', 14)}<span id="heroChip">${heroChip()}</span></span>
      <h2>What would you like to learn about soil erosion?</h2>
      <p>Ask about techniques, methods and comparisons. Answers are grounded in a curated soil-conservation knowledge base.</p>
    </div>
    <h3 class="cards-label" id="sugg">Try asking</h3>
    <ul class="cards" aria-labelledby="sugg">${SUGGESTIONS.map(([cat, q]) => `<li><button type="button" class="card" data-q="${esc(q)}">
      <span class="card-cat"><span class="ic">${icon(CATS[cat], 16)}</span><span class="cat-name">${cat}</span></span>
      <span class="card-q">${esc(q)}</span></button></li>`).join('')}</ul>`;
}
function renderView() {
  const c = current();
  if (!c || !c.messages.length) { renderWelcome(); return; }
  view.className = 'col thread';
  view.setAttribute('role', 'log'); view.setAttribute('aria-label', 'Conversation');
  view.innerHTML = '';
  c.messages.forEach((m, i) => view.appendChild(msgEl(m, i === c.messages.length - 1)));
  view.setAttribute('aria-busy', String(!!(streaming && streaming.chat === c)));
}
view.addEventListener('click', e => {
  const card = e.target.closest('[data-q]');
  if (card && !streaming) ask(card.dataset.q);
});

function msgEl(m, isLast) {
  const el = document.createElement('article');
  if (m.role === 'user') {
    el.className = 'msg user';
    el.innerHTML = '<h2 class="sr-only">You said:</h2><div class="bubble"></div>';
    el.querySelector('.bubble').textContent = m.content;
    return el;
  }
  el.className = 'msg assistant';
  el.innerHTML = `<div class="logo" aria-hidden="true">${LOGO}</div><div class="a-body"></div>`;
  elOf.set(m, el);
  fillAssistant(el.querySelector('.a-body'), m, isLast);
  return el;
}

function fillAssistant(body, m, isLast) {
  const wasOpen = !!body.querySelector('details[open]');
  const canRedo = isLast && !streaming;
  let html = '<h2 class="sr-only">SoilSense said:</h2>';
  if (m.notice) html += `<div class="notice">${icon('info', 16)}<span>${esc(m.notice)}</span></div>`;
  if (m.pending && !m.content) html += '<div class="typing" role="img" aria-label="SoilSense is thinking"><i></i><i></i><i></i></div>';
  html += '<div class="prose"></div>';
  if (m.error) html += `<div class="err">${icon('alert', 16)}<span>${esc(m.error)}</span>${canRedo ? `<button type="button" class="btn-sm" data-act="retry">${icon('refresh', 15)}Retry</button>` : ''}</div>`;
  if (!m.pending && (m.content || m.stopped)) {
    html += '<div class="actions">';
    if (m.content) html += `<button type="button" class="act" data-act="copy">${icon('copy', 16)}<span>Copy</span></button>`;
    if (canRedo && !m.error) html += `<button type="button" class="act" data-act="regen">${icon('refresh', 16)}<span>Regenerate</span></button>`;
    if (m.stopped) html += `<span class="tag">${icon('pause', 12)}Stopped</span>`;
    html += '</div>';
  }
  if (m.sources && m.sources.length) {
    const n = m.sources.length;
    html += `<details class="sources"${wasOpen ? ' open' : ''}><summary>${icon('chev', 14, 'chev')}${icon('book', 15)}${n} source${n > 1 ? 's' : ''}</summary>
      <div class="src-panel"><p class="src-head">From the knowledge base</p>
      <ol class="chips">${m.sources.map((s, i) => `<li class="chip" title="${esc(s)}"><b aria-hidden="true">${i + 1}</b><span>${esc(s)}</span></li>`).join('')}</ol></div></details>`;
  }
  body.innerHTML = html;
  updateProse(body, m);
}
function updateProse(body, m) {
  const prose = body.querySelector('.prose');
  prose.innerHTML = md(m.content || '');
  if (!(m.pending && m.content)) return;
  let el = prose; // put the caret at the end of the deepest last element
  while (el.lastChild && el.lastChild.nodeType === 1 && el.lastChild.tagName !== 'BR') el = el.lastChild;
  const caret = document.createElement('span'); caret.className = 'caret'; caret.setAttribute('aria-hidden', 'true');
  el.appendChild(caret);
}

// ---------- Message actions ----------
view.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'), c = current();
  if (!b || !c) return;
  const m = c.messages[[...view.children].indexOf(b.closest('.msg'))];
  if (b.dataset.act === 'copy') { if (m) copyAnswer(b, m.content); }
  else if (!streaming) { // regen / retry: drop the last answer and ask again
    c.messages.pop();
    const lastUser = c.messages[c.messages.length - 1];
    if (lastUser && lastUser.role === 'user') ask(lastUser.content, true);
  }
});
async function copyAnswer(b, text) {
  let ok = true;
  try { await navigator.clipboard.writeText(text); } catch { ok = fallbackCopy(text); }
  b.classList.toggle('ok', ok);
  b.innerHTML = icon(ok ? 'check' : 'alert', 16) + `<span>${ok ? 'Copied' : 'Copy failed'}</span>`;
  announce(ok ? 'Copied to clipboard' : 'Copy failed');
  setTimeout(() => { b.classList.remove('ok'); b.innerHTML = icon('copy', 16) + '<span>Copy</span>'; }, 1600);
}
function fallbackCopy(text) {
  const t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
  document.body.appendChild(t); t.select();
  let ok = false; try { ok = document.execCommand('copy'); } catch { /* unsupported */ }
  t.remove(); return ok;
}
const announce = t => { const a = $('announcer'); a.textContent = ''; setTimeout(() => { a.textContent = t; }, 60); };

// ---------- Scrolling ----------
const nearBottom = () => scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 120;
function updateToBottom() { toBottom.hidden = nearBottom() || !current(); }
scroller.addEventListener('scroll', updateToBottom, { passive: true });
toBottom.onclick = () => { scroller.scrollTo({ top: scroller.scrollHeight, behavior: reducedMotion.matches ? 'auto' : 'smooth' }); input.focus(); };
function withScroll(fn) { const stick = nearBottom(); fn(); if (stick) scroller.scrollTop = scroller.scrollHeight; updateToBottom(); }

// ---------- Composer ----------
let prevLen = 0;
function syncComposer() {
  input.style.height = 'auto';
  const h = input.scrollHeight;
  input.style.height = Math.min(h, 200) + 'px';
  input.style.overflowY = h > 200 ? 'auto' : 'hidden';
  const len = input.value.length;
  countEl.textContent = len >= MAXLEN - 100 ? `${len}/${MAXLEN}` : '';
  countEl.classList.toggle('max', len >= MAXLEN);
  if (len >= MAXLEN && prevLen < MAXLEN) announce(`Character limit of ${MAXLEN} reached`);
  prevLen = len;
  sendBtn.classList.toggle('stop', !!streaming);
  sendBtn.type = streaming ? 'button' : 'submit';
  sendBtn.setAttribute('aria-label', streaming ? 'Stop generating' : 'Send message');
  sendBtn.innerHTML = icon(streaming ? 'stop' : 'up');
  sendBtn.disabled = !streaming && !input.value.trim();
}
input.addEventListener('input', syncComposer);
input.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.keyCode !== 229) { e.preventDefault(); if (!streaming) form.requestSubmit(); }
});
form.addEventListener('submit', e => {
  e.preventDefault();
  const q = input.value.trim();
  if (streaming || !q) return;
  input.value = ''; syncComposer(); ask(q);
});
sendBtn.addEventListener('click', e => { if (streaming) { e.preventDefault(); streaming.ctrl.abort(); } });

// ---------- Chat: request + NDJSON stream ----------
async function readStream(res, msg, onChange, onDelta) {
  const reader = res.body.getReader(), dec = new TextDecoder();
  let buf = '', finished = false;
  const handle = line => {
    if (!line.trim()) return;
    let ev; try { ev = JSON.parse(line); } catch { return; }
    if (ev.type === 'sources') { msg.sources = Array.isArray(ev.sources) ? ev.sources.map(String) : []; onChange(); }
    else if (ev.type === 'notice') { msg.notice = String(ev.text || ''); onChange(); }
    else if (ev.type === 'delta') { msg.content += String(ev.text || ''); onDelta(); }
    else if (ev.type === 'error') msg.error = String(ev.message || 'The answer was interrupted.');
    else if (ev.type === 'done') finished = true;
  };
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const parts = buf.split('\n'); buf = parts.pop();
    parts.forEach(handle);
  }
  handle(buf + dec.decode());
  if (!finished && !msg.error) msg.error = 'The connection closed before the answer finished.';
}

async function ask(q, regenerate = false) {
  q = q.slice(0, MAXLEN);
  let c = current();
  if (!c) {
    c = { id: uid(), title: q.length > 60 ? q.slice(0, 57).trimEnd() + '…' : q, messages: [], updated: Date.now() };
    chats.push(c); currentId = c.id; store.set(CUR_KEY, c.id);
  }
  const prior = regenerate ? c.messages.slice(0, -1) : c.messages;
  const history = prior.filter(m => m.content && !m.error).slice(-4).map(m => ({ role: m.role, content: m.content }));
  if (!regenerate) c.messages.push({ role: 'user', content: q });
  const msg = { role: 'assistant', content: '', sources: [], notice: '', pending: true };
  c.messages.push(msg);
  c.updated = Date.now();
  const ctrl = new AbortController();
  streaming = { chat: c, msg, ctrl };
  save(); setTitle(); renderHistory(); renderView(); syncComposer();
  scroller.scrollTop = scroller.scrollHeight; updateToBottom();
  // The re-render removed the card / Retry / Regenerate button that had focus; keep focus by the Stop control.
  const a = document.activeElement;
  if (!a || a === document.body || !a.isConnected) input.focus({ preventScroll: true });

  // Progressive rendering, throttled to one paint per animation frame.
  let raf = 0;
  const body = () => { const n = elOf.get(msg); return currentId === c.id && n && n.isConnected ? n.querySelector('.a-body') : null; };
  const full = () => { const b = body(); if (b) withScroll(() => fillAssistant(b, msg, true)); };
  const paint = () => {
    raf = 0;
    const b = body(); if (!b) return;
    withScroll(() => { const t = b.querySelector('.typing'); if (t) t.remove(); updateProse(b, msg); });
  };

  try {
    const res = await fetch('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q, history }), signal: ctrl.signal
    });
    if (!res.ok || !res.body) {
      let text = `The server returned an error (${res.status}).`;
      try { const j = await res.json(); if (j && j.error) text = j.error; } catch { /* not JSON */ }
      throw Object.assign(new Error(text), { friendly: true });
    }
    await readStream(res, msg, full, () => { if (!raf) raf = requestAnimationFrame(paint); });
  } catch (err) {
    if (err.name === 'AbortError') msg.stopped = true; // a deliberate stop is neutral, not an error
    else msg.error = err.friendly ? err.message : 'Could not reach the SoilSense server. Check your connection and try again.';
  } finally {
    finish(c, msg, raf);
  }
}

function finish(c, msg, raf) {
  if (raf) cancelAnimationFrame(raf);
  msg.pending = false;
  if (streaming && streaming.msg === msg) streaming = null; // may already be released (chat switch)
  c.updated = Date.now();
  save();
  renderHistory(); syncComposer();
  if (currentId !== c.id) return; // user moved on: nothing to update or announce
  // Update only the finished answer, so other messages keep focus and open disclosures.
  const node = elOf.get(msg);
  if (node && node.isConnected) withScroll(() => fillAssistant(node.querySelector('.a-body'), msg, true));
  view.setAttribute('aria-busy', 'false');
  const text = msg.content ? ((node && node.isConnected && node.querySelector('.prose').innerText) || msg.content) : '';
  if (msg.error && !text) announce('Error: ' + msg.error);
  else if (msg.stopped && !text) announce('Response stopped.');
  else announce('SoilSense answered: ' + text.slice(0, 1200) + (msg.error ? ' ' + msg.error : ''));
  const a = document.activeElement;
  if (!a || a === document.body || !a.isConnected || (!mq.matches && (a === input || a === sendBtn))) input.focus({ preventScroll: true });
}

// ---------- Status ----------
async function loadStatus() {
  const pill = $('status');
  const set = (cls, long, short) => {
    pill.className = 'pill ' + cls; pill.title = long;
    pill.querySelector('.long').textContent = long; pill.querySelector('.short').textContent = short;
  };
  try {
    const r = await fetch('/api/status', { cache: 'no-store' });
    const s = await r.json();
    if (s.live) set('live', `Live AI · ${String(s.model || '').split('/').pop()}`, 'Live AI');
    else set('offline', 'Offline · knowledge-base mode', 'Offline');
    kbSections = Number(s.sections) || 0;
    if (kbSections) {
      $('kbInfo').textContent = `${kbSections} curated sections · TF-IDF retrieval`;
      const chip = $('heroChip'); if (chip) chip.textContent = heroChip();
    }
  } catch { set('down', 'Server unreachable', 'No server'); }
}

// ---------- Init ----------
const last = store.get(CUR_KEY, null);
openChat(chats.some(c => c.id === last) ? last : null);
syncComposer();
loadStatus();
input.focus();
})();
