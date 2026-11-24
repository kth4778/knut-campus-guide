// 모션 장 17개 — 흰 바탕에 누티(캐릭터)와 실제 앱 화면 · 실제 로고가 차분하게 등장한다.
// 장면마다 끝 상태의 DOM을 만들고, play()가 처음 상태에서 끝 상태로 움직인다(Web Animations API).
// 미리보기(움직임 없이 끝 상태)에서는 play()를 부르지 않는다.

const SCR = n => `media/screens/${n}.jpg`;
const LOGO = n => `media/brand/${n}.png`;
const NUTI = n => `media/nuti/${n}.png`;
const EASE = 'cubic-bezier(.2,.8,.2,1)';
const SPRING = 'cubic-bezier(.34,1.45,.55,1)';

export function h(parent, cls, style = {}, html) {
  const d = document.createElement('div');
  if (cls) d.className = cls;
  Object.assign(d.style, style);
  if (html != null) d.innerHTML = html;
  parent.appendChild(d);
  return d;
}
export function img(parent, src, cls, style = {}) {
  const i = document.createElement('img');
  i.src = src; i.alt = ''; i.draggable = false;
  if (cls) i.className = cls;
  Object.assign(i.style, style);
  parent.appendChild(i);
  return i;
}
const px = v => v + 'px';

// 장면 하나를 만드는 틀: 등장 목록(anims)에 넣어 두면 play()가 한꺼번에 돌린다
export function scene(root) {
  const el = h(root, 'mg');
  h(el, 'blob', { left: '-200px', top: '-260px', width: '900px', height: '900px', background: '#DCE7FF' });
  h(el, 'blob', { right: '-240px', bottom: '-300px', width: '1000px', height: '1000px', background: '#FFF1D6', animationDelay: '-6s' });
  const list = [];
  const s = {
    el,
    // 나타나기: 아래에서 살짝 떠오르며
    rise(node, at = 0, o = {}) { list.push([node, [{ opacity: 0, transform: `translateY(${o.dy ?? 34}px) scale(${o.s ?? 1})` }, { opacity: 1, transform: 'none' }], at, o.dur ?? 650, o.ease ?? EASE]); return node; },
    pop(node, at = 0, o = {}) { list.push([node, [{ opacity: 0, transform: `scale(${o.s ?? .6})` }, { opacity: 1, transform: 'none' }], at, o.dur ?? 700, SPRING]); return node; },
    slide(node, at = 0, dx = 120, o = {}) { list.push([node, [{ opacity: 0, transform: `translateX(${dx}px)` }, { opacity: 1, transform: 'none' }], at, o.dur ?? 700, EASE]); return node; },
    fade(node, at = 0, dur = 500) { list.push([node, [{ opacity: 0 }, { opacity: 1 }], at, dur, 'ease']); return node; },
    grow(node, at = 0, dur = 600) { list.push([node, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], at, dur, EASE]); return node; },
    custom(node, frames, at, dur, ease = EASE) { list.push([node, frames, at, dur, ease]); return node; },
    // 숫자 세기: 0에서 끝 값으로
    count(node, to, at = 0, dur = 1100, fmt = v => Math.round(v).toLocaleString('ko-KR'), from = 0) { node._count = [to, at, dur, fmt, from]; node.textContent = fmt(to); return node; },
    head(eyebrow, title, sub, x = 140, y = 120) {
      if (eyebrow) s.rise(h(el, 'eyebrow', { left: px(x), top: px(y) }, eyebrow), 0);
      const t = s.rise(h(el, 'title', { left: px(x), top: px(y + (eyebrow ? 48 : 0)) }, title), 80);
      if (sub) s.rise(h(el, 'sub', { left: px(x), top: px(y + (eyebrow ? 48 : 0) + 104) }, sub), 200);
      return t;
    },
    // 누티: 스프링으로 튀어나와 살랑살랑
    nuti(name, x, y, hgt, at = 300, idle = 'idle') {
      const n = img(el, NUTI(name), 'nuti', { left: px(x), top: px(y), height: px(hgt) });
      // 화면 밖으로 나가지 않게(오른쪽 1880 · 아래 1060 안쪽으로)
      const keep = () => { const w = hgt * n.naturalWidth / n.naturalHeight; if (x + w > 1880) n.style.left = px(1880 - w); if (y + hgt > 1060) n.style.top = px(1060 - hgt); };
      n.complete ? keep() : n.addEventListener('load', keep);
      list.push([n, [{ opacity: 0, transform: 'translateY(80px) scale(.8)' }, { opacity: 1, transform: 'translateY(-12px) scale(1.03)', offset: .7 }, { opacity: 1, transform: 'none' }], at, 900, EASE]);
      n.dataset.idle = idle;
      return n;
    },
    phone(src, x, y, w, at = 400, from = 'up') {
      const p = h(el, 'phone', { left: px(x), top: px(y), width: px(w), height: px(w * 844 / 390 + 24) });
      img(p, src);
      if (from === 'up') s.rise(p, at, { dy: 120 }); else s.slide(p, at, from === 'right' ? 160 : -160);
      return p;
    },
    chip(text, x, y, logo, at = 0) {
      const c = h(el, 'chip', { left: px(x), top: px(y) });
      if (logo) img(c, LOGO(logo)); else h(c, 'dot');
      c.appendChild(document.createTextNode(text));
      return s.pop(c, at, { s: .8 });
    },
    play() {
      for (const n of el.querySelectorAll('.nuti')) n.classList.remove('idle', 'wiggle');
      for (const [node, frames, at, dur, ease] of list) node.animate(frames, { duration: dur, delay: at, easing: ease, fill: 'both' });
      for (const n of el.querySelectorAll('.nuti')) setTimeout(() => n.classList.add(n.dataset.idle), 1300);
      // 검색창 타자: 한글 조합 순서대로 한 자씩
      for (const bar of el.querySelectorAll('.search')) {
        if (!bar._type) continue;
        const q = bar.querySelector('.q'), seq = bar._type;
        q.textContent = '';
        seq.forEach((txt, i) => setTimeout(() => { q.textContent = txt; }, 600 + i * 120));
      }
      for (const node of el.querySelectorAll('*')) {
        if (!node._count) continue;
        const [to, at, dur, fmt, from] = node._count, t0 = performance.now() + at;
        node.textContent = fmt(from);
        const tick = now => { const p = Math.min(1, Math.max(0, (now - t0) / dur)), e = 1 - Math.pow(1 - p, 3); node.textContent = fmt(from + (to - from) * e); if (p < 1) requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
      }
    },
  };
  return s;
}

