// 데이터를 보여 주는 장(5·10·11·12·13·sources): 학교 공식 페이지 실제 캡처 65장, 에타 추천 글 문장,
// 학교 인스타 언급, 수업에서 학생들이 같은 형식으로 정리한 표준화 기록, 실제 카드뉴스, 팀이 찍은 사진, OSM 외곽선.
// 꾸밈은 hand.js(테이프 · 메모 · 형광펜 · 마커)로 — 손으로 붙여 만든 발표처럼.
import { scene, h, img } from './motion.js';
import { px, LOGO, SCR, OFF, PHOTO, REAL, title, tape, note, noteIn, memo, photo, phone, ring, under, arrow, swipe, num, device, ticker } from './hand.js?v=1795496118';

const won = v => v ? v.toLocaleString('ko-KR') + '원' : '-';
function colHead(s, x, y, logos, t, sub, at) {
  const c = h(s.el, '', { position: 'absolute', left: px(x), top: px(y), display: 'flex', alignItems: 'center', gap: '12px', whiteSpace: 'nowrap' });
  logos.forEach(l => img(c, LOGO(l), '', { height: '46px' }));
  h(c, '', { fontSize: '30px', fontWeight: '800', lineHeight: '1.15' }, `${t}<div style="font-size:19px;font-weight:600;color:#6B7280">${sub}</div>`);
  s.rise(c, at);
}
function table(s, x, y, w, rows, at) {
  const d = h(s.el, 'hm-sheet', { left: px(x), top: px(y), width: px(w) });
  d.innerHTML = `<table><tr><th>이름</th><th>분류</th><th>지역</th><th>가격</th></tr>${rows.map(r => `<tr><td>${r.name}</td><td>${r.category}</td><td>${r.area}</td><td>${won(r.price)}</td></tr>`).join('')}</table>`;
  tape(d, w / 2 - 60, -14, 120, 2);
  s.rise(d, at);
  d.querySelectorAll('tr').forEach((tr, i) => i && s.custom(tr, [{ opacity: 0, transform: 'translateX(-16px)' }, { opacity: 1, transform: 'none' }], at + 200 + i * 100, 400));
  return d;
}

