// 직접 만든 발표처럼 보이게 하는 부품: 실제 화면·사진·캡처를 테이프로 붙이고, 형광펜·마커로 표시한다.
// 소품(테이프·메모지·형광펜·동그라미·화살표·압정·종이 결)은 gpt-image로 그려 media/hand 에 있다.
import { h, img } from './motion.js';

export const px = v => v + 'px';
export const LOGO = n => `media/brand/${n}.png`;
export const SCR = n => `media/screens/${n}.jpg`;
export const HAND = n => `media/hand/${n}.webp`;
export const OFF = i => `media/official/p${String(i).padStart(2, '0')}.jpg`;
export const CARD = i => `media/cards/${String(i).padStart(3, '0')}.jpg`;
export const PHOTO = n => `media/real/photos/${n}.webp`;
// 손으로 그린 체크(✓)·엑스(✗) 표시
export const MARK = ok => `<img src="media/hand/${ok ? 'check' : 'cross'}.webp" alt="${ok ? '통과' : '실패'}" style="height:1.15em;width:auto;vertical-align:-.22em;margin-right:.35em">`;
// 실패 1개를 정해 두고 두 장(47·ci)에서 같은 테스트로 보여 준다
export const PICK_TESTS = ['A1 첫 화면', 'B1 계정 동그라미', 'D11 건물 핀을 누르면 건물 화면', 'E3 실시간 노선', 'F5 픽업 N빵', 'H1 「학생식당 어디야」'];
export const FAIL_AT = 3;
// 실제 앱 로고: 빨간 네모 K + NUTIPS (앱 화이트 모드 머리글과 같은 모양)
export const brand = (parent, x, y, size, o = {}) => h(parent, 'hm-brand', { left: x == null ? '0' : px(x), width: x == null ? '1920px' : null, textAlign: x == null ? 'center' : null, top: px(y), fontSize: px(size), ...o }, '<i>K</i>NUTIPS');

const REAL = await fetch('data/real.json').then(r => r.json());
const MOCK = await fetch('media/mock/meta.json').then(r => r.json());
export { REAL };

// 왼쪽 정렬 제목: 작은 장 표시 → 굵은 제목(형광펜 단어는 <em>) → 회색 한 줄
export function title(s, x, y, kicker, html, sub, o = {}) {
  if (kicker) s.rise(h(s.el, 'hm-kicker', { left: px(x), top: px(y) }, kicker), 0);
  const t = s.rise(h(s.el, 'hm-title', { left: px(x), top: px(y + (kicker ? 46 : 0)), fontSize: px(o.size || 84), width: o.w ? px(o.w) : null, textAlign: o.align || null }, html), 90);
  if (sub) s.rise(h(s.el, 'hm-sub', { left: px(x), top: px(y + (kicker ? 46 : 0) + (o.size || 84) * 1.18 * (o.lines || 1) + 18), width: o.w ? px(o.w) : null, textAlign: o.align || null }, sub), 220);
  return t;
}
export function tape(parent, x, y, w = 150, rot = -4) {
  return img(parent, HAND('tape'), 'hm-tape', { left: px(x), top: px(y), width: px(w), rotate: rot + 'deg' });
}
const drop = (s, el, at, rot = 0) => s.custom(el, [{ opacity: 0, transform: `translateY(-26px) rotate(${rot > 0 ? -4 : 4}deg) scale(1.04)` }, { opacity: 1, transform: 'none' }], at, 650);