export const MOTION = {
  // 1+ 표지 다음: 로고와 앱 화면 네 개, 휴대폰을 넘기는 누티
  open(root) {
    const s = scene(root), el = s.el;
    s.pop(img(el, LOGO('logo'), '', { position: 'absolute', left: '150px', top: '150px', height: '170px' }), 0);
    s.rise(h(el, 'title', { left: '350px', top: '178px', fontSize: '110px' }, 'KNUTIPS'), 150);
    s.rise(h(el, 'sub', { left: '356px', top: '310px' }, '교통대 생활 정보를, 인스타처럼 넘겨 보다'), 300);
    ['A1-home', 'B1-map', 'C1-moa', 'C5-nuti'].forEach((n, i) => {
      const p = s.phone(SCR(n), 150 + i * 300, 420, 260, 500 + i * 140);
      p.style.rotate = `${(i - 1.5) * 2.5}deg`;
    });
    s.nuti('open-swipe', 1380, 290, 700, 900);
    return s;
  },
  // 4+ 기획 배경: 질문 세 개와 갸우뚱 누티
  questions(root) {
    const s = scene(root), el = s.el;
    s.nuti('questions-confused', 760, 300, 620, 100, 'wiggle');
    const q = [['밥 어디서 먹지?', 170, 260], ['이 과는 몇 층이지?', 1180, 220], ['버스 언제 와?', 1300, 640]];
    q.forEach(([t, x, y], i) => s.pop(h(el, 'bubble', { left: px(x), top: px(y) }, t), 500 + i * 380));
    s.rise(h(el, 'title', { left: '170px', top: '760px', fontSize: '96px' }, '그거 <em>어디서</em> 봐?'), 1700);
    return s;
  },
  // 8+ 흩어진 정보: 학교 공식 카드 65장, 8개 층 19곳, 앱 3개 사이에서 허둥대는 누티
  scattered(root) {
    const s = scene(root), el = s.el;
    s.head('흩어진 정보', '정보가 없는 게 아니라, <em>모여 있지 않았습니다</em>');
    for (let i = 0; i < 18; i++) {
      const x = 120 + (i % 6) * 120 + (i % 2) * 30, y = 360 + Math.floor(i / 6) * 160 + (i % 3) * 14;
      const c = img(el, `media/cards/${String(i * 3).padStart(3, '0')}.jpg`, 'cardnews', { left: px(x), top: px(y), width: '140px', height: '175px', rotate: `${((i * 37) % 21) - 10}deg` });
      s.pop(c, 200 + i * 45, { s: .7 });
    }
    s.nuti('scattered-overwhelmed', 900, 330, 600, 500, 'wiggle');
    const st = [['65', '학교 공식 페이지', 1490, 380], ['8층 · 19곳', '대학본부 한 건물', 1490, 560], ['3개', '오가야 하는 앱', 1490, 740]];
    st.forEach(([b, l, x, y], i) => {
      const t = h(el, 'tile', { left: px(x), top: px(y), width: '330px', height: '150px' }, `<b style="font-size:58px">${b}</b><span>${l}</span>`);
      s.slide(t, 900 + i * 200, 80);
    });
    return s;
  },
  // 10+ 데이터 출처: 실제 로고 칩이 가운데 로고로 모이고 484가 올라간다
  sources(root) {
    const s = scene(root), el = s.el;
    s.head('모은 데이터', '흩어진 데이터를 <em>하나의 기준</em>으로', '크롤링 없이 · 공개 자료와 동의받은 제보만');
    const L = [['에브리타임 꿀팁', 'everytime'], ['학교 인스타', 'instagram'], ['학교 홈페이지', 'emblem'], ['기존 앱', null], ['총학생회 제휴', null], ['OpenStreetMap', 'osm'], ['국토부 TAGO', 'molit-emblem']];
    L.forEach(([t, lg], i) => s.chip(t, 140, 400 + i * 86, lg, 300 + i * 110));
    const ar = h(el, 'arrow', { left: '600px', top: '700px', width: '260px' });
    s.grow(ar, 1200);
    s.pop(img(el, LOGO('logo'), '', { position: 'absolute', left: '900px', top: '560px', height: '200px' }), 1400);
    const b = s.count(h(el, 'big', { left: '1140px', top: '560px', fontSize: '190px' }), 484, 1550, 1200);
    s.fade(b, 1500);
    s.fade(h(el, 'lab', { left: '1150px', top: '760px', fontSize: '34px' }, '장소 · 꿀팁 = 기존 앱 321 + 누팁스 64 + 학교 공식 99'), 2400);
    s.nuti('sources-basket', 1480, 300, 380, 700);
    return s;
  },
  // 13+ 숫자: 여덟 칸이 차례로 올라간다
  numbers(root) {
    const s = scene(root), el = s.el;
    s.head(null, '숫자로 본 <em>KNUTIPS</em>');
    const N = [[484, '장소·꿀팁'], [532, '게시물'], [680, '카드뉴스 그림'], [37, '건물'], [24, '버스 노선'], [20, '정류장'], [48, '제휴 매장'], [14, '실제 사진']];
    N.forEach(([v, l], i) => {
      const t = h(el, 'tile', { left: px(140 + (i % 4) * 330), top: px(320 + Math.floor(i / 4) * 330), width: '300px', height: '290px' }, `<b>${v}</b><span>${l}</span>`);
      s.rise(t, 150 + i * 110);
      s.count(t.querySelector('b'), v, 300 + i * 110, 900);
    });
    s.nuti('numbers-pointer', 1500, 330, 640, 400);
    return s;
  },
  // 16+ 피드: 실제 카드뉴스가 폰 안에서 흐르고, 누워서 넘기는 누티
  feed(root) {
    const s = scene(root), el = s.el;
    s.head('피드와 검색', '게시물 <em>532</em>개, 하나의 흐름으로');
    const p = h(el, 'phone', { left: '760px', top: '270px', width: '360px', height: '780px' });
    const scr = h(p, 'scr', { background: '#fff' });
    const strip = h(scr, '', { position: 'absolute', left: '0', top: '0', width: '100%' });
    for (let i = 0; i < 24; i++) img(strip, `media/news/t${String(((i * 5) % 81) * 7).padStart(3, '0')}.jpg`, '', { display: 'block', width: '100%', marginBottom: '8px', borderRadius: '6px' });
    s.rise(p, 300, { dy: 120 });
    s.custom(strip, [{ transform: 'translateY(0)' }, { transform: 'translateY(-4200px)' }], 900, 16000, 'linear');
    const b = s.count(h(el, 'big', { left: '140px', top: '420px', fontSize: '200px' }), 532, 500, 1400);
    s.fade(b, 450);
    s.fade(h(el, 'lab', { left: '150px', top: '640px', fontSize: '36px' }, '게시물 모두 카드뉴스'), 900);
    s.nuti('feed-scroll', 1240, 560, 420, 700);
    return s;
  },
  // 21+ 검색: 「장학금」을 치면 15건
  search(root) {
    const s = scene(root), el = s.el;
    s.head('검색', '흩어진 공지가 <em>한 목록</em>에');
    const bar = h(el, 'search', { left: '140px', top: '380px', width: '720px' }, '<span>🔍</span><span class="q"></span><span class="caret"></span>');
    s.rise(bar, 200);
    const q = bar.querySelector('.q');
    q.textContent = '장학금';
    bar._type = ['ㅈ', '자', '장', '장ㅎ', '장하', '장학', '장학ㄱ', '장학그', '장학금'];
    const b = s.count(h(el, 'big', { left: '150px', top: '560px', fontSize: '200px' }), 15, 1700, 900, v => Math.round(v) + '건');
    s.fade(b, 1650);
    s.fade(h(el, 'lab', { left: '160px', top: '780px' }, '「장학금」 검색 결과'), 2000);
    s.phone(SCR('A7-search-result'), 930, 260, 340, 1200);
    s.nuti('search-magnifier', 1360, 360, 560, 500);
    return s;
  },
  // 23+ 지도: 실제 지도 화면과 34동
  map(root) {
    const s = scene(root), el = s.el;
    s.head('지도와 건물', '교내 건물 <em>34동</em>이 지도 위에');
    s.phone(SCR('B1-map'), 760, 260, 360, 200);
    s.phone(SCR('B2-building'), 1130, 300, 320, 900, 'right');
    const b = s.count(h(el, 'big', { left: '150px', top: '420px', fontSize: '220px' }), 34, 600, 1200, v => Math.round(v) + '동');
    s.fade(b, 550);
    s.fade(h(el, 'lab', { left: '160px', top: '660px', fontSize: '34px' }, '이름표를 누르면 건물 화면으로'), 1300);
    s.nuti('map-explorer', 1480, 470, 520, 600);
    return s;
  },
  // 27+ 3D 층: 6층 다섯 곳
  building3d(root) {
    const s = scene(root), el = s.el;
    s.head('만든 방법', '외곽선 + 층별 안내 = <em>3D 층</em>', '도면 없이 공개 데이터만으로');
    s.chip('외곽선 · OpenStreetMap', 140, 440, 'osm', 300);
    s.chip('층별 안내 · 학교 캠퍼스지도', 140, 540, 'emblem', 450);
    s.phone(SCR('B4-building-f6'), 820, 270, 340, 700);
    ['교무과', '기획과', '총무과', '재무과', '동문회'].forEach((t, i) => s.chip(t, 140 + (i % 3) * 210, 700 + Math.floor(i / 3) * 96, null, 1300 + i * 120));
    s.nuti('building-blocks', 1280, 330, 640, 500);
    return s;
  },
  // 29+ 버스: 국토교통부 TAGO, 정류장 20 · 노선 24
  bus(root) {
    const s = scene(root), el = s.el;
    s.pop(img(el, LOGO('molit-h'), '', { position: 'absolute', left: '140px', top: '110px', height: '70px' }), 0);
    s.rise(h(el, 'title', { left: '140px', top: '200px' }, '국토교통부 <em>TAGO</em> 공공데이터'), 120);
    const t1 = h(el, 'tile', { left: '140px', top: '380px', width: '300px', height: '260px' }, '<b>20</b><span>정류장</span>');
    const t2 = h(el, 'tile', { left: '470px', top: '380px', width: '300px', height: '260px' }, '<b>24</b><span>버스 노선</span>');
    s.rise(t1, 300); s.rise(t2, 420); s.count(t1.querySelector('b'), 20, 400); s.count(t2.querySelector('b'), 24, 520);
    const c = s.chip('버스 위치는 10~20초마다 새로', 140, 700, null, 1100);
    c.insertAdjacentHTML('afterbegin', '<span style="font-size:36px">⟳</span>');
    s.phone(SCR('B5-map-bus'), 880, 260, 340, 600);
    s.nuti('bus-waiting', 1300, 360, 600, 500);
    return s;
  },
  // 30+ 함께하기: 택시비 3,300 → 2,500과 하이파이브 누티
  together(root) {
    const s = scene(root), el = s.el;
    s.head('함께하기', '택시비 N빵, <em>밥친구</em>까지');
    const t = h(el, 'tile', { left: '140px', top: '380px', width: '520px', height: '330px' }, '<span>택시 9,800원 · 1인</span><b style="font-size:120px">3,300원</b><span class="ppl">3명</span>');
    s.rise(t, 250);
    const b = t.querySelector('b'), ppl = t.querySelector('.ppl');
    s.count(b, 2500, 1900, 900, v => Math.round(v).toLocaleString('ko-KR') + '원', 3300);
    ppl.textContent = '3명 → 4명';
    s.phone(SCR('C3-moa-joined'), 720, 270, 320, 700);
    s.phone(SCR('C8-match-result'), 1060, 300, 300, 1100, 'right');
    s.nuti('together-taxi', 1390, 380, 560, 600);
    return s;
  },
  // 37+ AI 질문: 화면 뒤의 AI
  'ai-reveal'(root) {
    const s = scene(root), el = s.el;
    ['A1-home', 'B2-building', 'C5-nuti'].forEach((n, i) => { const p = s.phone(SCR(n), 160 + i * 270, 300, 240, 100 + i * 150); p.style.rotate = `${(i - 1) * 4}deg`; });
    s.rise(h(el, 'title', { left: '1000px', top: '330px', fontSize: '84px', whiteSpace: 'normal', width: '820px' }, '이 화면들 뒤에서,<br><em>AI</em>는 무엇을 했을까요?'), 700);
    s.nuti('ai-curious', 1180, 560, 460, 1200);
    return s;
  },
  // 43+ AI 카드뉴스 검사: 실제 카드뉴스와 기준 · 567 / 0
  'ai-cards'(root) {
    const s = scene(root), el = s.el;
    s.head('검사', '그리고, 다시 읽고, <em>대조합니다</em>');
    for (let i = 0; i < 5; i++) {
      const c = img(el, `media/news/0${i}.jpg`, 'cardnews', { left: px(140 + i * 150), top: px(360 + Math.abs(i - 2) * 24), width: '230px', height: '288px', rotate: `${(i - 2) * 6}deg` });
      s.pop(c, 200 + i * 120, { s: .8 });
    }
    const g1 = s.chip('문구 85%', 160, 720, null, 1000), g2 = s.chip('가격 100%', 420, 720, null, 1150);
    g2.querySelector('.dot').style.background = '#22C55E';
    const t1 = h(el, 'tile', { left: '960px', top: '360px', width: '300px', height: '260px' }, '<b>567</b><span>장 검사</span>');
    const t2 = h(el, 'tile', { left: '960px', top: '650px', width: '300px', height: '260px' }, '<b style="color:#22C55E">0</b><span>다시 만들 장</span>');
    s.rise(t1, 1400); s.rise(t2, 1600); s.count(t1.querySelector('b'), 567, 1500, 1100);
    s.nuti('ai-painter', 1320, 330, 640, 500);
    return s;
  },
  // 44+ 누티 RAG: 484개 중 6곳 → 로컬 LLM(Ollama) → 답 + 근거 3곳
  'nuti-rag'(root) {
    const s = scene(root), el = s.el;
    s.head('AI 활용', '먼저 찾고, <em>그다음 말합니다</em>');
    s.pop(h(el, 'bubble', { left: '140px', top: '330px', fontSize: '40px' }, '밥 어디서 먹지?'), 200);
    const d = h(el, 'dots', { left: '150px', top: '500px', gridTemplateColumns: 'repeat(22, 14px)' });
    const hits = new Set([17, 58, 93, 141, 187, 230]);
    for (let i = 0; i < 484; i++) { const x = document.createElement('i'); if (hits.has(i)) x.className = 'hit'; d.appendChild(x); }
    s.fade(d, 500, 700);
    s.fade(h(el, 'lab', { left: '150px', top: '1000px' }, '484개 자료 → 6곳만'), 900);
    s.chip('질문이 밖으로 나가지 않습니다 · Ollama 로컬 LLM', 620, 520, 'ollama', 1200);
    ['근거 1', '근거 2', '근거 3'].forEach((t, i) => s.chip(t, 620 + i * 190, 640, null, 1600 + i * 120));
    s.phone(SCR('C5-nuti'), 1390, 250, 280, 900, 'right');
    s.nuti('rag-books', 1560, 640, 380, 700);
    return s;
  },
  // 47+ 자동 테스트 → GitHub Pages → 공개 사이트 확인
  ci(root) {
    const s = scene(root), el = s.el;
    s.head('품질', '통과해야만 <em>배포</em>됩니다', '11월 18일부터 코드를 올릴 때마다');
    const d = h(el, 'dots', { left: '150px', top: '460px', gridTemplateColumns: 'repeat(10, 22px)', gap: '14px' });
    for (let i = 0; i < 60; i++) { const x = document.createElement('i'); x.style.width = x.style.height = '22px'; x.style.background = '#22C55E'; d.appendChild(x); }
    s.fade(d, 300, 600);
    s.fade(h(el, 'lab', { left: '150px', top: '700px' }, '자동 테스트 모두 통과'), 800);
    s.chip('GitHub Pages', 520, 560, 'github', 1100);
    const br = h(el, 'browser', { left: '900px', top: '330px', width: '560px' }, '<div class="top"><i></i><i></i><i></i></div>');
    img(br, SCR('90-desktop-home'));
    s.rise(br, 1400);
    s.pop(h(el, 'check', { left: '1420px', top: '300px' }, '✓'), 2000);
    s.nuti('ci-checklist', 1500, 470, 520, 600);
    return s;
  },
  // 50+ 학생 제보 → GitHub 이슈 → 팀 확인 → 카드뉴스
  report(root) {
    const s = scene(root), el = s.el;
    s.head('다음', '학생 제보로 <em>계속 쌓이게</em>');
    s.phone(SCR('43-tip'), 140, 300, 280, 200);
    const steps = [['꿀팁 제보', null], ['GitHub 이슈', 'github'], ['팀 확인', null], ['카드뉴스', null]];
    steps.forEach(([t, lg], i) => {
      s.chip(t, 500 + i * 250 - (i ? 0 : 0), 420 + (i % 2) * 90, lg, 500 + i * 300);
    });
    for (let i = 0; i < 6; i++) {
      const c = img(el, `media/news/t${String(i * 49).padStart(3, '0')}.jpg`, 'cardnews', { left: px(560 + i * 70), top: px(640 - i * 8), width: '170px', height: '212px', rotate: `${(i - 3) * 3}deg` });
      s.pop(c, 1700 + i * 160, { s: .7 });
    }
    s.nuti('report-mail', 1450, 380, 560, 400);
    return s;
  },
  // 52+ 마무리: 로고와 한 줄, 축하하는 누티
  finale(root) {
    const s = scene(root), el = s.el;
    s.pop(img(el, LOGO('logo'), '', { position: 'absolute', left: '810px', top: '140px', height: '300px' }), 0);
    s.rise(h(el, 'title', { left: '0', right: '0', top: '470px', textAlign: 'center', fontSize: '140px' }, 'KNUTIPS'), 300);
    s.rise(h(el, 'sub', { left: '0', right: '0', top: '660px', textAlign: 'center', fontSize: '46px', color: '#0F1419', fontWeight: '800' }, '따로 찾지 마세요. <span style="color:#3566D4">넘기면 교통대가 보입니다</span>'), 700);
    for (let i = 0; i < 6; i++) {
      const left = i < 3;
      const c = img(el, `media/news/t${String(i * 77 + 14).padStart(3, '0')}.jpg`, 'cardnews', { left: px(left ? 120 + i * 110 : 1420 + (i - 3) * 110), top: px(760 + (i % 3) * 30), width: '150px', height: '188px', rotate: `${(i - 2.5) * 6}deg` });
      s.pop(c, 900 + i * 110, { s: .6 });
    }
    s.nuti('nuti-cheer', 1460, 260, 440, 500);
    s.nuti('nuti-hello', 160, 250, 440, 700);
    return s;
  },
};
