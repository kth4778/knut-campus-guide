// 모션 장 16개(이름 키)를 실제 자료 + 손으로 만든 스타일로. 대본의 (영상: …) 설명을 그대로 움직임으로 옮겼다.
import { scene, h, img } from './motion.js';
import { px, LOGO, brand, zoom, jobs, SCR, OFF, CARD, PHOTO, REAL, title, tape, note, noteIn, memo, photo, phone, ring, under, arrow, swipe, num, device, ticker, clip, MARK, PICK_TESTS, FAIL_AT } from './hand.js?v=1795496118';

const RC = n => `media/real/cards/${n}`;
const rnd = i => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };   // 고정된 흩뿌림
const SVGNS = 'http://www.w3.org/2000/svg';
function outlines(parent, x, y, k, fill = '#FFFEFA') {
  const [bw, bh] = REAL.bbox;
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${bw} ${bh}`);
  Object.assign(svg.style, { position: 'absolute', left: px(x), top: px(y), width: px(bw * k), height: px(bh * k), overflow: 'visible' });
  const paths = REAL.buildings.map(b => {
    const p = document.createElementNS(SVGNS, 'path');
    p.setAttribute('d', b.d); p.setAttribute('fill', fill); p.setAttribute('stroke', '#1C2330'); p.setAttribute('stroke-width', '2'); p.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(p);
    const n = b.d.match(/-?[\d.]+/g).map(Number), xs = n.filter((_, i) => i % 2 === 0), ys = n.filter((_, i) => i % 2);
    p._c = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
    p._name = b.name;
    return p;
  });
  parent.appendChild(svg);
  return { svg, paths, k };
}
const stamp = (s, x, y, text, color, at) => { const a = h(s.el, 'hm-stamp', { left: px(x), top: px(y), color }, text); s.custom(a, [{ opacity: 0, transform: 'scale(2)' }, { opacity: .88, transform: 'none' }], at, 350, 'cubic-bezier(.3,1.4,.5,1)'); return a; };

export const MM = {
  // 로고 → 실제 앱 화면 4개가 펼쳐진다
  open(root) {
    const s = scene(root), el = s.el;
    const lg = brand(el, 150, 180, 130);
    s.custom(lg, [{ opacity: 0, transform: 'translateY(30px) scale(.9)' }, { opacity: 1, transform: 'none' }], 0, 800, 'cubic-bezier(.3,1.4,.5,1)');
    s.rise(h(el, 'hm-sub', { left: '156px', top: '335px', fontSize: '38px', color: '#1E2430', fontWeight: '700' }, '피드 · 지도 · MOA · 누티, <em>한 앱에</em>'), 450);
    [['A1-home', '피드'], ['B1-map', '지도'], ['C1-moa', 'MOA<br><small>배달·택시 같이</small>'], ['C5-nuti', '누티<br><small>AI 챗봇</small>']].forEach(([n, l], i) => {
      const p = phone(s, SCR(n), 150 + i * 440, 475, 270, { rot: [-4, 2, -2, 4][i], at: 700 + i * 180, k: 1 });
      s.custom(p, [{ opacity: 0, transform: 'translate(0, 300px) rotate(0deg)' }, { opacity: 1, transform: 'none' }], 700 + i * 180, 800);
      s.rise(h(el, 'hm-label', { left: px(150 + i * 440), top: '398px', width: '270px', textAlign: 'center', fontSize: '26px', fontWeight: '800', color: '#141A24', whiteSpace: 'nowrap' }, l.replace('<br><small>', ' <span style="font-weight:600;color:#6B7280">').replace('</small>', '</span>')), 1300 + i * 180);
    });
    return s;
  },
  // 세 질문이 터지며 검색창·페이지 조각이 흩어진다
  questions(root) {
    // 답을 찾으려면 에타 · 학교 인스타 · 학교 홈페이지 · 학과 사무실 전화를 따로 — gpt-image 그림 위에 실제 로고
    const s = scene(root), el = s.el;
    title(s, 150, 70, '기획 배경', '답은 <em>여기저기</em>에', '에타 · 인스타 · 학교 홈페이지 · 사무실 전화, 전부 따로 확인', { size: 80 });
    const FW = 1020, FH = FW * 2 / 3;
    const fr = h(el, 'hm-photo', { left: '450px', top: '320px', width: px(FW), rotate: '-1deg' });
    img(fr, 'media/rich/confused.webp', '', { width: '100%', display: 'block' });
    tape(fr, FW / 2 - 75, -18, 150, 2);
    s.rise(fr, 200, { dy: 50 });
    // 그림 속 창 자리에 실제 로고(그림 1260×840 기준)
    [['everytime', '에브리타임', 0.10, 0.06], ['instagram', '학교 인스타', 0.70, 0.07], ['emblem', '학교 홈페이지', 0.08, 0.47], [null, '사무실 전화', 0.73, 0.70]].forEach(([lg, t, fx, fy], i) => {
      const tag = h(fr, 'hm-note', { position: 'absolute', left: px(14 + fx * (FW - 28)), top: px(14 + fy * FH), padding: '10px 16px', margin: '0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '26px', fontWeight: '800', whiteSpace: 'nowrap', rotate: `${[-3, 2, -2, 3][i]}deg` });
      if (lg) img(tag, LOGO(lg), '', { height: '40px' });
      tag.appendChild(document.createTextNode(t));
      s.pop(tag, 800 + i * 220, { s: .6 });
    });
    return s;
  },
  // 65개 페이지 · 8개 층 19곳 · 에타·인스타·홈페이지·전화가 흩어졌다가 한 점(KNUTIPS)으로
  scattered(root) {
    const s = scene(root), el = s.el;
    const items = [];
    for (let i = 0; i < 30; i++) items.push(['p', OFF(i * 2 % 65), 200, 128]);
    ['B4-building-f6', 'B5-map-bus', 'A1-home'].forEach(n => items.push(['s', SCR(n), 110, 238]));
    items.forEach(([k, src, w, hh], i) => {
      const x = 960 + (rnd(i + 3) - .5) * 1650, y = 560 + (rnd(i + 70) - .5) * 860;
      const c = h(el, 'hm-photo', { left: px(x - w / 2), top: px(y - hh / 2), width: px(w), padding: '5px', rotate: `${(rnd(i) - .5) * 26}deg` });
      img(c, src, '', { width: '100%', height: px(hh), objectFit: 'cover', objectPosition: 'top', display: 'block' });
      s.custom(c, [{ opacity: 0, transform: 'scale(.5)' }, { opacity: 1, transform: 'none', offset: .25 }, { opacity: 1, transform: 'none', offset: .6 }, { opacity: 0, transform: `translate(${960 - x}px, ${560 - y}px) scale(.1) rotate(40deg)` }], 100 + i * 30, 3200, 'cubic-bezier(.5,0,.3,1)');
    });
    [['65페이지', '학교 꿀팁이<br>페이지마다 따로', 200, 160], ['8층 19곳', '한 건물 안 부서,<br>몇 층인지 모름', 1340, 150], ['4곳', '질문 하나에<br>에타·인스타·홈피·전화', 760, 800]].forEach(([b, l, x, y], i) => {
      const m = memo(s, x, y, 380, `<span style="font-size:68px;letter-spacing:-.04em">${b}</span><div style="font-size:27px;margin-top:8px;line-height:1.35">${l}</div>`, { rot: [-4, 3, -2][i], at: 300 + i * 250 });
      s.custom(m, [{ opacity: 1 }, { opacity: 0, transform: `translate(${960 - x - 190}px, ${560 - y - 150}px) scale(.1)` }], 2300, 900, 'cubic-bezier(.5,0,.3,1)');
    });
    photo(s, 'media/rich/oneapp.webp', 150, 250, 840, 560, { rot: -2, at: 3100 });
    const lg = brand(el, 1080, 380, 140);
    s.custom(lg, [{ opacity: 0, transform: 'scale(.2)' }, { opacity: 1, transform: 'none' }], 3200, 700, 'cubic-bezier(.3,1.5,.5,1)');
    s.rise(h(el, 'hm-title', { left: '1080px', top: '570px', fontSize: '84px' }, '흩어진 정보를<br><em>한 앱</em>에서'), 3500);
    return s;
  },
  // 숫자 8개가 차례로 멈춘다 — 숫자마다 실제 자료 한 장
  numbers(root) {
    const s = scene(root), el = s.el;
    title(s, 150, 70, '숫자로 본 KNUTIPS', '모은 것, <em>세어 보면</em>', null, { size: 76 });
    const N = [[484, '장소·꿀팁', RC('P035-1.webp'), '맛집·건물·생활 꿀팁 하나하나'], [532, '게시물', CARD(10), '484 + 제휴 48, 피드에 뜨는 글'], [680, '카드뉴스 그림', CARD(22), '게시물 하나에 1~4장'], [37, '건물', PHOTO('hq-entrance'), '교내 건물 · 지도 핀 34동'], [24, '버스 노선', SCR('B5-map-bus'), '학교 앞 정류장에 서는 노선'], [20, '정류장', SCR('B7-bus-live'), '학교 안·정문 앞 정류장'], [48, '제휴 매장', PHOTO('haekbap'), '학생증 보여 주면 혜택'], [14, '실제 사진', PHOTO('library-w20'), '팀이 직접 찍은 장소']];
    // 칸마다 사진을 위에, 숫자를 아래에(세 자리 숫자도 사진과 겹치지 않게)
    N.forEach(([v, l, src, mean], i) => {
      const x = 150 + (i % 4) * 450, y = 250 + Math.floor(i / 4) * 400;
      const c = h(el, 'hm-photo', { left: px(x), top: px(y), width: '230px', padding: '6px', rotate: `${(rnd(i) - .5) * 10}deg` });
      img(c, src, '', { width: '100%', height: '120px', objectFit: 'cover', objectPosition: 'top', display: 'block' });
      if (i % 2 === 0) tape(c, 60, -14, 100, 3);
      s.custom(c, [{ opacity: 0, transform: 'translateY(-30px) rotate(8deg)' }, { opacity: 1, transform: 'none' }], 200 + i * 200, 600);
      num(s, x, y + 160, v, { size: 130, label: l, at: 300 + i * 200, dur: 900 });
      s.rise(h(el, 'hm-label', { left: px(x + 6), top: px(y + 345), fontSize: '21px', fontWeight: '700', color: '#6B7280', whiteSpace: 'nowrap' }, mean), 600 + i * 200);
    });
    return s;
  },
  // 실제 카드뉴스 수백 장이 흐르다 폰 화면으로
  feed(root) {
    const s = scene(root), el = s.el;
    for (let c = 0; c < 6; c++) {
      const ids = Array.from({ length: 10 }, (_, i) => (i * 7 + c * 11) % 65);
      const t = ticker(s, 40 + c * 310, -40, 280, 1160, ids, (p, i) => img(p, CARD(i), '', { display: 'block', width: '100%', borderRadius: '6px', marginBottom: '16px', boxShadow: '0 8px 16px rgba(30,35,55,.14)' }), c * 80, 26000 + (c % 3) * 4000);
      s.custom(t, [{ opacity: 1 }, { opacity: .28 }], 1800, 800);
    }
    const p = phone(s, SCR('A2-home-swipe'), 760, 160, 390, { at: 1700 });
    s.custom(p, [{ opacity: 0, transform: 'scale(1.6)' }, { opacity: 1, transform: 'none' }], 1700, 900, 'cubic-bezier(.2,.9,.3,1)');
    memo(s, 1240, 300, 400, '<span style="font-size:110px;letter-spacing:-.05em">532</span><div style="font-size:30px">게시물, 하나의 피드</div>', { rot: 4, at: 2400, pin: true });
    return s;
  },
  // 「장학금」을 치면 흩어진 카드 중 15건이 한 목록으로
  search(root) {
    const s = scene(root), el = s.el;
    const bar = h(el, 'hm-note', { position: 'absolute', left: '150px', top: '150px', width: '760px', fontSize: '56px', fontWeight: '800', padding: '22px 34px' }, '🔍 <span class="q"></span><span style="display:inline-block;width:4px;height:54px;background:#141A24;vertical-align:-8px;animation:blink 1s steps(1) infinite"></span>');
    tape(bar, 320, -16, 120, -3);
    s.pop(bar, 0, { s: .9 });
    const q = bar.querySelector('.q'), word = '장학금';
    const typer = s.play.bind(s);
    s.play = () => { q.textContent = ''; [...word].forEach((ch, i) => setTimeout(() => { q.textContent += ch; }, 500 + i * 260)); typer(); };
    q.textContent = word;
    for (let i = 0; i < 30; i++) {
      const x = 1000 + rnd(i) * 820, y = 120 + rnd(i + 30) * 820, hit = i < 15;
      const c = img(el, CARD((i * 4) % 65), '', { position: 'absolute', left: px(x), top: px(y), width: '110px', height: '138px', objectFit: 'cover', borderRadius: '5px', boxShadow: '0 6px 12px rgba(30,35,55,.14)', rotate: `${(rnd(i + 5) - .5) * 30}deg` });
      if (hit) s.custom(c, [{ opacity: 1 }, { opacity: 1, offset: .3 }, { opacity: 0, transform: `translate(${-x + 200 + (i % 5) * 150}px, ${-y + 340 + Math.floor(i / 5) * 150}px) scale(.8) rotate(0deg)` }], 1300, 1400, 'cubic-bezier(.5,0,.3,1)');
      else s.custom(c, [{ opacity: 1 }, { opacity: 0, transform: 'scale(.8)' }], 1300, 600);
    }
    for (let i = 0; i < 15; i++) {
      const c = img(el, CARD((i * 4) % 65), '', { position: 'absolute', left: px(160 + (i % 5) * 150), top: px(330 + Math.floor(i / 5) * 175), width: '130px', height: '162px', objectFit: 'cover', borderRadius: '5px', boxShadow: '0 6px 12px rgba(30,35,55,.14)' });
      s.custom(c, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'none' }], 2300 + i * 50, 400);
    }
    num(s, 160, 880, 15, { size: 130, fmt: v => Math.round(v) + '건', at: 2700 });
    ring(s, 110, 850, 380, 190, 3300);
    phone(s, SCR('A7-search-result'), 1250, 240, 320, { rot: 3, at: 2600 });
    return s;
  },
  // 실제 지도(OSM 외곽선) 위에 건물 핀이 꽂히고 대학본부로
  map(root) {
    const s = scene(root), el = s.el;
    title(s, 150, 90, '지도', '교내 건물 <em>34동</em>이 지도 위에', null, { size: 76 });
    const m = h(el, 'hm-photo', { left: '150px', top: '250px', width: '820px', height: '780px', rotate: '-1.5deg' });
    tape(m, 340, -18, 150, 2);
    s.rise(m, 100);
    const o = outlines(m, 120, 20, 1.12);
    o.paths.forEach((p, i) => s.custom(p, [{ opacity: 0 }, { opacity: 1 }], 200 + i * 25, 300));
    o.paths.forEach((p, i) => {
      const e8 = /E8/.test(p._name);
      const pin = img(m, 'media/hand/pin.webp', '', { position: 'absolute', left: px(120 + p._c[0] * o.k - 12), top: px(20 + p._c[1] * o.k - 36), width: e8 ? '40px' : '24px', filter: e8 ? 'none' : 'hue-rotate(200deg) saturate(.7)', zIndex: 4 });
      s.custom(pin, [{ opacity: 0, transform: 'translateY(-60px)' }, { opacity: 1, transform: 'none' }], 900 + i * 45, 350, 'cubic-bezier(.3,1.5,.5,1)');
      if (e8) { p.setAttribute('fill', '#FFD84D'); s.pop(h(m, 'hm-note', { position: 'absolute', left: px(120 + p._c[0] * o.k + 30), top: px(20 + p._c[1] * o.k - 40), fontSize: '22px', padding: '10px 16px', fontWeight: '800', whiteSpace: 'nowrap', zIndex: 5 }, '대학본부'), 2600); }
    });
    s.fade(h(m, '', { position: 'absolute', left: '20px', bottom: '14px', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '18px', fontWeight: '700', color: '#8A93A0' }, `<img src="${LOGO('osm')}" style="height:24px"> © OpenStreetMap`), 600);
    arrow(s, 980, 520, 260, 2800, -6);
    phone(s, SCR('B1-map'), 1230, 200, 270, { rot: -3, at: 400 });
    phone(s, SCR('B2-building'), 1580, 330, 250, { rot: 4, at: 3000 });
    return s;
  },
  // 대학본부 실제 외곽선이 8개 층으로 솟고 6층 다섯 곳이 켜진다
  building3d(root) {
    const s = scene(root), el = s.el;
    title(s, 150, 90, '3D 층', '<em>6층</em> 선택 → 다섯 곳 표시', '대학본부 실제 외곽선을 8개 층으로 쌓아 제작', { size: 76 });
    const b = REAL.buildings.find(x => /E8/.test(x.name));
    const n = b.d.match(/-?[\d.]+/g).map(Number), xs = n.filter((_, i) => i % 2 === 0), ys = n.filter((_, i) => i % 2);
    const x0 = Math.min(...xs), y0 = Math.min(...ys), bw = Math.max(...xs) - x0, bh = Math.max(...ys) - y0;
    const box = h(el, '', { position: 'absolute', left: '330px', top: '430px', width: '460px', height: '460px', perspective: '1800px' });
    const iso = h(box, '', { position: 'absolute', inset: '0', transformStyle: 'preserve-3d', transform: 'rotateX(58deg) rotateZ(-40deg)' });
    for (let f = 0; f < 8; f++) {
      const svg = document.createElementNS(SVGNS, 'svg');
      svg.setAttribute('viewBox', `${x0 - 2} ${y0 - 2} ${bw + 4} ${bh + 4}`);
      Object.assign(svg.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', overflow: 'visible' });
      const p = document.createElementNS(SVGNS, 'path');
      p.setAttribute('d', b.d); p.setAttribute('fill', f === 5 ? '#FFD84D' : '#FFFEFA'); p.setAttribute('fill-opacity', f === 5 ? '1' : '.9'); p.setAttribute('stroke', '#1C2330'); p.setAttribute('stroke-width', String(bw / 140)); p.setAttribute('stroke-linejoin', 'round');
      svg.appendChild(p); iso.appendChild(svg);
      Object.assign(svg.style, { transform: `translateZ(${f * 46}px)` });
      s.custom(svg, [{ opacity: f ? 0 : 1, transform: 'translateZ(0px)' }, { opacity: 1, transform: `translateZ(${f * 46}px)` }], 400 + f * 160, 600, 'cubic-bezier(.2,.9,.3,1)');
    }
    s.fade(h(el, '', { position: 'absolute', left: '160px', top: '960px', display: 'flex', gap: '10px', alignItems: 'center', fontSize: '22px', fontWeight: '700', color: '#6B7280' }, `<img src="${LOGO('osm')}" style="height:30px"> 대학본부 실제 외곽선 · 8개 층`), 300);
    memo(s, 900, 330, 400, '6층<br><span style="font-size:30px;font-weight:700;line-height:1.7">교무과<br>기획과<br>총무과<br>재무과<br>동문회</span>', { rot: -3, at: 1900, size: 56, pin: true });
    phone(s, SCR('B4-building-f6'), 1460, 260, 300, { rot: 4, at: 2300 });
    return s;
  },
  // TAGO 공공데이터로 노선 24 · 정류장 20, 버스 위치 10~20초마다
  bus(root) {
    const s = scene(root), el = s.el;
    title(s, 150, 90, '버스', '노선 <em>24</em> · 정류장 <em>20</em>', '버스 위치 10~20초마다 갱신', { size: 84 });
    const n = note(s, 160, 470, 460, '', { rot: -2, at: 300, src: '국토교통부 TAGO 공공데이터' });
    n.prepend(img(n, LOGO('molit-h'), '', { height: '70px', display: 'block' }));
    num(s, 170, 700, 24, { size: 160, label: '노선', at: 600 });
    num(s, 470, 700, 20, { size: 160, label: '정류장', at: 800 });
    s.rise(h(el, 'hm-label', { left: '176px', top: '930px', fontSize: '26px', color: '#141A24', fontWeight: '800' }, '학교 안·정문 앞 정류장 20곳에 서는 버스 노선 24개'), 1100);
    phone(s, SCR('B5-map-bus'), 1000, 220, 290, { rot: -4, at: 500 });
    phone(s, SCR('B7-bus-live'), 1420, 260, 290, { rot: 3, at: 800 });
    // 다시 받아오기: 둥근 시계가 계속 돈다
    return s;
  },
  // 9,800원 ÷ 3명 → 3,300원, 4명 → 2,500원, 그리고 밥친구
  // 실제 버스 실시간 위치: 실제 사이트에서 999번을 켜면 지금 달리는 버스가 지도에 뜬다(녹화)
  'bus-live'(root) {
    const s = scene(root), el = s.el;
    title(s, 150, 110, '실시간 버스', '버스가 <em>지금 어디</em> 있는지', '노선 선택 → 실제 버스 위치 지도 표시', { size: 84 });
    const steps = [['1', '버스 탭에서 노선 고르기', '예) 999번 — 학교 ↔ 충주역·터미널'], ['2', '지금 달리는 버스가 지도에', '국토교통부 TAGO 실시간 위치'], ['3', '10~20초마다 새 위치', '정류장을 누르면 도착 예정 시간']];
    steps.forEach(([n, a, b], i) => {
      const c = note(s, 150 + (i % 2) * 30, 400 + i * 190, 760, `<b style="font-size:44px;margin-right:16px">${n}</b><b style="font-size:34px">${a}</b><div style="font-size:26px;color:#4A5260;margin:6px 0 0 58px">${b}</div>`, { rot: i % 2 ? 1 : -1, at: 400 + i * 260, tape: i === 0 });
      c.style.padding = '18px 26px';
    });
    const n = h(el, '', { position: 'absolute', left: '160px', top: '985px', display: 'flex', gap: '10px', alignItems: 'center', fontSize: '22px', fontWeight: '700', color: '#6B7280' }, `<img src="${LOGO('molit-emblem')}" style="height:32px"> 실제 사이트에서 녹화 · 화면 속 999번 2대는 녹화 당시 실제 위치`);
    s.fade(n, 1400);
    clip(s, 'bus-live', 987, 3, 907, 1134);
    return s;
  },
  together(root) {
    const s = scene(root), el = s.el;
    title(s, 150, 90, '함께하기', '같이 타면 아끼고, <em>같이 먹을 친구</em>도', null, { size: 76 });
    const r = noteIn(el, '<div style="font-size:22px;color:#6B7280;font-weight:700">충주터미널 택시비</div><div style="font-size:60px;font-weight:900;letter-spacing:-.03em">9,800원</div><div class="ppl" style="font-size:40px;font-weight:900;margin:14px 0">3명</div><div style="border-top:2px dashed #CBD0D8;padding-top:14px;font-size:26px;color:#6B7280">1인</div><div class="amt" style="font-size:96px;font-weight:900;letter-spacing:-.04em">3,300원</div>', { abs: true, w: 520 });
    Object.assign(r.style, { left: '150px', top: '300px' });
    s.rise(r, 200);
    const ppl = r.querySelector('.ppl'), amt = r.querySelector('.amt');
    const base = s.play.bind(s);
    s.play = () => { ppl.textContent = '3명'; amt.textContent = '3,300원'; amt.style.background = ''; setTimeout(() => { ppl.textContent = '4명 (한 명 더 참여)'; amt.textContent = '2,500원'; amt.style.background = 'linear-gradient(transparent 55%, #FFE58A 55%)'; amt.animate([{ transform: 'scale(1.2)' }, { transform: 'none' }], { duration: 400 }); }, 1800); base(); };
    amt.textContent = '2,500원'; ppl.textContent = '4명 (한 명 더 참여)';
    phone(s, SCR('C3-moa-joined'), 760, 360, 270, { rot: -3, at: 500, k: 1.25 });
    arrow(s, 1070, 560, 200, 2400, -5);
    phone(s, SCR('C8-match-result'), 1320, 360, 270, { rot: 3, at: 2600, k: 1.25 });
    memo(s, 1680, 700, 200, '밥친구<br>매칭', { rot: 6, at: 2900, size: 34, mh: 160 });
    return s;
  },
  // 앱 화면이 조각나 신경망으로
  'ai-reveal'(root) {
    const s = scene(root), el = s.el;
    const C = 6, R = 12, W = 360, H = W * 2.164, X0 = 780, Y0 = 120;
    const nodes = [];
    for (let i = 0; i < C * R; i++) {
      const c = i % C, r = Math.floor(i / C);
      const t = h(el, '', { position: 'absolute', left: px(X0 + c * W / C), top: px(Y0 + r * H / R), width: px(W / C + .5), height: px(H / R + .5), background: `url(${SCR('A1-home')}) ${-c * W / C}px ${-r * H / R}px / ${W}px ${H}px` });
      const layer = i % 4, nx = 300 + layer * 420, ny = 110 + ((i * 7) % 18) * 40;
      nodes.push([nx, ny, layer]);
      s.custom(t, [{ transform: 'none', borderRadius: '0', opacity: 1 }, { transform: 'none', borderRadius: '0', opacity: 1, offset: .3 }, { transform: `translate(${nx - (X0 + c * W / C)}px, ${ny - (Y0 + r * H / R)}px) scale(.9)`, borderRadius: '8px', opacity: 1, boxShadow: '0 6px 12px rgba(30,35,55,.2)' }], 300 + (i % 9) * 30, 1800, 'cubic-bezier(.6,0,.3,1)');
    }
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', '0 0 1920 1080'); Object.assign(svg.style, { position: 'absolute', inset: '0', width: '1920px', height: '1080px', zIndex: 0 });
    let k = 0;
    nodes.forEach(([x, y, l], i) => nodes.forEach(([x2, y2, l2], j) => {
      if (l2 !== l + 1 || (i * 3 + j) % 19) return;
      const ln = document.createElementNS(SVGNS, 'line');
      ln.setAttribute('x1', x + 30); ln.setAttribute('y1', y + 30); ln.setAttribute('x2', x2 + 30); ln.setAttribute('y2', y2 + 30); ln.setAttribute('stroke', '#1C2330'); ln.setAttribute('stroke-opacity', '.35'); ln.setAttribute('stroke-width', '2');
      svg.appendChild(ln); s.custom(ln, [{ opacity: 0 }, { opacity: 1 }], 2000 + (k++ % 40) * 20, 500);
    }));
    el.insertBefore(svg, el.firstChild.nextSibling);
    s.rise(h(el, 'hm-title', { left: '0', width: '1920px', textAlign: 'center', top: '935px', fontSize: '76px' }, '이 화면들 뒤에서, <em>AI</em>는?'), 2400);
    return s;
  },
  // 데이터 한 줄 → 카드뉴스 → OCR 스캔으로 문구 85% · 가격 100% 대조 → 567장 / 0장
  'ai-cards'(root) {
    const s = scene(root), el = s.el;
    const R0 = REAL.rows[2];
    title(s, 150, 80, '검사', '그리기 → 다시 읽기 → <em>대조</em>', null, { size: 76 });
    const row = noteIn(el, `<div class="hm-row" style="font-size:26px"><i style="width:56px">이름</i>${R0.name}</div><div class="hm-row" style="font-size:26px"><i style="width:56px">가격</i>${R0.price.toLocaleString('ko-KR')}원</div>`, { abs: true, w: 470, src: '원본 데이터 한 줄' });
    Object.assign(row.style, { left: '150px', top: '330px' }); s.rise(row, 200);
    arrow(s, 640, 420, 130, 700, 0);
    const card = photo(s, RC(R0.card), 790, 230, 420, 525, { rot: 0, at: 900, tape: false });
    const scan = h(card, '', { position: 'absolute', left: '14px', right: '14px', top: '14px', height: '6px', background: '#22C55E', boxShadow: '0 0 18px 4px rgba(34,197,94,.6)' });
    s.custom(scan, [{ transform: 'translateY(0)', opacity: 0 }, { opacity: 1, offset: .1 }, { transform: 'translateY(520px)', opacity: 1, offset: .9 }, { transform: 'translateY(520px)', opacity: 0 }], 1500, 1500, 'linear');
    s.rise(h(el, 'hm-label', { left: '800px', top: '820px', fontSize: '26px' }, 'OCR로 읽은 글자: 「1인 5,500원」'), 1500);
    [['문구', '85%', 3100], ['가격', '100%', 3400]].forEach(([k, v, at], i) => {
      const c = noteIn(el, `${MARK(true)}<b style="font-size:34px">${k}</b> <span style="font-size:52px;font-weight:900;margin-left:12px">${v}</span>`, { abs: true, w: 380, tape: false });
      Object.assign(c.style, { left: '1290px', top: px(300 + i * 160) }); s.slide(c, at, 80);
    });
    num(s, 1290, 680, 567, { size: 120, label: '장 검사', at: 3800 });
    num(s, 1620, 680, 0, { size: 120, label: '다시 만들 장', at: 4000, fmt: () => '0' });
    return s;
  },
  // 484개 자료 중 6곳만 노트북 속 로컬 LLM으로 → 답과 근거 3곳
  'nuti-rag'(root) {
    const s = scene(root), el = s.el;
    title(s, 150, 70, '누티', '먼저 <em>검색</em>, 그다음 답변', null, { size: 76 });
    const grid = h(el, '', { position: 'absolute', left: '150px', top: '280px', display: 'grid', gridTemplateColumns: 'repeat(22, 22px)', gap: '6px' });
    const hits = [37, 101, 188, 250, 333, 420];
    const cells = [];
    for (let i = 0; i < 484; i++) { const c = h(grid, '', { width: '22px', height: '22px', borderRadius: '4px', background: '#D9DDE4' }); cells.push(c); s.custom(c, [{ opacity: 0 }, { opacity: 1 }], 100 + (i % 22) * 15 + Math.floor(i / 22) * 10, 200); }
    s.rise(h(el, 'hm-label', { left: '150px', top: '900px' }, '자료 484개'), 300);
    hits.forEach((i, k) => {
      s.custom(cells[i], [{ background: '#D9DDE4', transform: 'none' }, { background: '#FFC21A', transform: 'scale(1.6)' }], 1300 + k * 120, 300);
    });
    s.rise(h(el, 'hm-label', { left: '420px', top: '900px', color: '#141A24' }, '→ 맞는 6곳만'), 2000);
    phone(s, SCR('C5-nuti'), 1000, 330, 290, { rot: -2, at: 500 });
    const ol = note(s, 1470, 640, 380, '<b style="font-size:28px">노트북 안 로컬 LLM</b><br>질문이 밖으로 안 나감', { rot: 2, at: 1600 });
    ol.prepend(img(ol, LOGO('ollama'), '', { height: '60px', display: 'block', marginBottom: '8px' }));
    for (let k = 0; k < 6; k++) {
      const dot = h(el, '', { position: 'absolute', left: px(150 + (hits[k] % 22) * 28), top: px(280 + Math.floor(hits[k] / 22) * 28), width: '22px', height: '22px', borderRadius: '4px', background: '#FFC21A', zIndex: 3, opacity: 0 });
      s.custom(dot, [{ opacity: 1, transform: 'none' }, { opacity: 1, transform: `translate(${1145 - 150 - (hits[k] % 22) * 28}px, ${560 - 280 - Math.floor(hits[k] / 22) * 28}px) scale(.6)`, offset: .85 }, { opacity: 0, transform: `translate(${1145 - 150 - (hits[k] % 22) * 28}px, ${560 - 280 - Math.floor(hits[k] / 22) * 28}px) scale(.2)` }], 2200 + k * 120, 1000, 'cubic-bezier(.5,0,.3,1)');
    }
    memo(s, 1560, 300, 300, '답<br><span style="font-size:30px">+ 근거 3곳</span>', { rot: 4, at: 3500, size: 60, pin: true });
    return s;
  },
  // 테스트 하나가 실패하면 배포가 멈추고, 고쳐서 모두 통과해야 GitHub Pages로
  ci(root) {
    const s = scene(root), el = s.el;
    title(s, 150, 80, '자동 테스트', '테스트 통과 시에만 <em>배포</em>', null, { size: 80 });
    const box = noteIn(el, PICK_TESTS.map((t, i) => `<div class="hm-row" style="font-size:30px"><span class="mk" data-i="${i}">${MARK(true)}</span><span>${t}</span></div>`).join(''), { abs: true, w: 780, src: '실제 자동 테스트(Playwright)' });
    Object.assign(box.style, { left: '150px', top: '290px' });
    s.rise(box, 100);
    const rows = box.querySelectorAll('.hm-row');
    rows.forEach((r, i) => s.custom(r, [{ opacity: 0 }, { opacity: 1 }], 300 + i * 150, 200));
    const bad = box.querySelector(`.mk[data-i="${FAIL_AT}"]`);
    const base = s.play.bind(s);
    s.play = () => {
      bad.innerHTML = MARK(false);
      setTimeout(() => { bad.innerHTML = MARK(true); bad.animate([{ transform: 'scale(1.8)' }, { transform: 'none' }], { duration: 400 }); }, 3000);
      base();
    };
    const stop = stamp(s, 1080, 340, '배포 중지', '#D63A2F', 1700);
    s.custom(stop, [{ opacity: .88 }, { opacity: 0 }], 3000, 300);
    s.rise(h(el, 'hm-label', { left: '1080px', top: '470px', fontSize: '38px', fontWeight: '800', color: '#D63A2F' }, '하나라도 실패 → 중지 후 수정'), 1900);
    s.rise(h(el, '', { position: 'absolute', left: '1080px', top: '600px', display: 'flex', gap: '12px', alignItems: 'center', fontSize: '26px', fontWeight: '800', color: '#141A24' }, `<img src="${LOGO('github')}" style="height:40px"> 모두 통과하면 — 실제 기록 #91`), 3300);
    jobs(s, 1080, 670, 3400, 110, true);
    stamp(s, 1480, 760, '배포', '#1F9D55', 4500);
    return s;
  },
  // 꿀팁 제보 → GitHub 이슈 → 팀 확인 → 카드뉴스로 쌓인다
  report(root) {
    const s = scene(root), el = s.el;
    title(s, 150, 80, '다음', '학생 제보로 <em>계속 쌓는 구조</em>', null, { size: 80 });
    phone(s, SCR('43-tip'), 150, 380, 250, { rot: -4, at: 200 });
    arrow(s, 440, 520, 110, 600, 0);
    const n = note(s, 580, 420, 300, '<b style="font-size:32px">GitHub 이슈</b><br>제보가 들어오는 곳', { rot: 2, at: 800 });
    n.prepend(img(n, LOGO('github'), '', { height: '54px', display: 'block', marginBottom: '8px' }));
    arrow(s, 900, 520, 110, 1100, 0);
    memo(s, 1040, 420, 260, '팀 확인<br><span style="font-size:26px">사실 맞나?</span>', { rot: -3, at: 1300, size: 40 });
    arrow(s, 1320, 520, 110, 1600, 0);
    ['P201-1.webp', 'P245-1.webp', 'P246-1.webp', 'P247-1.webp', 'P013-1.webp'].forEach((c, i) => {
      const p = img(el, RC(c), '', { position: 'absolute', left: px(1470 + i * 8), top: px(330 - i * 26), width: '300px', height: '375px', objectFit: 'cover', borderRadius: '6px', boxShadow: '0 12px 24px rgba(30,35,55,.18)', rotate: `${(i % 2 ? 1 : -1) * (2 + i)}deg` });
      s.custom(p, [{ opacity: 0, transform: 'translateY(-300px)' }, { opacity: 1, transform: 'none' }], 1800 + i * 300, 500, 'cubic-bezier(.3,1.3,.5,1)');
    });
    s.rise(h(el, 'hm-label', { left: '1480px', top: '760px' }, '카드뉴스로 누적'), 2400);
    return s;
  },
  // 앱 화면들이 모여 KNUTIPS 로고가 된다
  finale(root) {
    const s = scene(root), el = s.el;
    const scr = ['A1-home', 'A4-place-card', 'A7-search-result', 'B1-map', 'B3-building-3d', 'B7-bus-live', 'C1-moa', 'C5-nuti', 'C8-match-result'];
    scr.forEach((n, i) => {
      const a = (i / scr.length) * Math.PI * 2, x = 960 + Math.cos(a) * 720 - 90, y = 520 + Math.sin(a) * 380 - 195;
      const p = phone(s, SCR(n), x, y, 180, { rot: (rnd(i) - .5) * 16, at: 100 + i * 80 });
      s.custom(p, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'none', offset: .3 }, { opacity: 1, transform: 'none', offset: .6 }, { opacity: 0, transform: `translate(${960 - x - 90}px, ${430 - y - 195}px) scale(.1) rotate(30deg)` }], 100 + i * 80, 3000, 'cubic-bezier(.5,0,.3,1)');
    });
    const lg = brand(el, null, 380, 200);
    s.custom(lg, [{ opacity: 0, transform: 'scale(.2)' }, { opacity: 1, transform: 'none' }], 2900, 700, 'cubic-bezier(.3,1.5,.5,1)');
    s.rise(h(el, 'hm-sub', { left: '0', width: '1920px', textAlign: 'center', top: '700px', fontSize: '50px', color: '#141A24', fontWeight: '800' }, '따로 찾지 말고, <em>넘겨 보는 교통대</em>'), 3400);
    return s;
  },
};