// 메모 카드(흰 종이 + 테이프). src는 출처 한 줄(로고와 함께)
export function noteIn(parent, html, o = {}) {
  const c = h(parent, 'hm-note', { position: o.abs ? 'absolute' : 'relative', width: o.w ? px(o.w) : null, rotate: (o.rot || 0) + 'deg' }, html);
  if (o.src) {
    const f = h(c, 'hm-src');
    if (o.logo) img(f, LOGO(o.logo), '', { height: '22px' });
    f.appendChild(document.createTextNode(o.src));
  }
  if (o.tape !== false) tape(c, (o.w || 360) / 2 - 60, -16, 120, (o.rot || 0) * -2 - 3);
  return c;
}
export function note(s, x, y, w, html, o = {}) {
  const c = noteIn(s.el, html, { ...o, w, abs: true });
  c.style.left = px(x); c.style.top = px(y);
  drop(s, c, o.at || 0, o.rot || 0);
  return c;
}
// 실제 화면 한 부분을 크게 잘라 붙이기: 원본 너비 nw 에서 crop=[x,y,w,h] 영역을 너비 w 로
export function zoom(s, src, nw, crop, x, y, w, o = {}) {
  const [cx, cy, cw, ch] = crop, k = w / cw;
  const c = h(s.el, 'hm-zoom', { left: px(x), top: px(y), width: px(w), height: px(ch * k), rotate: (o.rot || 0) + 'deg', backgroundImage: `url(${src})`, backgroundSize: `${nw * k}px auto`, backgroundPosition: `${-cx * k}px ${-cy * k}px` });
  if (o.tape !== false) tape(c, w / 2 - 60, -18, 120, -3);
  if (o.cap) h(c, 'hm-zoom-cap', {}, o.cap);
  drop(s, c, o.at || 0, o.rot || 0);
  return c;
}
// GitHub Actions 실제 기록(#91)의 세 단계를 크게: 테스트 → 배포 → 공개 사이트 다시 확인
export function jobs(s, x, y, at = 0, gap = 345, down = false) {
  [['테스트', '1분 49초'], ['배포', '14초'], ['다시 확인', '30초']].forEach(([a, b], i) => {
    s.pop(h(s.el, 'hm-job', { left: px(down ? x : x + i * gap), top: px(down ? y + i * gap : y) }, `<i>✓</i><b>${a}</b><small>${b}</small>`), at + i * 350);
    if (i < 2) down ? arrow(s, x + 18, y + i * gap + gap - 34, 36, at + 200 + i * 350, 90) : arrow(s, x + i * gap + gap - 66, y + 22, 50, at + 200 + i * 350, 0);
  });
}
// 노란 포스트잇
export function memo(s, x, y, w, html, o = {}) {
  const c = h(s.el, 'hm-memo', { left: px(x), top: px(y), width: px(w), minHeight: px(o.mh || w), rotate: (o.rot || 0) + 'deg', fontSize: px(o.size || 34) }, html);
  if (o.pin) img(c, HAND('pin'), 'hm-pin', {});
  drop(s, c, o.at || 0, o.rot || 0);
  return c;
}
// 사진(흰 테두리 인화지 + 테이프 + 아래 손글씨 자리에 설명)
export function photo(s, src, x, y, w, hgt, o = {}) {
  const c = h(s.el, 'hm-photo', { left: px(x), top: px(y), width: px(w), rotate: (o.rot || 0) + 'deg' });
  img(c, src, '', { width: '100%', height: px(hgt), objectFit: 'cover', objectPosition: o.pos || 'center' });
  if (o.cap) h(c, 'hm-cap', {}, o.cap);
  if (o.tape !== false) tape(c, w / 2 - 70, -18, 140, (o.rot || 0) * -1.5 - 2);
  drop(s, c, o.at || 0, o.rot || 0);
  return c;
}
// 앱 실제 화면을 폰 테두리에
// 발표장에서 잘 보이게 1.3배(중심 유지), 위아래가 무대 밖으로 나가지 않게 맞춘다
export function phone(s, src, x, y, w, o = {}) {
  const k = o.k ?? 1.4, h0 = w * 2.164 + 20;
  let w2 = w * k, h2 = w2 * 2.164 + 20;
  if (!o.free && h2 > 1020) { w2 = (1020 - 20) / 2.164; h2 = 1020; }
  x -= (w2 - w) / 2; y -= (h2 - h0) / 2;
  if (!o.free) y = Math.min(Math.max(y, 30), 1050 - h2);
  w = w2;
  const p = h(s.el, 'hm-phone', { left: px(x), top: px(y), width: px(w), height: px(h2), rotate: (o.rot || 0) + 'deg' });
  img(p, src, '', {});
  s.rise(p, o.at || 0, { dy: 80 });
  return p;
}
// 실제 화면 클립(반복 재생). 장이 켜질 때 처음부터
// 앱 실제 화면 녹화(화이트 모드, media/clips2)를 폰 틀에 넣어 반복 재생. x·y·w·hgt 는 놓을 자리(가운데 맞춤),
// 폰은 화면 높이를 거의 채우게(높이 1010px) 그린다
export function clip(s, name, x, y, w, hgt, o = {}) {
  const ph = o.h || 1010, pw = Math.round((ph - 20) / 2.164 + 20), cx = x + w / 2;
  const box = h(s.el, 'hm-phone hm-vphone', { left: px(cx - pw / 2), top: px(o.top ?? Math.round((1080 - ph) / 2)), width: px(pw), height: px(ph), rotate: (o.rot || 0) + 'deg' });
  const v = document.createElement('video');
  Object.assign(v, { src: `media/clips2/${name}.mp4`, muted: true, loop: true, playsInline: true, preload: 'auto' });
  box.appendChild(v);
  s.rise(box, 150, { dy: 60 });
  const play = s.play.bind(s);
  s.play = () => { v.currentTime = 0; v.play().catch(() => {}); play(); };
  return box;
}
// 마커: 동그라미 · 밑줄 · 화살표 · 형광펜. 손으로 긋듯 왼쪽부터 드러난다
function stroke(s, name, x, y, w, hgt, at, rot = 0, dur = 650) {
  const m = img(s.el, HAND(name), 'hm-mark', { left: px(x), top: px(y), width: px(w), height: hgt ? px(hgt) : 'auto', rotate: rot + 'deg' });
  s.custom(m, [{ clipPath: 'inset(0 100% 0 0)', opacity: 1 }, { clipPath: 'inset(0 0% 0 0)', opacity: 1 }], at, dur, 'cubic-bezier(.4,.1,.3,1)');
  return m;
}
export const ring = (s, x, y, w, hgt, at, rot = -3) => { const m = stroke(s, 'circle', x, y, w, hgt, at, rot, 800); m.style.zIndex = 0; return m; };
export const under = (s, x, y, w, at, rot = 0) => stroke(s, 'underline', x, y, w, w * 0.12, at, rot, 500);
export const arrow = (s, x, y, w, at, rot = 0) => stroke(s, 'arrow', x, y, w, null, at, rot, 600);
export function swipe(s, x, y, w, hgt, at) { const m = stroke(s, 'swipe', x, y, w, hgt, at, 0, 450); m.style.zIndex = 0; m.style.opacity = .85; return m; }
// 큰 숫자(세면서 멈춘다)
export function num(s, x, y, value, o = {}) {
  const n = h(s.el, 'hm-num', { left: px(x), top: px(y), fontSize: px(o.size || 200), color: o.color || null });
  s.count(n, value, o.at ?? 300, o.dur || 1100, o.fmt);
  s.fade(n, o.at ?? 300, 300);
  if (o.label) s.rise(h(s.el, 'hm-label', { left: px(x + (o.lx || 6)), top: px(y + (o.size || 200) * 1.06) }, o.label), (o.at ?? 300) + 200);
  return n;
}
// 기기 틀(gpt-image) + 실제 화면
export function device(s, kind, x, y, w, src, at = 300) {
  // '-flip'은 왼손 틀을 좌우로 뒤집어 오른손으로 쓴다(화면 칸 좌표도 뒤집음)
  const flip = kind.endsWith('-flip'), base = flip ? kind.slice(0, -5) : kind;
  const m = MOCK[base], k = w / m.w;
  let [sx0, sy0, sx1, sy1] = m.screen;
  if (flip) [sx0, sx1] = [m.w - sx1, m.w - sx0];
  const box = h(s.el, '', { position: 'absolute', left: px(x), top: px(y), width: px(w), height: px(m.h * k) });
  const scr = h(box, '', { position: 'absolute', left: px(sx0 * k), top: px(sy0 * k), width: px((sx1 - sx0) * k), height: px((sy1 - sy0) * k), overflow: 'hidden', background: '#fff', borderRadius: kind.startsWith('hold') ? px(60 * k) : '0' });
  img(scr, src, '', { width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' });
  img(box, `media/mock/${base}.png`, '', { position: 'absolute', inset: '0', width: '100%', height: '100%', transform: flip ? 'scaleX(-1)' : 'none', filter: 'drop-shadow(0 20px 30px rgba(30,35,55,.18))' });
  s.rise(box, at, { dy: 70 });
  box._screen = scr;
  return box;
}
// 위로 천천히 흐르는 목록
export function ticker(s, x, y, w, hgt, items, render, at = 500, speed = 22000) {
  const win = h(s.el, 'hm-ticker', { left: px(x), top: px(y), width: px(w), height: px(hgt) });
  const col = h(win, '', { position: 'absolute', left: '0', top: '0', width: '100%', padding: '18px 14px' });
  [...items, ...items].forEach(it => render(col, it));
  s.fade(win, at, 600);
  s.custom(col, [{ transform: 'translateY(0)' }, { transform: 'translateY(-50%)' }], at, speed, 'linear');
  return win;
}
// 장 구분(01 문제 …): 큰 번호 + 제목 + 실제 사진·화면 콜라주
export function divider(s, no, name, sub, pics) {
  s.rise(h(s.el, 'hm-divno', { left: '150px', top: '250px' }, no), 0);
  s.rise(h(s.el, 'hm-title', { left: '150px', top: '580px', fontSize: '150px' }, name), 150);
  if (sub) s.rise(h(s.el, 'hm-sub', { left: '156px', top: '775px', fontSize: '36px' }, sub), 300);
  under(s, 150, 845, 360, 700);
  pics.forEach(([kind, src, x, y, w, hh, rot, cap], i) => kind === 'phone' ? phone(s, src, x, y, (w - 20) / 2.164, { at: 300 + i * 160, rot, k: 1 }) : photo(s, src, x, y, w, hh, { at: 300 + i * 160, rot, cap }));
}