export const REALSCENES = {
  // 흩어진 정보 ① — 학교 공식 꿀팁이 65개 페이지에. 주제 하나도 여러 페이지로 나뉜다(앱 데이터: 페이지 주소 ↔ 그 페이지에서 가져온 꿀팁)
  5(root) {
    const s = scene(root), el = s.el;
    title(s, 150, 80, '흩어진 정보 ①', '학교 꿀팁, <em>65개 페이지</em>에 분산', '주제 하나도 여러 페이지로 — 하나씩 열어 확인 필요', { size: 72 });
    photo(s, 'media/rich/tabs65.webp', 90, 360, 700, 350, { rot: -2, cap: '꿀팁 하나 = 열어 볼 페이지 하나', at: 300 });
    const T = [['생활관', '생활관'], ['장학금', '장학'], ['졸업', '졸업']];
    T.forEach(([name, kw], r) => {
      const pages = REAL.pageTips.filter(p => p.tips.some(t => t.includes(kw)));
      const n = pages.reduce((a, p) => a + p.tips.filter(t => t.includes(kw)).length, 0);
      const y = 320 + r * 215, at = 700 + r * 600;
      s.rise(h(el, 'hm-label', { left: '850px', top: px(y), fontSize: '32px', color: '#141A24', fontWeight: '700' }, `<b style="font-weight:900">${name}</b> 꿀팁 ${n}개 → <b style="background:#FFF1A8;padding:0 6px">페이지 ${pages.length}개</b>에 따로`), at);
      pages.slice(0, 5).forEach((p, i) => {
        const tip = p.tips.find(t => t.includes(kw)), more = p.tips.length - 1;
        const tab = h(el, 'hm-tab', { left: px(850 + i * 196), top: px(y + 58) }, `<i></i><b>${tip}${more ? ` <small>외 ${more}</small>` : ''}</b><u>${p.url.replace(/^https:\/\/(www\.)?/, '').replace(/\.do$/, '')}</u>`);
        s.custom(tab, [{ opacity: 0, transform: 'translateY(14px) scale(.9)' }, { opacity: 1, transform: 'none' }], at + 200 + i * 140, 350, 'cubic-bezier(.3,1.4,.5,1)');
      });
    });
    const tally = h(el, '', { position: 'absolute', left: '100px', top: '965px', fontSize: '24px', fontWeight: '700', color: '#4A5260', whiteSpace: 'nowrap' }, `<img src="${LOGO('emblem')}" style="height:30px;vertical-align:-7px;margin-right:8px">학교 홈페이지 www.ut.ac.kr <b>56</b> + 도서관 chains.ut.ac.kr <b>8</b> + hrc.ut.ac.kr <b>1</b> = <b style="color:#8b1a1f">65페이지</b> · 앱이 꿀팁을 가져온 실제 페이지`);
    s.fade(tally, 2600);
    return s;
  },
  // 모은 데이터 — 에타 추천 글 · 학교 공식(인스타·홈페이지) · 수업 표준화 데이터 → 한 앱
  10(root) {
    const s = scene(root), el = s.el;
    title(s, 150, 60, '모은 데이터', '흩어진 출처를 <em>한 앱</em>으로', null, { size: 76 });
    s.rise(h(el, 'hm-sub', { left: '1030px', top: '130px', fontSize: '26px' }, '크롤링 대신 공개 자료와 동의받은 제보만'), 200);
    // ① 에타 추천 글 · 댓글
    colHead(s, 70, 240, ['everytime'], '에브리타임', '추천 글 · 댓글에서 모은 꿀팁', 200);
    ticker(s, 50, 320, 470, 620, REAL.eta, (p, e) => noteIn(p, `<b>${e.name}</b><br>${e.text}`, { w: 430, rot: (e.id.charCodeAt(3) % 3) - 1, src: '에타 추천 글', logo: 'everytime', tape: true }), 500, 32000);
    // ② 학교 공식 — 홈페이지 캡처 + 인스타 언급
    colHead(s, 560, 240, ['instagram', 'emblem'], '학교 공식', '인스타 계정 · 홈페이지', 350);
    photo(s, OFF(3), 560, 320, 430, 275, { rot: -2, cap: '학교 홈페이지 실제 캡처', at: 600 });
    REAL.insta.forEach((q, i) => note(s, 565 + i * 20, 640 + i * 175, 400, `<b>${q.name}</b><br>${q.text.slice(0, 34)}${q.text.length > 34 ? '…' : ''}`, { rot: i ? 2 : -2, at: 900 + i * 200, src: '학교 공식 인스타', logo: 'instagram' }));
    // ③ 수업 표준화 데이터 — 학생들이 같은 칸으로 정리한 실제 기록
    colHead(s, 1040, 240, [], '기존 앱', '수업에서 학생들이 같은 형식으로 정리한 데이터', 500);
    table(s, 1030, 330, 540, REAL.rows.slice(0, 12), 600);
    // 나머지 출처
    const src = h(el, '', { position: 'absolute', left: '1040px', top: '950px', width: '540px', display: 'flex', flexWrap: 'wrap', gap: '6px 14px', alignItems: 'center', fontSize: '20px', fontWeight: '700', color: '#4A5260', whiteSpace: 'nowrap' }, `+ 총학생회 제휴 · <img src="${LOGO('osm')}" style="height:30px"> OpenStreetMap · 캠퍼스지도 · <img src="${LOGO('molit-emblem')}" style="height:30px"> 국토교통부 TAGO`);
    s.rise(src, 1500);
    // → 실제 앱 + 484
    phone(s, SCR('A1-home'), 1610, 400, 260, { rot: 2, at: 1900, k: 1 });
    num(s, 1615, 205, 484, { size: 120, at: 2100 });
    s.rise(h(el, 'hm-label', { left: '1620px', top: '335px', fontSize: '22px' }, '장소·꿀팁, 한 앱에'), 2300);
    return s;
  },
  // 장소·꿀팁 484 — 세 출처의 실제 기록 이름이 기록지처럼 흐른다
  11(root) {
    const s = scene(root), el = s.el;
    s.rise(h(el, 'hm-kicker', { left: '150px', top: '60px' }, '장소·꿀팁'), 0);
    num(s, 150, 130, 484, { size: 190, at: 150, dur: 1500 });
    ring(s, 90, 90, 560, 260, 1800);
    s.rise(h(el, 'hm-sub', { left: '700px', top: '200px', fontSize: '34px', color: '#1E2430', fontWeight: '700' }, '= 기존 앱 321 + 누팁스 64 + 학교 공식 99'), 600);
    const C = [['기존 앱', '수업 표준화 데이터 · 학생들이 정리', 321, REAL.names.class, []], ['누팁스', '팀 제보 · 에타 · 인스타', 64, REAL.names.knutips, ['everytime', 'instagram']], ['학교 공식', '홈페이지 65개 페이지', 99, REAL.names.official, ['emblem']]];
    C.forEach(([t, sub, v, names, lg], i) => {
      const x = 110 + i * 590;
      const head = h(el, '', { position: 'absolute', left: px(x), top: '370px', width: '540px', display: 'flex', alignItems: 'center', gap: '12px', whiteSpace: 'nowrap' });
      lg.forEach(l => img(head, LOGO(l), '', { height: '40px' }));
      h(head, '', { fontSize: '30px', fontWeight: '800' }, `${t}<div style="font-size:19px;color:#6B7280;font-weight:600">${sub}</div>`);
      s.rise(head, 300 + i * 150);
      const n = h(el, 'hm-num', { left: px(x + 400), top: '368px', fontSize: '64px' }); s.fade(n, 500 + i * 150); s.count(n, v, 500 + i * 150, 1400);
      const sheet = h(el, 'hm-sheet', { left: px(x), top: '460px', width: '540px', height: '560px' });
      tape(sheet, 210, -14, 120, i - 1);
      s.rise(sheet, 400 + i * 150);
      const win = h(sheet, 'hm-ticker', { left: '0', top: '0', width: '100%', height: '100%' });
      const col = h(win, '', { position: 'absolute', left: '0', top: '0', width: '100%', padding: '10px 22px' });
      [...names, ...names].forEach((nm, k) => h(col, 'hm-row', {}, `<i>${String((k % names.length) + 1).padStart(3, '0')}</i><span style="overflow:hidden;text-overflow:ellipsis">${nm}</span>`));
      s.custom(col, [{ transform: 'translateY(0)' }, { transform: 'translateY(-50%)' }], 600, 40000 + i * 4000, 'linear');
    });
    return s;
  },
  // 건물 37동 — OSM 실제 외곽선이 그려지고, 팀이 찍은 대학본부 사진
  12(root) {
    const s = scene(root), el = s.el;
    title(s, 150, 90, '건물', '교내 건물 <em>37동</em>', '그중 지도 핀 34동 · OpenStreetMap 외곽선 + 학교 층별 안내', { size: 84 });
    const [bw, bh] = REAL.bbox;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${bw} ${bh}`);
    Object.assign(svg.style, { position: 'absolute', left: '170px', top: '330px', width: px(bw * 1.1), height: px(bh * 1.1), overflow: 'visible' });
    REAL.buildings.forEach((b, i) => {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', b.d); p.setAttribute('fill', /E8/.test(b.name) ? '#FFD84D' : '#FFFEFA'); p.setAttribute('stroke', '#1C2330'); p.setAttribute('stroke-width', '2'); p.setAttribute('stroke-linejoin', 'round'); p.setAttribute('pathLength', '100'); p.setAttribute('stroke-dasharray', '100');
      svg.appendChild(p);
      s.custom(p, [{ strokeDashoffset: 100, fillOpacity: 0 }, { strokeDashoffset: 0, fillOpacity: 0, offset: .6 }, { strokeDashoffset: 0, fillOpacity: 1 }], 300 + i * 60, 1100);
    });
    el.appendChild(svg);
    const cap = h(el, '', { position: 'absolute', left: '170px', top: '1010px', display: 'flex', gap: '10px', alignItems: 'center', fontSize: '20px', fontWeight: '700', color: '#6B7280' }, `<img src="${LOGO('osm')}" style="height:28px"> 외곽선 © OpenStreetMap`);
    s.fade(cap, 600);
    photo(s, PHOTO('hq-entrance'), 900, 300, 640, 420, { rot: -2, cap: '대학본부(노란 칸) · 팀이 찍은 사진', at: 1200 });
    arrow(s, 650, 560, 230, 1600, -10);
    phone(s, SCR('B3-building-3d'), 1560, 380, 240, { rot: 4, at: 1800 });
    return s;
  },
  // 교통·제휴·사진 — 숫자마다 무엇을 센 것인지: 학교 앞 정류장·노선(transit.js · bus-routes.json), 총학생회 제휴(partners.json), 팀 사진
  13(root) {
    const s = scene(root), el = s.el;
    title(s, 150, 70, '교통·제휴·사진', '학교 앞 버스, 학생 할인, <em>직접 찍은 사진</em>', null, { size: 72 });
    const fact = (x, y, v, unit, what, at) => {
      const f = h(el, '', { position: 'absolute', left: px(x), top: px(y), display: 'flex', alignItems: 'baseline', gap: '14px', whiteSpace: 'nowrap' }, `<b class="n" style="font-size:84px;font-weight:900;letter-spacing:-.04em;line-height:1"></b><span style="font-size:30px;font-weight:900">${unit}</span><span style="font-size:25px;font-weight:700;color:#4A5260">${what}</span>`);
      s.rise(f, at); s.count(f.querySelector('.n'), v, at, 900);
    };
    const ex = (x, y, w, html, at) => s.fade(h(el, '', { position: 'absolute', left: px(x), top: px(y), width: px(w), fontSize: '21px', fontWeight: '600', color: '#4A5260', lineHeight: '1.5' }, html), at);
    // ① 버스
    photo(s, 'media/rich/busstop.webp', 100, 230, 540, 360, { rot: -2, at: 200 });
    fact(110, 640, 20, '곳', '학교 안·정문 앞 정류장', 600);
    ex(112, 735, 540, '예) 한국교통대(정문) · (대학본부) · (체육관)', 800);
    fact(110, 800, 24, '개', '그 정류장에 서는 노선', 900);
    ex(112, 895, 540, `예) 999 · 700 · 급행1 · 급행2 …<br><img src="${LOGO('molit-emblem')}" style="height:26px;vertical-align:-6px"> 국토교통부 TAGO 실시간 데이터`, 1100);
    // ② 제휴
    photo(s, 'media/rich/partner.webp', 700, 230, 540, 360, { rot: 2, at: 400 });
    fact(710, 640, 48, '곳', '학생증 보여 주면 혜택', 1300);
    ex(712, 735, 540, '총학생회 제휴 · 식당 17 · 카페 7 · 주점 6 …', 1500);
    const P = [['윤박사 탕수육', '음료수 1개 제공'], ['보스찜닭', '현금결제 시 1,000원 할인']];
    P.forEach(([n, b], i) => note(s, 712 + i * 10, 790 + i * 100, 500, `<b>${n}</b> — <span style="font-size:22px">${b}</span>`, { rot: i ? 1 : -1, at: 1600 + i * 200, tape: false }).style.padding = '14px 20px');
    // ③ 사진
    ['library-w20', 'cafeteria', 'dorm-yeseong', 'post-office', 'cafe-flore', 'copy-room'].forEach((n, i) => photo(s, PHOTO(n), 1300 + (i % 3) * 180, 235 + Math.floor(i / 3) * 175, 165, 120, { rot: ((i * 13) % 7) - 3, at: 600 + i * 90, tape: i % 3 === 0 }));
    fact(1310, 640, 14, '장', '팀이 직접 가서 찍은 사진', 1900);
    ex(1312, 735, 520, '도서관 · 학생식당 · 생활관 · 우체국 …<br>사진 있는 곳은 피드에서 사진 먼저', 2100);
    return s;
  },
  // (모션 장) 같은 기준으로 맞추면 카드뉴스가 된다 — 실제 기록 P035
  sources(root) {
    const s = scene(root), el = s.el;
    const R0 = REAL.rows[0], E0 = REAL.eta.find(e => e.id === R0.id) || REAL.eta[0];
    title(s, 150, 70, '데이터 가공', '같은 기준으로 정리 → <em>카드뉴스</em>', null, { size: 76 });
    // 왼쪽: 흩어진 원문(실제 문장)
    const raw = [[E0.text, '에타 추천 글', 'everytime'], ['대기시간 10분이상', '수업 기록 · 추천 이유', null], ['한끼식사로 가벼움. 착한 가격. 적지 않은 양.', '수업 기록 · 추천 이유', null]];
    raw.forEach(([t, src, lg], i) => note(s, 150 + (i % 2) * 40, 290 + i * 240, 470, t, { rot: [-3, 2, -1][i], at: 300 + i * 200, src, logo: lg }));
    arrow(s, 650, 600, 100, 1000, 0);
    // 가운데: 표준 형식(실제 필드)
    const F = [['이름', R0.name], ['분류', R0.category], ['지역', R0.area], ['주소', R0.address], ['가격', won(R0.price)], ['영업', R0.hours], ['한줄', R0.reason]];
    const card = noteIn(el, `<div style="font-size:20px;font-weight:700;color:#6B7280;margin-bottom:6px">표준 형식 · ${R0.id}</div>` + F.map(([k, v]) => `<div class="hm-row" style="font-size:25px"><i style="width:60px;font-size:20px">${k}</i><span style="overflow:hidden;text-overflow:ellipsis">${v}</span></div>`).join(''), { abs: true, w: 560 });
    Object.assign(card.style, { left: '760px', top: '320px' });
    s.rise(card, 900);
    card.querySelectorAll('.hm-row').forEach((r, i) => s.custom(r, [{ opacity: 0, background: '#FFF1A8' }, { opacity: 1, background: '#FFF1A8', offset: .3 }, { opacity: 1, background: 'transparent' }], 1100 + i * 160, 700));
    arrow(s, 1335, 600, 95, 2300, 0);
    // 오른쪽: 실제 카드뉴스
    photo(s, `media/real/cards/${R0.card}`, 1440, 270, 430, 538, { rot: 3, cap: 'AI가 그린 실제 카드뉴스', at: 2500 });
    return s;
  },
};
