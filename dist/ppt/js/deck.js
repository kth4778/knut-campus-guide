// KNUTIPS 웹 발표 엔진
// 1920×1080 무대에 70장을 겹쳐 놓고 한 장씩 보여 준다.
//   정적 장: gpt-image 슬라이드를 조각으로 나눈 것(tools/build_slides.py). 들어올 때 조각이 차분하게 떠오른다
//   모션 장: js/motion.js 의 HTML 장면(누티 캐릭터 · 실제 화면 · 실제 로고)
//   폰 화면 영상: 정적 장의 무대 칸에 실제 화면 클립(반복)
// 주소 옵션
//   (없음)          혼자 넘겨 보기. 아래 조작 띠
//   ?aud            발표자 창이 연 청중 창. 조작 띠 없이, 발표자 창을 따라간다
//   ?preview&live   발표자 창의 「지금 화면」. 따라가며 연출도 재생
//   ?preview&i=N    발표자 창의 「다음 장」. 움직임 없이 끝 상태만
// 창끼리는 BroadcastChannel('knutips-deck')로 {type:'go', i} · {type:'black', on}을 주고받는다.
import { MOTION } from './motion.js?v=1795489195';
import { RICH } from './rich.js?v=1795489195';
import { MM } from './mm.js?v=1795489195';
import { MADE } from './made.js?v=1795489195';
import { REALSCENES } from './real.js?v=1795489195';

const q = new URLSearchParams(location.search);
// 링크(Artifact)에서는 주소 끝 #aud 로 청중 화면을 연다(링크에는 ?aud 같은 물음표 옵션이 전달되지 않는다)
const AUD = q.has('aud') || /^#aud\b/.test(location.hash), PREVIEW = q.has('preview'), LIVE = q.has('live');
const SOLO = !AUD && !PREVIEW;
// claude.ai 링크(Artifact)로 열린 경우: 팀원이 함께 쓰는 대본 패널을 켠다(js/notes.js)
const ARTIFACT = SOLO && typeof window.claude?.use === 'function';
// 링크에서 대본 패널을 연 창은 발표자 창 역할: #aud 로 연 청중 창이 이 창을 따라 넘어간다
const ROLE = AUD ? 'aud' : PREVIEW ? 'preview' : ARTIFACT ? 'presenter' : 'solo';
const CLIPS = { 1: 'home-intro', 14: 'data-to-card', 17: 'feed-swipe', 18: 'photo-first', 19: 'feed-order', 20: 'search-type', 21: 'search-open', 24: 'map-tap', 25: 'building-photo', 26: 'building-floor', 28: 'bus-stops', 31: 'moa-list', 32: 'moa-join', 33: 'moa-chat', 34: 'nuti-match', 35: 'match-result' };

const stage = document.getElementById('stage');
const blackout = document.getElementById('blackout');
if (AUD) document.body.classList.add('aud');
if (PREVIEW) document.body.classList.add('preview');

function fit() {
  const vp = document.getElementById('viewport');
  const s = Math.min(vp.clientWidth / 1920, vp.clientHeight / 1080);
  stage.style.transform = `translate(-50%, -50%) scale(${s})`;
}
addEventListener('resize', fit); fit();

const EASE = 'cubic-bezier(.2,.8,.2,1)';
let DECK = [], SLIDES = [], cur = -1;

function el(tag, cls, parent) { const d = document.createElement(tag); if (cls) d.className = cls; parent.appendChild(d); return d; }

// 정적 장 조각의 등장 순서와 움직임(과하지 않게: 살짝 떠오르기 · 페이드)
function planStatic(pieces) {
  const top = pieces.filter(p => !p.parent && p.parent !== 0);
  const head = top.filter(p => p.kind === 'text' && p.cy < 330).sort((a, b) => a.cy - b.cy || a.cx - b.cx);
  const rest = top.filter(p => !head.includes(p)).sort((a, b) => (Math.round(a.cy / 120) - Math.round(b.cy / 120)) || a.cx - b.cx);
  const order = [];
  let t = 0;
  head.forEach((p, i) => order.push([p, t + i * 90, 'head']));
  t = head.length ? 260 + head.length * 60 : 0;
  rest.forEach((p, i) => {
    const at = t + i * 90;
    if (p.kind === 'band') order.push([p, Math.max(at, 700), 'band']);
    else order.push([p, at, p.kind === 'art' ? 'art' : 'item']);
    pieces.filter(c => c.parent === p.id).sort((a, b) => a.cy - b.cy || a.cx - b.cx).forEach((c, j) => order.push([c, at + 220 + j * 50, 'child']));
  });
  return order;
}
const FRAMES = {
  head: [{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }],
  item: [{ opacity: 0, transform: 'translateY(26px)' }, { opacity: 1, transform: 'none' }],
  child: [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }],
  art: [{ opacity: 0, transform: 'translateY(30px) scale(.96)' }, { opacity: 1, transform: 'none' }],
  band: [{ opacity: 0, clipPath: 'inset(0 100% 0 0 round 60px)' }, { opacity: 1, clipPath: 'inset(0 0 0 0 round 60px)' }],
};

