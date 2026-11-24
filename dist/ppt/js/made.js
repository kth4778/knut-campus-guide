// 53장 전부를 실제 자료로 다시 짠 장면(키 = 원래 슬라이드 번호, 모션 장은 이름).
// 실제 앱 화면 · 팀이 찍은 사진 · 학교 공식 페이지 캡처 · 실제 카드뉴스 · 실제 로고 · 실제 테스트 이름만 쓴다.
// 숫자·문구는 발표 대본(data/deck-order.json)에 있는 검증된 값만.
import { scene, h, img } from './motion.js';
import { px, LOGO, brand, zoom, jobs, SCR, OFF, CARD, PHOTO, REAL, title, tape, note, noteIn, memo, photo, phone, clip, ring, under, arrow, swipe, num, device, ticker, divider, MARK, PICK_TESTS, FAIL_AT } from './hand.js?v=1795494651';

// 영상 속 폰이 화면 높이를 거의 채우게(원래의 약 1.26배)
const ST = [987, 3, 907, 1134];
const STAGE = { 1: ST, 14: ST };
const RC = n => `media/real/cards/${n}`;

// 폰 영상 장: 왼쪽 글 + 오른쪽 실제 화면 영상
function clipSlide(s, name, kicker, html, sub, lines = 1, n) {
  title(s, 150, 190, kicker, html, sub, { size: 88, lines });
  const [x, y, w, hh] = STAGE[n] || ST;
  clip(s, name, x, y, w, hh);
  return 190 + 46 + 88 * 1.18 * lines + 18 + 60;   // 아래 여백 시작 y
}
function sheet(s, x, y, w, cols, rows, at = 400) {
  const d = h(s.el, 'hm-sheet', { left: px(x), top: px(y), width: px(w) });
  d.innerHTML = `<table><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;
  s.rise(d, at);
  d.querySelectorAll('tr').forEach((tr, i) => i && s.custom(tr, [{ opacity: 0 }, { opacity: 1 }], at + 200 + i * 90, 300));
  return d;
}
const won = v => v ? v.toLocaleString('ko-KR') + '원' : '-';
const R0 = REAL.rows[0];
// 폰을 화면 높이(px)로 지정: 백문이불여일견 — 실제 화면이 장의 주인공
const P = (s, n, x, y, hh, rot = 0, at = 300, o = {}) => phone(s, SCR(n), x, y, (hh - 20) / 2.164, { rot, at, k: 1, ...o });

export const MADE = {
  // ---------- 표지 ----------
  1(root) {
    const s = scene(root), el = s.el;
    s.rise(h(el, 'hm-kicker', { left: '150px', top: '170px' }, '도메인 특화 AI 데이터 스토리텔링'), 0);
    s.pop(brand(el, 150, 262, 140), 100);
    s.rise(h(el, 'hm-sub', { left: '156px', top: '450px', fontSize: '44px', color: '#1E2430', fontWeight: '700' }, '교통대 생활 정보, <em>인스타처럼</em> 넘겨 보는 앱'), 320);
    photo(s, PHOTO('library-w20'), 150, 580, 400, 270, { rot: -4, cap: '도서관', at: 500 });
    photo(s, PHOTO('cafeteria'), 600, 610, 380, 250, { rot: 3, cap: '학생식당', at: 650 });
    s.rise(h(el, 'hm-sub', { left: '156px', top: '985px', fontSize: '26px' }, '서론 김태현 · 시연 고다은 · 결론 김준석'), 800);
    clip(s, 'home-intro', ...STAGE[1]);
    return s;
  },
  // ---------- 목차 ----------
  2(root) {
    const s = scene(root), el = s.el;
    title(s, 150, 120, null, '목차', null, { size: 96 });
    const L = [['01', '문제', '「그거 어디서 봐?」'], ['02', '데이터', '484개를 모은 방법'], ['03', '해결', '피드 · 지도 · 함께하기'], ['04', 'AI 활용', '카드뉴스 · 누티 · 자동 테스트'], ['05', '마무리', '남은 숙제와 다음 걸음']];
    L.forEach(([n, t, d], i) => {
      const y = 300 + i * 138;
      const r = h(el, '', { position: 'absolute', left: '150px', top: px(y), display: 'flex', alignItems: 'baseline', gap: '36px', whiteSpace: 'nowrap' }, `<b style="font-size:64px;font-weight:900;letter-spacing:-.04em;width:110px">${n}</b><span style="font-size:60px;font-weight:800;letter-spacing:-.04em">${t}</span><span style="font-size:28px;font-weight:600;color:#6B7280">${d}</span>`);
      s.custom(r, [{ opacity: 0, transform: 'translateX(-30px)' }, { opacity: 1, transform: 'none' }], 250 + i * 150, 550);
      h(el, '', { position: 'absolute', left: '150px', top: px(y + 104), width: '700px', borderTop: '1px dashed #C9CED6' });
    });
    P(s, 'A6-search-grid', 960, 190, 760, -4, 500);
    P(s, 'B3-building-3d', 1250, 210, 760, 2, 700);
    P(s, 'C8-match-result', 1540, 190, 760, 4, 900);
    return s;
  },
  // ---------- 장 구분 ----------
  3(root) { const s = scene(root); divider(s, '01', '문제', '「그거 어디서 봐?」', [['photo', PHOTO('cafeteria'), 880, 100, 780, 520, -3, '학생식당'], ['photo', PHOTO('lecture-w5'), 1280, 560, 560, 360, 4, '강의동']]); return s; },
  9(root) { const s = scene(root); divider(s, '02', '데이터', '공개 자료 · 수업 표준화 데이터 · 제보', [['photo', OFF(3), 840, 100, 820, 525, -3, '학교 공식 홈페이지'], ['photo', RC('P091-1.webp'), 1440, 430, 380, 475, 5, '실제 카드뉴스']]); return s; },
  15(root) { const s = scene(root); divider(s, '03', '해결', '피드 · 지도 · 함께하기', [['phone', SCR('A2-home-swipe'), 860, 90, 860, -5], ['phone', SCR('B1-map'), 1160, 110, 860, 2], ['phone', SCR('C1-moa'), 1460, 90, 860, 5]]); return s; },
  38(root) { const s = scene(root); divider(s, '04', 'AI 활용', '카드뉴스 · 누티 · 자동 테스트', [['photo', RC('P089-1.webp'), 860, 170, 440, 550, -5, 'gpt-image 카드뉴스'], ['phone', SCR('C5-nuti'), 1420, 70, 940, 4]]); return s; },
  48(root) { const s = scene(root); divider(s, '05', '마무리', '남은 숙제와 다음 걸음', [['photo', PHOTO('library-2f'), 880, 100, 780, 520, -3, '도서관 2층'], ['photo', PHOTO('post-office'), 1280, 560, 560, 360, 4, '우체국']]); return s; },

  // ---------- 01 문제 ----------
  4(root) {
    // 에타에 실제로 올라온 글(수집한 꿀팁 원문)로 질문을 받친다. 「몇 층」은 에타 근거가 없어 학교 캠퍼스맵 층별 안내로
    const s = scene(root), el = s.el;
    title(s, 150, 110, '기획 배경', '「그거 <em>어디서</em> 봐?」', '에타 실제 글 분석 — 질문은 결국 세 가지', { size: 96 });
    const Q = [
      ['밥 어디서<br>먹지?', '에타 배달 맛집 글', '"꼬끼오랑 도란도락 말고 또 있을까요?"', 'everytime', -4],
      ['버스<br>언제 와?', '에타 꿀팁 글', '"999번 시간이 헷갈린다면 에브리타임에 999만 치면 시간표가 나오니 기억해둘것"', 'everytime', 3],
      ['이 과는<br>몇 층이지?', '학교 캠퍼스맵', '층별 안내는 학교 홈페이지 캠퍼스맵에 따로 — 대학본부만 8개 층 19곳', 'emblem', -2],
    ];
    Q.forEach(([q, src, quote, logo, r], i) => {
      const x = 150 + i * 560;
      memo(s, x, 380, 300, q, { rot: r, at: 300 + i * 250, pin: true, size: 46, mh: 250 });
      const n = note(s, x + 20, 690, 470, `<span style="font-size:26px;line-height:1.5">${quote}</span>`, { rot: -r / 2, at: 600 + i * 250, src, logo });
      n.style.minHeight = '210px'; n.style.display = 'flex'; n.style.flexDirection = 'column'; n.style.justifyContent = 'space-between';
    });
    return s;
  },
  // 5는 아래(공식 페이지 65장 캡처)
  6(root) {
    const s = scene(root), el = s.el;
    title(s, 150, 130, '흩어진 정보 ②', '대학본부 한 건물에 <em>8개 층 · 19곳</em>', '어느 층에 무엇이 있는지 한눈에 파악 어려움', { size: 76 });
    photo(s, 'media/rich/floors.webp', 110, 360, 660, 440, { rot: -3, cap: '「교무과는 몇 층이지?」', at: 300 });
    // 학교 캠퍼스맵 층별 안내(앱 데이터, 2026-11-18 수집) — 8개 층 합계 19곳
    const F = REAL.hq_floors;
    swipe(s, 930, 545, 480, 44, 1500);
    ['8', '7', '6', '5', '4', '3', '2', '1'].forEach((f, i) => {
      const y = 380 + i * 72, six = f === '6';
      const r = h(el, '', { position: 'absolute', left: '850px', top: px(y), width: '540px', display: 'flex', gap: '20px', alignItems: 'baseline', borderBottom: '2px solid #1C2330', paddingBottom: '10px', whiteSpace: 'nowrap', zIndex: 1 }, `<b style="font-size:34px;font-weight:900;width:58px">${f}F</b><span style="font-size:${six ? 25 : 22}px;font-weight:${six ? 800 : 600};color:${six ? '#141A24' : '#4A5260'}">${F[f].join(' · ')}</span>`);
      s.custom(r, [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], 500 + (7 - i) * 110, 400);
    });
    s.rise(h(el, 'hm-label', { left: '850px', top: '965px', fontSize: '20px' }, '출처: 학교 캠퍼스맵 층별 안내'), 1600);
    P(s, 'B4-building-f6', 1430, 100, 920, 3, 800);
    return s;
  },
  7(root) {
    // 구조는 인스타처럼 익숙하게, 디자인은 따로, 데이터는 여러 정보 플랫폼에서
    const s = scene(root), el = s.el;
    title(s, 150, 110, '만든 방향', '구조는 <em>인스타처럼</em>, 나머지는 우리 것으로', null, { size: 80 });
    P(s, 'A1-home', 170, 280, 760, -3, 300);
    [['동그라미 = 계정', 385], ['피드 = 카드뉴스', 640], ['아래 탭 = 홈·MOA·지도·검색·프로필', 940]].forEach(([t, y], i) => {
      arrow(s, 520, y - 10, 90, 700 + i * 200, 0);
      s.rise(h(el, 'hm-label', { left: '625px', top: px(y - 26), fontSize: '26px', color: '#141A24' }, t), 760 + i * 200);
    });
    [['구조', '인스타 그대로 — 새로 배울 것 없이 넘기고, 누르고, 검색', null],
     ['디자인', 'K 로고·빨강·카드뉴스는 인스타와 따로 직접 디자인', 'logo'],
     ['데이터', '에브리타임 · 학교 인스타 · 학교 홈페이지 · 기존 앱(수업 표준화 데이터)에서 모음', null]].forEach(([k, v, lg], i) => {
      const n = note(s, 1100, 260 + i * 255, 680, `<b style="font-size:38px">${k}</b><div style="font-size:28px;margin-top:6px">${v}</div>`, { rot: [-1.5, 1, -1][i], at: 900 + i * 250 });
      if (lg) { const b = brand(n, 0, 0, 44, { position: 'relative', left: null, top: null, display: 'block', marginBottom: '10px' }); n.prepend(b); }
      if (i === 2) { const row = h(n, '', { display: 'flex', gap: '14px', marginTop: '12px' }); ['everytime', 'instagram', 'emblem'].forEach(l => img(row, LOGO(l), '', { height: '40px' })); }
    });
    return s;
  },
  8(root) {
    const s = scene(root), el = s.el;
    const bits = [['p', OFF(10), 40, 50, 460, 290, -6], ['c', CARD(4), 580, 30, 220, 275, 5], ['p', OFF(22), 1360, 40, 500, 310, 4], ['c', CARD(9), 1010, 40, 220, 275, -5], ['ph', 'A6-search-grid', 1640, 380, 0, 0, -6], ['c', CARD(17), 1150, 730, 230, 290, -4], ['p', OFF(40), 40, 700, 480, 300, 5], ['p', PHOTO('copy-room'), 600, 740, 420, 280, -3], ['c', CARD(30), 1450, 740, 230, 290, 6], ['ph', 'B5-map-bus', 60, 360, 0, 0, 5]];
    bits.forEach(([k, src, x, y, w, hh, r], i) => {
      if (k === 'ph') P(s, src, x, y, 520, r, 100 + i * 90);
      else photo(s, src, x, y, w, hh, { rot: r, at: 100 + i * 90, tape: i % 2 === 0 });
    });
    s.rise(h(el, 'hm-title', { left: '0', width: '1920px', textAlign: 'center', top: '390px', fontSize: '96px' }, '정보 부족이 아닌,<br><em>정보 분산</em>의 문제'), 1100);
    return s;
  },

  // ---------- 02 데이터 ----------
  14(root) {
    const s = scene(root);
    const y = clipSlide(s, 'data-to-card', '데이터 가공', '표 한 줄이<br><em>카드뉴스</em>로', '모으고, 맞추고, 그리고, 다시 읽기', 2, 14);
    const R2 = REAL.rows[2];
    const sh = sheet(s, 150, y + 10, 720, ['이름', '분류', '가격'], [[R2.name, R2.category, won(R2.price)]], 800); sh.querySelector('table').style.fontSize = '28px';
    s.rise(h(s.el, 'hm-label', { left: '150px', top: px(y + 140), fontSize: '24px' }, '표 한 줄'), 900);
    arrow(s, 320, y + 220, 230, 1300, 20);
    photo(s, RC(R2.card), 620, y + 165, 230, 288, { rot: 4, cap: '카드뉴스 한 장', at: 1600 });
    return s;
  },

  // ---------- 03 해결 ① 피드 ----------
  16(root) {
    const s = scene(root), el = s.el;
    title(s, 150, 200, '해결 ①', '피드와 <em>검색</em>', '게시물 532개, 하나의 흐름', { size: 110 });
    num(s, 150, 560, 532, { size: 240, label: '게시물 = 장소·꿀팁 484 + 제휴 48', at: 600 });
    [0, 1, 2].forEach(c => {
      const ids = Array.from({ length: 12 }, (_, i) => (i * 5 + c * 17) % 65);
      ticker(s, 800 + c * 370, 0, 350, 1080, ids, (p, i) => img(p, CARD(i), '', { display: 'block', width: '100%', borderRadius: '6px', marginBottom: '18px', boxShadow: '0 10px 20px rgba(30,35,55,.15)' }), 200 + c * 150, 30000 + c * 5000);
    });
    return s;
  },
  17(root) {
    const s = scene(root);
    const y = clipSlide(s, 'feed-swipe', '피드', '카드뉴스,<br>옆으로 <em>넘겨 보기</em>', '게시물 532개 전부 카드뉴스', 2);
    [12, 20, 33].forEach((c, i) => photo(s, CARD(c), 150 + i * 250, y, 240, 300, { rot: (i - 1) * 5, at: 800 + i * 150, tape: false }));
    arrow(s, 250, y + 360, 420, 1400, -3);
    return s;
  },
  18(root) {
    const s = scene(root);
    const y = clipSlide(s, 'photo-first', '실제 사진', '사진 다음에 <em>카드뉴스</em>', '팀이 직접 찍은 사진 14장', 1);
    photo(s, PHOTO('burrito-in'), 110, y + 30, 450, 310, { rot: -4, cap: '① 팀이 찍은 사진', at: 800 });
    arrow(s, 560, y + 160, 110, 1200, 0);
    photo(s, RC('P035-1.webp'), 680, y - 30, 300, 375, { rot: 4, cap: '② 카드뉴스', at: 1300 });
    return s;
  },
  19(root) {
    const s = scene(root), el = s.el;
    const y = clipSlide(s, 'feed-order', '피드 순서', '추천 수로 짠 <em>피드</em>', '무리 사이사이에 제휴와 꿀팁', 1);
    const cut = t => t.length > 13 ? t.slice(0, 12) + '…' : t;
    [['5+', '추천 5개 이상'], ['2-4', '추천 2~4개'], ['0-1', '추천 0~1개']].forEach(([k, l], i) => {
      const g = REAL.feed[k], top = y + i * 205, bw = Math.max(18, g.count / 380 * 520), at = 700 + i * 320;
      s.rise(h(el, 'hm-label', { left: '150px', top: px(top), fontSize: '30px', color: '#141A24' }, `<b>${i + 1}. ${l}</b>`), at);
      const bar = h(el, '', { position: 'absolute', left: '150px', top: px(top + 52), width: px(bw), height: '46px', borderRadius: '6px', background: i ? '#B9C0CA' : '#8b1a1f', transformOrigin: 'left center' });
      s.custom(bar, [{ transform: 'scaleX(0)' }, { transform: 'none' }], at + 100, 800, 'cubic-bezier(.2,.8,.2,1)');
      const n = h(el, '', { position: 'absolute', left: px(170 + bw), top: px(top + 44), fontSize: '50px', fontWeight: '900', letterSpacing: '-.03em' }, g.count + '<small style="font-size:26px;margin-left:4px">곳</small>');
      s.rise(n, at + 500);
      s.fade(h(el, '', { position: 'absolute', left: '150px', top: px(top + 112), fontSize: '23px', fontWeight: '600', color: '#4A5260', whiteSpace: 'nowrap' }, g.top.slice(0, 2).map(t => `${cut(t.name)} <b style="color:#8b1a1f">추천 ${t.rec}</b>`).join('　·　')), at + 600);
      if (i < 2) s.pop(h(el, '', { position: 'absolute', left: '560px', top: px(top + 158), fontSize: '21px', fontWeight: '800', background: '#FFE97A', padding: '4px 14px', borderRadius: '4px', rotate: '-2deg' }, '+ 제휴 · 꿀팁 끼워 넣기'), at + 800);
    });
    s.fade(h(el, '', { position: 'absolute', left: '150px', top: '1030px', fontSize: '20px', fontWeight: '700', color: '#8A93A0' }, '앱 places.json 484개 기록의 실제 추천 수'), 1800);
    return s;
  },
  20(root) {
    const s = scene(root), el = s.el;
    const y = clipSlide(s, 'search-type', '검색', '「장학금」 → <em>15건</em>', '흩어진 공지, 한 목록으로', 1);
    num(s, 150, y + 10, 15, { size: 300, at: 900, fmt: v => Math.round(v) + '건' });
    ring(s, 100, y + 10, 640, 380, 2000);
    note(s, 130, y + 400, 700, '<div style="font-size:27px;line-height:1.6"><b>학교 홈페이지</b> — 장학금 꿀팁이 <b>페이지 4개</b>에 따로<br><b style="color:#8b1a1f">KNUTIPS</b> — 검색 한 번에 <b style="background:#FFF1A8">한 목록 15건</b></div>', { rot: -1.5, at: 1400, tape: false });
    return s;
  },
  21(root) {
    const s = scene(root), el = s.el;
    const y = clipSlide(s, 'search-open', '검색', '서버 없이 <em>바로</em>', '자료 파일 하나 → 브라우저 안에서 바로 검색', 1);
    const R = REAL.record, q = v => `<span class="v">${typeof v === 'string' ? '"' + v + '"' : v}</span>`;
    const code = h(el, 'hm-code', { left: '130px', top: px(y + 40), rotate: '-1deg' },
      `<span class="c">// places.json · ${REAL.placesKB}KB · 484개 중 하나</span>\n{\n` +
      [['id', R.id], ['name', R.name], ['category', R.category], ['rec', R.rec], ['minPrice', R.minPrice]].map(([k, v]) => `  <span class="k">"${k}"</span>: ${q(v)},`).join('\n') +
      `\n  <span class="k">"hours"</span>: [{ ${q('start')}: ${q(R.hours[0].start)}, ${q('end')}: ${q(R.hours[0].end)} … }],\n  <span class="k">"checked"</span>: ${q(R.checked)},\n  <span class="c">…</span>\n}`);
    tape(code, 260, -18, 140, -3);
    s.custom(code, [{ opacity: 0, transform: 'translateY(30px) rotate(-1deg)' }, { opacity: 1, transform: 'rotate(-1deg)' }], 700, 700);
    code.querySelectorAll('.k').forEach((k, i) => s.custom(k, [{ background: '#FFF1A8' }, { background: 'transparent' }], 1300 + i * 120, 500));
    return s;
  },
  22(root) {
    const s = scene(root), el = s.el;
    title(s, 150, 100, '정리', '넘기고, 찾고, <em>바로 열기</em>', null, { size: 88 });
    const C = [
      [532, '개', '게시물', '= 장소·꿀팁 484 + 제휴 48', '피드에 올라오는 글 하나하나'],
      [680, '장', '카드뉴스 그림', '게시물 101개는 2~4장짜리', '글 대신 옆으로 넘겨 보는 그림'],
      [15, '건', '「장학금」 검색', '홈페이지에선 장학금 꿀팁이 페이지 4개에', '검색 한 번에 한 목록으로'],
    ];
    C.forEach(([v, u, l, eq, mean], i) => {
      const n = note(s, 120 + i * 580, 290, 530, `<div style="font-size:30px;font-weight:800;color:#4A5260">${l}</div><div style="display:flex;align-items:baseline;gap:8px"><b class="n" style="font-size:130px;font-weight:900;letter-spacing:-.05em;line-height:1.05"></b><span style="font-size:46px;font-weight:900">${u}</span></div><div style="font-size:25px;font-weight:700;margin-top:6px">${eq}</div><div style="font-size:27px;font-weight:800;margin-top:14px;color:#8b1a1f">→ ${mean}</div>`, { rot: [-1.5, 1, -1][i], at: 300 + i * 300 });
      n.style.minHeight = '330px';
      s.count(n.querySelector('.n'), v, 400 + i * 300, 1000);
    });
    const row = h(el, '', { position: 'absolute', left: '0', top: '720px', display: 'flex', gap: '18px', width: 'max-content' });
    for (let k = 0; k < 2; k++) for (let i = 0; i < 24; i++) img(row, CARD((i * 3) % 65), '', { width: '230px', height: '288px', objectFit: 'cover', borderRadius: '6px', boxShadow: '0 10px 20px rgba(30,35,55,.14)' });
    s.fade(row, 1300, 600);
    s.custom(row, [{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }], 1300, 60000, 'linear');
    return s;
  },

  // ---------- 해결 ② 지도 ----------
  23(root) {
    const s = scene(root);
    title(s, 150, 320, '해결 ②', '지도와 <em>건물</em>', '몇 층인지, 정류장이 어디인지', { size: 110 });
    P(s, 'B1-map', 800, 90, 900, -5, 300);
    device(s, 'hold-left-flip', 1250, 60, 700, SCR('B3-building-3d'), 500);
    return s;
  },
  24(root) {
    const s = scene(root);
    const y = clipSlide(s, 'map-tap', '지도', '교내 건물 <em>34동</em>이<br>지도 위에', '이름표 선택 → 그 건물 화면', 2);
    memo(s, 150, y + 30, 420, '이름표 누르면<br>→ 건물 화면', { rot: -3, at: 900, size: 44, pin: true, mh: 250 });
    return s;
  },
  25(root) {
    const s = scene(root);
    const y = clipSlide(s, 'building-photo', '건물', '팀이 찍은 <em>건물 사진</em>', '대학본부 · 지상 8층 · 학교 안내 19곳', 1);
    photo(s, PHOTO('hq-entrance'), 110, y + 10, 720, 470, { rot: -3, cap: '대학본부 (팀 촬영)', at: 800 });
    return s;
  },
  26(root) {
    const s = scene(root);
    const y = clipSlide(s, 'building-floor', '3D 층', '<em>6층</em> 선택', '그 층 부서 다섯 곳 표시', 1);
    memo(s, 130, y + 10, 460, '6층<br><span style="font-size:36px;font-weight:700;line-height:1.6">교무과<br>기획과<br>총무과<br>재무과<br>동문회</span>', { rot: -3, at: 800, size: 56, pin: true });
    return s;
  },
  27(root) {
    const s = scene(root), el = s.el;
    title(s, 150, 90, '만든 방법', '외곽선 + 층별 안내 = <em>3D 층</em>', '도면 없이 공개 데이터만으로', { size: 84 });
    const b = REAL.buildings.find(x => /E8/.test(x.name)) || REAL.buildings[0];
    const card = noteIn(el, '', { abs: true, w: 520, src: 'OpenStreetMap 외곽선', logo: 'osm' });
    Object.assign(card.style, { left: '110px', top: '380px', height: '560px' });
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const nums = b.d.match(/-?[\d.]+/g).map(Number), xs = nums.filter((_, i) => i % 2 === 0), ys = nums.filter((_, i) => i % 2);
    const x0 = Math.min(...xs), y0 = Math.min(...ys), bw = Math.max(...xs) - x0, bh = Math.max(...ys) - y0;
    svg.setAttribute('viewBox', `${x0 - 4} ${y0 - 4} ${bw + 8} ${bh + 8}`);
    Object.assign(svg.style, { width: '460px', height: '430px', display: 'block' });
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', b.d); p.setAttribute('fill', '#FFE58A'); p.setAttribute('stroke', '#141A24'); p.setAttribute('stroke-width', String(Math.max(bw, bh) / 120)); p.setAttribute('stroke-linejoin', 'round'); p.setAttribute('pathLength', '100'); p.setAttribute('stroke-dasharray', '100');
    svg.appendChild(p); card.prepend(svg);
    s.custom(card, [{ opacity: 0, transform: 'translateY(30px)' }, { opacity: 1, transform: 'none' }], 300, 600);
    s.custom(p, [{ strokeDashoffset: 100, fillOpacity: 0 }, { strokeDashoffset: 0, fillOpacity: 0, offset: .7 }, { strokeDashoffset: 0, fillOpacity: 1 }], 500, 1400);
    s.pop(h(el, 'hm-num', { left: '645px', top: '580px', fontSize: '110px' }, '+'), 900);
    const fl = noteIn(el, `<div style="font-size:21px;line-height:1.75;white-space:nowrap">${['8', '7', '6', '5', '4', '3', '2', '1'].map(f => f === '6' ? `<b style="background:#FFF1A8">6F ${REAL.hq_floors[f].join(' · ')}</b>` : `<b>${f}F</b> ${REAL.hq_floors[f].join(' · ')}`).join('<br>')}</div>`, { abs: true, w: 560, src: '학교 캠퍼스맵 층별 안내', logo: 'emblem' });
    Object.assign(fl.style, { left: '730px', top: '440px' });
    s.custom(fl, [{ opacity: 0, transform: 'translateY(30px)' }, { opacity: 1, transform: 'none' }], 1000, 600);
    s.pop(h(el, 'hm-num', { left: '1320px', top: '580px', fontSize: '110px' }, '='), 1400);
    P(s, 'B4-building-f6', 1450, 120, 920, 3, 1600);
    return s;
  },
  28(root) {
    const s = scene(root);
    const y = clipSlide(s, 'bus-stops', '버스', '정류장 <em>20곳</em>', '학교 안·정문 앞 정류장 — 국토교통부 TAGO 공공데이터', 1);
    const n = note(s, 130, y + 30, 600, '<div style="font-size:24px;margin-top:10px;line-height:1.5">예) 한국교통대(정문) · (대학본부)<br>(체육관) · (스마트ICT관) …</div>', { rot: -2, at: 800, src: '공공데이터포털 · 버스 도착 정보' });
    n.prepend(img(n, LOGO('molit-h'), '', { height: '80px', display: 'block' }));
    photo(s, SCR('B5-map-bus'), 170, y + 320, 600, 220, { rot: 2, cap: '정류장 핀 · 실제 앱 지도', at: 1100, pos: 'center 45%' });
    return s;
  },
  29(root) {
    const s = scene(root), el = s.el;
    title(s, 150, 130, '실시간', '정류장 선택 →<br><em>도착 시간</em>', '버스 위치 10~20초마다 갱신', { size: 84, lines: 2 });
    num(s, 120, 560, 0, { size: 170, fmt: () => '10~20초', at: 500 });
    ring(s, 70, 510, 800, 300, 1200);
    note(s, 130, 840, 700, '<div style="font-size:27px;line-height:1.55"><b>10~20초마다</b> 버스 위치 새로 받기<br>→ 지도 속 버스 <b style="background:#FFF1A8">거의 실시간</b> 이동</div>', { rot: -1.5, at: 1500, tape: false });
    P(s, 'B6-bus-sheet', 960, 70, 940, -4, 400);
    P(s, 'B7-bus-live', 1420, 90, 940, 3, 600);
    return s;
  },

  // ---------- 해결 ③ 함께하기 ----------
  30(root) {
    const s = scene(root);
    title(s, 150, 260, '해결 ③', '함께<em>하기</em>', 'MOA = 배달·택시 같이 · 누티 = AI 챗봇 밥친구', { size: 110 });
    P(s, 'C1-moa', 960, 70, 940, -5, 300);
    P(s, 'C8-match-result', 1420, 90, 940, 4, 500);
    memo(s, 150, 640, 300, '택시비<br>N빵', { rot: -6, at: 900, size: 48, mh: 230 });
    memo(s, 500, 690, 300, '밥친구', { rot: 5, at: 1100, size: 48, mh: 200 });
    return s;
  },
  31(root) {
    const s = scene(root);
    const y = clipSlide(s, 'moa-list', 'MOA · 배달·택시 같이하기', '같이 탈 사람 <em>모으기</em>', '정문 → 충주터미널 택시, 지금 3명', 1);
    num(s, 130, y + 10, 3300, { size: 190, label: '1인 금액 = 택시비 9,800원 ÷ 3명 (100원 단위 올림)', at: 900, fmt: v => Math.round(v).toLocaleString('ko-KR') + '원' });
    ring(s, 70, y - 20, 820, 240, 2000);
    note(s, 130, y + 330, 680, '<div style="font-size:30px;line-height:1.6">혼자 <b>9,800원</b> → 셋이 <b style="background:#FFF1A8">1인 3,300원</b><br>1인당 6,500원 절약</div>', { rot: -1.5, at: 1600, tape: false });
    return s;
  },
  32(root) {
    const s = scene(root);
    const y = clipSlide(s, 'moa-join', 'MOA · N빵 자동 계산', '3명 3,300원 →<br>4명 <em>2,500원</em>', '참여 즉시 1인 금액 재계산', 2);
    zoom(s, SCR('C1-moa'), 1170, [36, 1500, 1098, 255], 130, y + 40, 720, { rot: -1.5, at: 800, cap: '참여 전 · 3명 → 1인 3,300원' });
    arrow(s, 430, y + 255, 70, 1300, 90);
    zoom(s, SCR('C3-moa-joined'), 1170, [36, 1500, 1098, 255], 130, y + 340, 720, { rot: 1, at: 1500, cap: '내가 참여 · 4명 → 1인 2,500원' });
    return s;
  },
  33(root) {
    const s = scene(root);
    const y = clipSlide(s, 'moa-chat', 'MOA · 참여자 채팅', '참여자 전용<br><em>채팅방</em>', '만날 곳·시간 정하기', 2);
    zoom(s, SCR('C4w-moa-chat'), 390, [8, 52, 374, 262], 130, y + 40, 640, { rot: -1.5, at: 800, cap: '참여자 4명만 보는 방 · 실제 화면' });
    return s;
  },
  34(root) {
    const s = scene(root);
    const y = clipSlide(s, 'nuti-match', '누티 · AI 챗봇 밥친구 찾기', '혼밥 친구 <em>찾기</em>', '요일 · 시간 · 메뉴 · 장소, 네 가지 선택', 1);
    zoom(s, SCR('C6-match-form'), 1170, [45, 450, 1095, 840], 130, y + 40, 640, { rot: -1.5, at: 800, cap: '요일 · 시간 · 메뉴 · 장소 고르기' });
    return s;
  },
  35(root) {
    const s = scene(root);
    const y = clipSlide(s, 'match-result', '누티 · 밥친구 매칭', '잘 맞는 학우와<br><em>그 이유</em>', '공개 사이트에서는 예시 학우로 시연', 2);
    zoom(s, SCR('C8-match-result'), 1170, [36, 165, 1098, 660], 130, y + 40, 640, { rot: 1.5, at: 800, cap: '「나와 같은 점」이 이유 · 실제 화면' });
    return s;
  },
  36(root) {
    const s = scene(root);
    title(s, 150, 130, '정리', '혼자보다 <em>같이</em>', '실제 학우끼리 매칭은 Firebase로', { size: 100 });
    P(s, 'C3-moa-joined', 960, 70, 940, -4, 300);
    P(s, 'C8-match-result', 1420, 90, 940, 4, 500);
    note(s, 120, 520, 640, '<b style="font-size:42px">MOA · 택시 N빵</b><br><span style="font-size:32px">3명 3,300원 → 4명 2,500원</span>', { rot: -2, at: 800 });
    note(s, 170, 770, 640, '<b style="font-size:42px">누티 · 밥친구</b><br><span style="font-size:32px">잘 맞는 학우와 그 이유</span>', { rot: 2, at: 1000 });
    return s;
  },
  37(root) {
    const s = scene(root);
    [['A3-place-photo', -4], ['B2-building', 2], ['C6-match-form', 5]].forEach(([n, r], i) => P(s, n, 860 + i * 300, 110 + (i % 2) * 30, 860, r, 100 + i * 150));
    title(s, 150, 360, null, '이 화면들 뒤에서,<br>AI는 <em>무엇을</em><br>했을까요?', null, { size: 76 });
    return s;
  },

  // ---------- 04 AI 활용 ----------
  39(root) {
    const s = scene(root);
    title(s, 150, 110, 'AI 활용 ①', '<em>AI</em>로 그린 카드뉴스', '원본 데이터 한 줄 → gpt-image', { size: 84 });
    const R = REAL.rows[1];
    const sh = sheet(s, 110, 470, 640, ['이름', '분류', '지역'], [[R.name, R.category, R.area]], 300); sh.style.fontSize = '30px'; sh.querySelector('table').style.fontSize = '30px';
    s.rise(h(s.el, 'hm-sub', { left: '110px', top: '620px', fontSize: '28px' }, '원본 데이터 한 줄'), 400);
    arrow(s, 700, 690, 160, 900, -10);
    [['P089-1.webp', -6], ['P004-1.webp', 3], ['P245-1.webp', -2], ['P019-1.webp', 6]].forEach(([c, r], i) => photo(s, RC(c), 880 + i * 220, 300 + (i % 2) * 80, 340, 425, { rot: r, at: 1100 + i * 150, tape: i === 0 }));
    return s;
  },
  40(root) {
    const s = scene(root);
    title(s, 150, 110, '문제', 'AI 그림 속 <em>숫자 오류</em>', '가격이 틀린 카드뉴스 = 없느니만 못함', { size: 80 });
    const R2 = REAL.rows[2];
    photo(s, RC(R2.card), 1200, 170, 560, 700, { rot: 2, cap: '카드 속 가격', at: 300 });
    ring(s, 1230, 742, 470, 105, 1700, -1);
    const sh = sheet(s, 150, 430, 640, ['이름', '가격'], [[R2.name, won(R2.price)]], 500); sh.querySelector('table').style.fontSize = '30px';
    memo(s, 220, 640, 380, '카드 속 가격 =<br>원본 가격?', { rot: -4, at: 1000, size: 46, pin: true, mh: 260 });
    arrow(s, 700, 790, 470, 1400, -8);
    return s;
  },
  41(root) {
    const s = scene(root);
    title(s, 150, 90, '검사', '그리기 → 다시 읽기 → <em>대조</em>', 'gpt-image로 그린 카드를 OCR로 읽어 원본과 비교', { size: 80 });
    const R2 = REAL.rows[2];
    const st = [['원본 데이터', `${R2.name}<br>가격 ${won(R2.price)}`], ['gpt-image 생성', `<img src="${RC(R2.card)}" style="width:100%;border-radius:4px">`], ['OCR로 읽기', '카드 속 글자를 다시 글로<div style="margin-top:14px;padding:12px 14px;background:#F3F4F7;border-radius:4px;font-size:26px">「12시 10분부터<br>1인 5,500원」</div>'], ['원본과 대조', `${MARK(true)}가격 5,500원<br>= 원본 5,500원`]];
    st.forEach(([a, b], i) => {
      note(s, 90 + i * 450, 360, 390, `<b style="font-size:36px">${a}</b><div style="margin-top:10px;font-size:30px">${b}</div>`, { rot: [-2, 2, -1, 2][i], at: 400 + i * 300 });
      if (i < 3) arrow(s, 485 + i * 450, 520, 50, 600 + i * 300, 0);
    });
    s.rise(h(s.el, 'hm-sub', { left: '150px', top: '960px', fontSize: '40px', color: '#C2412D', fontWeight: '800' }, '↺ 틀리면 다시 생성'), 1700);
    const okst = h(s.el, 'hm-stamp', { left: '1480px', top: '880px', color: '#1F9D55', fontSize: '64px' }, '일치');
    s.custom(okst, [{ opacity: 0, transform: 'scale(2)' }, { opacity: .88, transform: 'none' }], 1900, 350, 'cubic-bezier(.3,1.4,.5,1)');
    return s;
  },
  42(root) {
    const s = scene(root);
    title(s, 150, 130, '기준', '문구 85% · 가격 <em>100%</em>', '숫자는 하나라도 틀리면 재생성', { size: 88 });
    num(s, 200, 420, 85, { size: 300, fmt: v => Math.round(v) + '%', label: '문구', at: 400 });
    num(s, 1000, 420, 100, { size: 300, fmt: v => Math.round(v) + '%', label: '가격', at: 700 });
    ring(s, 930, 380, 780, 340, 1700);
    s.rise(h(s.el, 'hm-label', { left: '206px', top: '800px', width: '640px', fontSize: '28px', fontWeight: '700', color: '#4A5260', whiteSpace: 'normal', lineHeight: '1.5' }, '카드에서 읽은 글이 원본 글과<br><b style="color:#141A24">85% 이상 같으면</b> 통과'), 1000);
    s.rise(h(s.el, 'hm-label', { left: '1006px', top: '800px', width: '760px', fontSize: '28px', fontWeight: '700', color: '#4A5260', whiteSpace: 'normal', lineHeight: '1.5' }, '카드 속 가격이 원본 가격과<br><b style="color:#C2412D">한 글자라도 다르면</b> 다시 그림'), 1300);
    return s;
  },
  43(root) {
    const s = scene(root), el = s.el;
    title(s, 150, 100, '결과', 'AI 카드뉴스 <em>567장</em>,<br>한 장씩 OCR 재검사', null, { size: 72, lines: 2 });
    const row = (y, v, u, what, mean, at) => {
      const r = h(el, '', { position: 'absolute', left: '150px', top: px(y), whiteSpace: 'nowrap' }, `<div style="display:flex;align-items:baseline;gap:10px"><b class="n" style="font-size:120px;font-weight:900;letter-spacing:-.05em;line-height:1"></b><span style="font-size:44px;font-weight:900">${u}</span><span style="font-size:30px;font-weight:800;margin-left:10px">${what}</span></div><div style="font-size:26px;font-weight:700;color:#4A5260;margin-top:8px">${mean}</div>`);
      s.rise(r, at); s.count(r.querySelector('.n'), v, at, 1000, v ? undefined : () => '0');
    };
    row(370, 567, '장', '검사', '새로 그린 카드뉴스 전부 — OCR로 글자를 읽어 원본 데이터와 비교', 400);
    row(590, 0, '장', '다시 그릴 카드', '원본과 다른 글자·가격이 나온 카드 없음', 900);
    const st = h(el, 'hm-stamp', { left: '150px', top: '820px', color: '#1F9D55', fontSize: '58px' }, '가격 오류 0');
    s.custom(st, [{ opacity: 0, transform: 'scale(2)' }, { opacity: .88, transform: 'none' }], 1700, 350, 'cubic-bezier(.3,1.4,.5,1)');
    s.rise(h(el, 'hm-label', { left: '560px', top: '845px', fontSize: '28px', color: '#141A24', fontWeight: '800' }, '→ 학생에게 틀린 가격 노출 없음'), 1900);
    photo(s, 'media/rich/ocrcheck.webp', 1120, 110, 700, 467, { rot: 2, at: 300 });
    const g = h(el, '', { position: 'absolute', left: '1100px', top: '680px', width: '760px', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' });
    for (let i = 0; i < 12; i++) {
      const c = h(g, '', { position: 'relative', aspectRatio: '4 / 5', borderRadius: '4px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(30,35,55,.12)' });
      img(c, CARD(i * 5), '', { width: '100%', height: '100%', objectFit: 'cover' });
      const k = h(c, '', { position: 'absolute', right: '4px', bottom: '0', fontSize: '28px', fontWeight: '900', color: '#1F9D55', textShadow: '0 0 6px #fff, 0 0 3px #fff' }, '✓');
      s.fade(c, 700 + i * 60, 300); s.pop(k, 1200 + i * 80, { s: .3 });
    }
    s.fade(h(el, 'hm-label', { left: '1104px', top: '1035px', fontSize: '20px', color: '#6B7280' }, '실제 검사한 카드 일부'), 1400);
    return s;
  },
  44(root) {
    const s = scene(root);
    title(s, 150, 90, 'AI 활용 ② · 누티 AI 챗봇', '먼저 <em>검색</em>, 그다음 답변', null, { size: 80 });
    [['1', '질문'], ['2', '484개 자료에서 6곳 찾기'], ['3', '그 자료만 LLM에 전달'], ['4', '답 + 근거 3곳']].forEach(([n, t], i) => {
      const c = note(s, 110 + i * 25, 280 + i * 150, 720, `<b style="font-size:46px;margin-right:18px">${n}</b><span style="font-size:36px;font-weight:700">${t}</span>`, { rot: i % 2 ? 1 : -1, at: 300 + i * 260, tape: false });
      c.style.padding = '18px 26px';
    });
    s.rise(h(s.el, 'hm-sub', { left: '110px', top: '920px', fontSize: '38px', color: '#141A24', fontWeight: '800' }, '지어내지 않고,<br><em>모은 자료로만</em> 답변'), 1500);
    P(s, 'C5-nuti', 980, 110, 920, -3, 400);
    P(s, 'A4-place-card', 1440, 140, 900, 4, 700);
    return s;
  },
  45(root) {
    const s = scene(root);
    title(s, 150, 110, '로컬 LLM', '질문은<br><em>노트북 안에서만</em>', '노트북 안에서 도는 한국어 소형 모델', { size: 84, lines: 2 });
    device(s, 'hold-left-flip', 1250, 60, 700, SCR('C5-nuti'), 400);
    const n = note(s, 150, 480, 520, '<div style="display:flex;align-items:center;gap:18px"><img src="media/brand/ollama.png" style="height:120px"><div><b style="font-size:40px">Ollama</b><div style="font-size:28px;color:#4A5260">한국어 소형 모델<br>exaone3.5 2.4B</div><div style="font-size:20px;color:#6B7280;margin-top:6px">2.4B = 매개변수 24억 개,<br>노트북에서 도는 크기</div></div></div>', { rot: -2, at: 800, src: '로컬 LLM 실행 도구' });
    memo(s, 720, 520, 380, '인터넷 밖으로<br>안 나감', { rot: 3, at: 1300, size: 46, mh: 250 });
    return s;
  },
  46(root) {
    const s = scene(root), el = s.el;
    title(s, 150, 110, '품질', '테스트 통과 시에만 <em>배포</em>', '11월 18일부터 코드 올릴 때마다 자동 실행', { size: 80 });
    const box = noteIn(el, '', { abs: true, w: 660, src: '실제 자동 테스트 이름 (Playwright)', tape: true });
    Object.assign(box.style, { left: '150px', top: '400px', height: '600px', overflow: 'hidden' });
    const win = h(box, '', { position: 'relative', height: '500px', overflow: 'hidden', maskImage: 'linear-gradient(transparent, #000 8%, #000 92%, transparent)', WebkitMaskImage: 'linear-gradient(transparent, #000 8%, #000 92%, transparent)' });
    const col = h(win, '', { position: 'absolute', left: '0', top: '0', width: '100%' });
    [...REAL.tests_short, ...REAL.tests_short].forEach(t => h(col, 'hm-row', { fontSize: '28px' }, `${MARK(true)}<span>${t}</span>`));
    s.rise(box, 300);
    s.custom(col, [{ transform: 'translateY(0)' }, { transform: 'translateY(-50%)' }], 300, 90000, 'linear');
    const gl = h(el, '', { position: 'absolute', left: '880px', top: '410px', display: 'flex', gap: '12px', alignItems: 'center', fontSize: '26px', fontWeight: '800', color: '#141A24' }, `<img src="${LOGO('github')}" style="height:40px"> 실제 자동 배포 기록 #91`);
    s.rise(gl, 600);
    zoom(s, 'media/rich/gh-run.webp', 1650, [0, 0, 1650, 540], 880, 480, 960, { rot: 1, at: 700 });
    jobs(s, 870, 850, 1300, 345);
    return s;
  },
  47(root) {
    const s = scene(root), el = s.el;
    title(s, 150, 110, '품질', '하나라도 실패 → <em>배포 중지</em>', '누가 고쳐도 앱이 망가지지 않도록', { size: 80 });
    const mk = (x, bad, at) => {
      const box = noteIn(el, PICK_TESTS.map((t, i) => `<div class="hm-row" style="font-size:30px">${MARK(!(bad && i === FAIL_AT))}<span>${t}</span></div>`).join(''), { abs: true, w: 760, tape: false });
      Object.assign(box.style, { left: px(x), top: '400px' });
      s.rise(box, at);
      return box;
    };
    mk(150, true, 300);
    mk(1010, false, 900);
    const a = h(el, 'hm-stamp', { left: '400px', top: '900px', color: '#D63A2F' }, '배포 중지');
    s.custom(a, [{ opacity: 0, transform: 'scale(2)' }, { opacity: .88, transform: 'none' }], 1300, 350, 'cubic-bezier(.3,1.4,.5,1)');
    const b = h(el, 'hm-stamp', { left: '1320px', top: '900px', color: '#1F9D55' }, '배포');
    s.custom(b, [{ opacity: 0, transform: 'scale(2)' }, { opacity: .88, transform: 'none' }], 1900, 350, 'cubic-bezier(.3,1.4,.5,1)');
    return s;
  },

  // ---------- 05 마무리 ----------
  49(root) {
    const s = scene(root), el = s.el;
    title(s, 150, 110, '한계와 다음', '아직 남은 <em>숙제</em>', null, { size: 96 });
    const T = [['좋아요·댓글·MOA는 브라우저에만 저장', '서버 연결'], ['확인 날짜 없는 꿀팁 66건', '다시 확인'], ['카드 속 글자는 번역 안 됨', '유학생용 카드'], ['누티는 로컬 LLM이 켜진 컴퓨터에서만', '배포 방식 검토']];
    const box = noteIn(el, `<div style="display:grid;grid-template-columns:70px 1fr 70px 380px;align-items:center;font-size:26px;color:#6B7280;font-weight:700;padding-bottom:12px;border-bottom:2px solid #1C2330"><span></span><span>지금</span><span></span><span>다음</span></div>` + T.map(([a, b]) => `<div style="display:grid;grid-template-columns:70px 1fr 70px 380px;align-items:center;padding:34px 0;border-bottom:1px dashed #CBD0D8;font-size:40px;font-weight:700"><span style="width:36px;height:36px;border:3px solid #1C2330;border-radius:4px;display:inline-block"></span><span>${a}</span><span style="color:#9AA2AE">→</span><b>${b}</b></div>`).join(''), { abs: true, w: 1620, tape: true });
    Object.assign(box.style, { left: '150px', top: '300px' });
    s.rise(box, 300);
    box.querySelectorAll('div').forEach((r, i) => i && s.custom(r, [{ opacity: 0, transform: 'translateX(-20px)' }, { opacity: 1, transform: 'none' }], 500 + i * 220, 450));
    return s;
  },
  50(root) {
    const s = scene(root);
    title(s, 150, 110, '다음', '학생 제보로 <em>계속 쌓는 구조</em>', null, { size: 84 });
    device(s, 'hold-left', -40, 330, 520, SCR('43-tip'), 300);
    arrow(s, 490, 680, 90, 700, 0);
    const n = note(s, 600, 560, 320, '<b style="font-size:32px">GitHub 이슈</b><br>제보가 쌓이는 곳', { rot: 2, at: 900 });
    n.prepend(img(n, LOGO('github'), '', { height: '70px', display: 'block', marginBottom: '8px' }));
    arrow(s, 950, 680, 90, 1100, 0);
    note(s, 1070, 600, 280, '<b style="font-size:32px">팀 확인</b><br>사실인지 확인', { rot: -2, at: 1300 });
    arrow(s, 1370, 680, 80, 1500, 0);
    photo(s, RC('P201-1.webp'), 1470, 330, 400, 500, { rot: 4, cap: '카드뉴스', at: 1700 });
    return s;
  },
  51(root) {
    const s = scene(root);
    title(s, 150, 110, '처음 질문으로', '이제 <em>한 앱</em>에서', null, { size: 96 });
    [['밥 어디서<br>먹지?', 'A4-place-card'], ['이 과는<br>몇 층이지?', 'B4-building-f6'], ['버스<br>언제 와?', 'B7-bus-live']].forEach(([q, sc], i) => {
      const x = 80 + i * 590;
      memo(s, x, 330, 260, q, { rot: [-4, 3, -2][i], at: 300 + i * 300, size: 38, pin: true });
      P(s, sc, x + 250, 320, 700, [3, -3, 4][i], 500 + i * 300);
      const c = h(s.el, 'hm-check', { left: px(x + 150), top: px(680), fontSize: '110px' }, '✓');
      s.pop(c, 1400 + i * 250, { s: .3 });
    });
    return s;
  },
  52(root) {
    const s = scene(root), el = s.el;
    s.pop(brand(el, 156, 120, 100), 0);
    [['왜', '흩어진 학교 정보를 한곳에'], ['무엇', '장소·꿀팁 484개를 카드뉴스 · 지도 · 실시간 버스로'], ['어떻게', '공개 데이터 + AI 카드뉴스 + OCR · 자동 테스트 검증']].forEach(([k, v], i) => {
      const r = h(el, '', { position: 'absolute', left: '160px', top: px(300 + i * 120), display: 'flex', gap: '30px', alignItems: 'baseline', whiteSpace: 'nowrap', borderBottom: '1px dashed #C9CED6', paddingBottom: '20px', width: '1080px' }, `<b style="font-size:30px;width:110px;color:#6B7280">${k}</b><span style="font-size:36px;font-weight:800">${v}</span>`);
      s.custom(r, [{ opacity: 0, transform: 'translateX(-20px)' }, { opacity: 1, transform: 'none' }], 300 + i * 220, 450);
    });
    num(s, 170, 690, 484, { size: 150, label: '장소·꿀팁', at: 1000 });
    num(s, 640, 690, 567, { size: 150, label: '검사한 카드뉴스', at: 1200 });
    photo(s, 'media/brand/qr.png', 1340, 220, 480, 480, { rot: 3, cap: 'kth4778.github.io/knut-campus-guide', at: 900 });
    s.rise(h(el, 'hm-sub', { left: '160px', top: '960px', fontSize: '40px', color: '#141A24', fontWeight: '800' }, '따로 찾지 말고, <em>넘겨 보는 교통대</em>'), 1700);
    return s;
  },
  53(root) {
    const s = scene(root), el = s.el;
    s.rise(h(el, 'hm-title', { left: '150px', top: '330px', fontSize: '170px' }, '감사합니다'), 0);
    s.rise(h(el, 'hm-sub', { left: '160px', top: '560px', fontSize: '44px' }, 'Q &amp; A'), 200);
    under(s, 150, 640, 420, 700);
    photo(s, PHOTO('dorm-yeseong'), 960, 90, 600, 400, { rot: -4, at: 300 });
    photo(s, PHOTO('cafe-flore'), 1360, 330, 480, 320, { rot: 5, at: 450 });
    photo(s, RC('P040-1.webp'), 1000, 540, 320, 400, { rot: 3, at: 600 });
    s.pop(brand(el, 160, 800, 80), 900);
    return s;
  },
};