function buildStatic(item, slides) {
  const d = el('div', 'slide', stage);
  const info = slides[String(item.n)];
  const dir = `slides/s${String(item.n).padStart(2, '0')}/`;
  const bg = el('img', 'bg', d); bg.src = dir + info.bg; bg.alt = '';
  const nodes = new Map();
  for (const p of info.pieces) {
    const i = el('img', 'piece', d);
    i.src = dir + p.src; i.alt = '';
    Object.assign(i.style, { left: p.x + 'px', top: p.y + 'px', width: p.w + 'px', height: p.h + 'px' });
    nodes.set(p.id, i);
  }
  let video = null;
  if (info.stage && CLIPS[item.n]) {
    const [x, y, w, h, r] = info.stage;
    video = el('video', 'clip', d);
    Object.assign(video, { src: `media/clips/${CLIPS[item.n]}.mp4`, muted: true, loop: true, playsInline: true, preload: PREVIEW && !LIVE ? 'metadata' : 'auto' });
    Object.assign(video.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
  }
  const order = planStatic(info.pieces);
  return {
    el: d, item,
    enter(animate) {
      if (animate) for (const [p, at, kind] of order) nodes.get(p.id).animate(FRAMES[kind], { duration: kind === 'band' ? 700 : 600, delay: at, easing: EASE, fill: 'both' });
      if (video) {
        video.currentTime = 0;
        if (animate) { video.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: 250, fill: 'both' }); video.play().catch(() => {}); }
      }
    },
    leave() { if (video) video.pause(); },
  };
}

function buildMotion(item) {
  const d = el('div', 'slide', stage);
  // 다시 만든 장(rich.js)이 있으면 그것을 쓴다: 정적 장 번호 또는 모션 장 이름
  const fn = item.kind === 'static' ? (REALSCENES[item.n] || MADE[item.n] || RICH[item.n]) : (REALSCENES[item.id] || MM[item.id] || MADE[item.id] || RICH[item.id] || MOTION[item.id]);
  const sc = fn(d);
  return { el: d, item, enter(animate) { if (animate) sc.play(); }, leave() {} };
}

// ---------- 장 바꾸기 ----------
// 장은 필요할 때 만든다(지금 장 + 다음 장만 미리). 창이 셋이어도 한꺼번에 70장을 불러오지 않게
let SLIDE_DATA = null;
function get(i) {
  if (!SLIDES[i].built) { const it = SLIDES[i].item; SLIDES[i].built = it.kind === 'static' && !RICH[it.n] && !REALSCENES[it.n] && !MADE[it.n] ? buildStatic(it, SLIDE_DATA) : buildMotion(it); }
  return SLIDES[i].built;
}
function show(i, animate = true) {
  i = Math.max(0, Math.min(SLIDES.length - 1, i));
  if (i === cur) return;
  if (cur >= 0) { get(cur).el.classList.remove('on'); get(cur).leave(); }
  cur = i;
  const s = get(i);
  if (!PREVIEW || LIVE) setTimeout(() => { if (i + 1 < SLIDES.length) get(i + 1); }, 400);
  s.el.classList.add('on');
  s.enter(animate);
  if (!PREVIEW) history.replaceState(null, '', location.pathname + location.search + (ARTIFACT ? '#s' : '#/') + (i + 1));
  updateBar();
  dispatchEvent(new CustomEvent('knutips:slide', { detail: { i } }));
}
const chan = PREVIEW && !LIVE ? null : new BroadcastChannel('knutips-deck');
function go(i, from = 'me') {
  i = Math.max(0, Math.min(SLIDES.length - 1, i));
  if (chan && from === 'me') chan.postMessage({ type: 'go', i, role: ROLE });
  show(i);
}
function setBlack(on, from = 'me') {
  blackout.classList.toggle('on', on);
  if (chan && from === 'me') chan.postMessage({ type: 'black', on, role: ROLE });
}
if (chan) chan.onmessage = ({ data }) => {
  if (!data) return;
  // 발표자 창(또는 청중 창 키보드)이 기준. 혼자 보기 창끼리는 서로 따라가지 않는다
  if (data.role !== 'presenter' && data.role !== 'aud') return;
  if (data.type === 'hello' && ROLE === 'presenter') { chan.postMessage({ type: 'go', i: cur, role: ROLE }); return; }
  if (data.type === 'go') show(data.i);
  if (data.type === 'black') blackout.classList.toggle('on', data.on);
};

// ---------- 조작 ----------
if (!PREVIEW) {
  addEventListener('keydown', e => {
    if (e.target.closest?.('textarea, input, [contenteditable]')) return;   // 대본을 쓰는 중에는 장을 넘기지 않는다
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (['ArrowRight', 'PageDown', ' ', 'Enter', 'ArrowDown'].includes(k)) { e.preventDefault(); go(cur + 1); }
    else if (['ArrowLeft', 'PageUp', 'ArrowUp', 'Backspace'].includes(k)) { e.preventDefault(); go(cur - 1); }
    else if (k === 'Home') go(0);
    else if (k === 'End') go(SLIDES.length - 1);
    else if (k === 'b' || k === 'B' || k === '.') setBlack(!blackout.classList.contains('on'));
    else if (k === 'f' || k === 'F') { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {}); }
  });
  stage.addEventListener('click', () => go(cur + 1));
}
if (AUD) {
  const hint = document.getElementById('hint');
  hint.textContent = '클릭하면 전체 화면 · 발표자 창에서 넘기세요';
  hint.style.display = 'block';
  addEventListener('click', () => { document.documentElement.requestFullscreen().catch(() => {}); hint.style.display = 'none'; }, { once: true });
}

// 혼자 보기 조작 띠
let bar = null, hideT = null;
function updateBar() {
  if (!bar) return;
  bar.querySelector('.num').textContent = `${cur + 1} / ${SLIDES.length}`;
  bar.querySelector('.prog i').style.width = ((cur + 1) / SLIDES.length * 100) + '%';
}
if (SOLO) {
  bar = document.getElementById('bar');
  bar.hidden = false;
  bar.innerHTML = '<button data-a="prev">◀</button><span class="num"></span><button data-a="next">▶</button><div class="prog"><i></i></div><button data-a="notes">대본</button>' + (ARTIFACT ? '' : '<button data-a="pres">발표자 창</button>') + '<button data-a="full">⤢</button>';
  bar.addEventListener('click', e => {
    e.stopPropagation();
    const a = e.target.closest('button')?.dataset.a;
    if (a === 'prev') go(cur - 1);
    if (a === 'next') go(cur + 1);
    if (a === 'full') document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {});
    if (a === 'pres') window.open('presenter.html#/' + (cur + 1), 'knutips-presenter');
    if (a === 'notes') dispatchEvent(new CustomEvent('knutips:notes'));
    if (e.target.closest('.prog')) { const r = e.target.closest('.prog').getBoundingClientRect(); go(Math.floor((e.clientX - r.left) / r.width * SLIDES.length)); }
  });
  const wake = () => { bar.classList.remove('hide'); clearTimeout(hideT); hideT = setTimeout(() => bar.classList.add('hide'), 2600); };
  addEventListener('mousemove', wake); wake();
}

// ---------- 시작 ----------
const [order, slides] = await Promise.all([fetch('data/deck-order.json').then(r => r.json()), fetch('data/slides.json').then(r => r.json())]);
DECK = order;
SLIDE_DATA = slides;
SLIDES = order.map(it => ({ item: it, built: null }));
window.KNUTIPS = { DECK, count: SLIDES.length, go: i => go(i) };
const startAt = q.has('i') ? +q.get('i') : (+(location.hash.match(/#\/?s?(\d+)/) || [])[1] || 1) - 1;
if (SOLO) { const { initNotes } = await import('./notes.js?v=1795489195'); initNotes(DECK, fit, { open: ARTIFACT && innerWidth >= 900 }); }
if (PREVIEW && !LIVE) { show(startAt, false); }
else {
  show(startAt, true);
  if (chan && (AUD || LIVE)) chan.postMessage({ type: 'hello', role: ROLE });
}
