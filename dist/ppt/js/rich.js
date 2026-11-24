// 다시 만든 장 — 단순 아이콘·숫자 타일 대신 gpt-image 3D 일러스트(media/rich)와 애니메이션으로.
// 열쇠는 원래 슬라이드 번호(정적 장을 대신한다). numbers 는 모션 장 「숫자로 본 KNUTIPS」를 대신한다.
// 숫자·문구는 검증된 값만(발표자료/deck50/DECK50_스펙.md).
import { scene, h, img } from './motion.js';

const OBJ = n => `media/rich/${n}.png`;
const px = v => v + 'px';

// 가운데 정렬 머리말(원래 슬라이드 문법: 파란 머리말 → 굵은 제목 → 회색 부제)
function headC(s, eyebrow, title, sub, y = 70) {
  if (eyebrow) s.rise(h(s.el, 'eyebrow hc', { top: px(y) }, eyebrow), 0);
  s.rise(h(s.el, 'title hc', { top: px(y + 52) }, title), 90);
  if (sub) s.rise(h(s.el, 'sub hc', { top: px(y + 172) }, sub), 220);
}
function obj(s, name, x, y, hgt, at, how = 'pop', float = true) {
  const o = img(s.el, OBJ(name), 'obj' + (float ? ' float' : ''), { left: px(x), top: px(y), height: px(hgt), animationDelay: `-${(x % 7) * 0.4}s` });
  if (how === 'pop') s.pop(o, at, { s: .7 }); else if (how === 'rise') s.rise(o, at, { dy: 60 }); else s.slide(o, at, how === 'left' ? -160 : 160);
  return o;
}
function band(s, text, at = 1600) {
  const b = h(s.el, 'band', {}, text);
  s.custom(b, [{ opacity: 0, clipPath: 'inset(0 50% 0 50% round 60px)' }, { opacity: 1, clipPath: 'inset(0 0 0 0 round 60px)' }], at, 700);
  return b;
}
function stat(s, x, y, value, label, small, at, fmt) {
  const d = h(s.el, 'stat', { left: px(x), top: px(y), transform: 'translateX(-50%)' }, `<b></b><span>${label}</span>${small ? `<small>${small}</small>` : ''}`);
  s.rise(d, at);
  s.count(d.querySelector('b'), value, at + 100, 1100, fmt);
  return d;
}
// 점선이 그려지며 잇는다(SVG)
function dash(s, d, at, color = '#3566D4') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'path'); svg.setAttribute('viewBox', '0 0 1920 1080'); svg.setAttribute('width', '1920'); svg.setAttribute('height', '1080');
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', d); p.setAttribute('fill', 'none'); p.setAttribute('stroke', color); p.setAttribute('stroke-width', '5'); p.setAttribute('stroke-linecap', 'round');
  p.setAttribute('pathLength', '100'); p.setAttribute('stroke-dasharray', '100');
  svg.appendChild(p); s.el.appendChild(svg);
  s.custom(p, [{ strokeDashoffset: 100 }, { strokeDashoffset: 0 }], at, 900);
}

export const RICH = {
  // 흩어진 정보 ① 65개 페이지: 페이지 탑 + 실제 학교 공식 카드가 사방에서 날아와 쌓인다
  5(root) {
    const s = scene(root), el = s.el;
    headC(s, '흩어진 정보 ①', '65개 페이지', '학교 공식 꿀팁이 흩어진 곳');
    obj(s, 'page-stack', 330, 320, 640, 300, 'rise');
    const spots = [[90, 360, -9], [110, 700, 6], [760, 330, -6], [780, 760, 8], [1700, 320, 7], [1720, 800, -8]];
    spots.forEach(([x, y, r], i) => {
      const c = img(el, `media/cards/${String(i * 9).padStart(3, '0')}.jpg`, 'cardnews', { left: px(x), top: px(y), width: '140px', height: '175px', rotate: `${r}deg` });
      s.custom(c, [{ opacity: 0, transform: `translate(${x < 900 ? -240 : 240}px, ${-100 + i * 30}px) rotate(${r * 4}deg) scale(.6)` }, { opacity: 1, transform: 'none' }], 500 + i * 120, 900);
    });
    const g = s.count(h(el, 'giant', { left: '980px', top: '420px', fontSize: '300px' }), 65, 900, 1300, v => Math.round(v) + '개');
    s.pop(g, 850, { s: .8 });
    s.nuti('scattered-overwhelmed', 1300, 720, 330, 1500, 'wiggle');
    return s;
  },
  // 흩어진 정보 ② 8개 층 · 19곳: 단면 건물이 솟고, 층마다 불이 켜진다
  6(root) {
    const s = scene(root), el = s.el;
    headC(s, '흩어진 정보 ②', '8개 층 · 19곳', '대학본부 한 건물의 부서·시설');
    const b = obj(s, 'building-cutaway', 640, 300, 700, 200, 'rise', false);
    s.custom(b, [{ opacity: 0, clipPath: 'inset(100% 0 0 0)' }, { opacity: 1, clipPath: 'inset(0 0 0 0)' }], 200, 1400, 'cubic-bezier(.3,.7,.2,1)');
    stat(s, 360, 470, 8, '개 층', '대학본부', 600);
    stat(s, 1560, 470, 19, '곳', '부서·시설', 1100);
    s.nuti('questions-confused', 1420, 700, 340, 1500, 'wiggle');
    return s;
  },
  // 흩어진 정보 ③ 앱 3개: 앱 세 개 사이를 뛰어다니는 누티
  7(root) {
    const s = scene(root), el = s.el;
    headC(s, '흩어진 정보 ③', '앱 3개', '지도·버스·SNS를 오가며 확인');
    const apps = [['app-map', 260, '지도'], ['app-bus', 820, '버스'], ['app-sns', 1380, 'SNS']];
    apps.forEach(([n, x, l], i) => { obj(s, n, x, 360, 300, 300 + i * 200); s.rise(h(el, 'pill', { left: px(x + 95), top: '690px' }, l), 600 + i * 200); });
    dash(s, 'M560 520 C 640 440, 740 440, 820 520', 1000);
    dash(s, 'M1120 520 C 1200 440, 1300 440, 1380 520', 1200);
    const n = s.nuti('nuti-running', 760, 760, 300, 1400, 'idle');
    s.custom(n, [{ transform: 'translateX(-420px)' }, { transform: 'translateX(420px)' }], 1500, 2600, 'ease-in-out');
    return s;
  },
  // 장소·꿀팁 484: 넘치는 꿀팁 병 + 세 덩어리 막대가 솟는다
  11(root) {
    const s = scene(root), el = s.el;
    headC(s, '장소·꿀팁', '', null);
    const g = s.count(h(el, 'giant', { left: '0', right: '0', top: '120px', textAlign: 'center', fontSize: '210px' }), 484, 200, 1400);
    s.pop(g, 150, { s: .8 });
    s.rise(h(el, 'sub hc', { top: '330px' }, '기존 앱 321 + 누팁스 64 + 학교 공식 99'), 500);
    obj(s, 'tips-jar', 150, 430, 520, 400);
    const B = [[321, '기존 앱', '#3566D4'], [64, '누팁스', '#FFC83D'], [99, '학교 공식', '#8B1A1F']];
    const base = h(el, '', { position: 'absolute', left: '760px', top: '470px', width: '960px', height: '430px' });
    B.forEach(([v, l, c], i) => {
      const hh = 380 * v / 321;
      const bar = h(base, 'bar3', { left: px(40 + i * 320), width: '220px', height: px(hh), background: c });
      s.custom(bar, [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1.04)', offset: .8 }, { transform: 'scaleY(1)' }], 700 + i * 180, 900);
      const lab = h(el, 'stat', { left: px(760 + 150 + i * 320), top: px(470 + 430 - hh - 150), transform: 'translateX(-50%)' }, `<b style="font-size:84px"></b><span>${l}</span>`);
      s.fade(lab, 900 + i * 180);
      s.count(lab.querySelector('b'), v, 900 + i * 180, 900);
    });
    return s;
  },
  // 건물 37동: 캠퍼스 디오라마
  12(root) {
    const s = scene(root), el = s.el;
    headC(s, '건물', '', null);
    const g = s.count(h(el, 'giant', { left: '0', right: '0', top: '120px', textAlign: 'center', fontSize: '200px' }), 37, 200, 1200, v => Math.round(v) + '동');
    s.pop(g, 150, { s: .8 });
    s.rise(h(el, 'sub hc', { top: '330px' }, 'OpenStreetMap 외곽선 + 학교 층별 안내'), 500);
    obj(s, 'campus-diorama', 600, 410, 620, 500, 'rise');
    s.chip('외곽선 · OpenStreetMap', 120, 620, 'osm', 1200);
    s.chip('층별 안내 · 학교 캠퍼스지도', 1340, 620, 'emblem', 1400);
    return s;
  },
  // 교통·제휴·사진: 3D 아이콘 넷 + 숫자
  13(root) {
    const s = scene(root);
    headC(s, '교통·제휴·사진', '노선 24 · 정류장 20', '제휴 매장 48 · 팀이 찍은 실제 사진 14장');
    const I = [['icon-bus', 24, '버스 노선'], ['icon-stop', 20, '정류장'], ['icon-shop', 48, '제휴 매장'], ['icon-camera', 14, '실제 사진']];
    I.forEach(([n, v, l], i) => {
      const cx = 290 + i * 450;
      obj(s, n, cx - 140, 390, 280, 400 + i * 160);
      stat(s, cx, 700, v, l, null, 600 + i * 160);
    });
    return s;
  },
  // 정리: 532 · 680 · 15
  22(root) {
    const s = scene(root);
    headC(s, '정리', '넘기고, 찾고, 바로 열기', null);
    const I = [['icon-posts', 532, '게시물'], ['icon-cardnews', 680, '카드뉴스 그림'], ['icon-search', 15, '장학금 검색 결과']];
    I.forEach(([n, v, l], i) => {
      const cx = 400 + i * 560;
      obj(s, n, cx - 160, 300, 320, 300 + i * 180);
      stat(s, cx, 650, v, l, null, 500 + i * 180);
    });
    band(s, '피드 하나로 학교 정보를');
    return s;
  },
  // 실시간: 정류장을 누르면 도착 시간
  29(root) {
    const s = scene(root), el = s.el;
    headC(s, '실시간', '정류장을 누르면 도착 시간', '버스 위치는 10~20초마다 새로');
    obj(s, 'icon-stop', 300, 380, 460, 300);
    const bus = obj(s, 'icon-bus', 1100, 470, 320, 500, 'right', false);
    s.custom(bus, [{ transform: 'translateX(500px)', opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }], 500, 1600, 'cubic-bezier(.2,.8,.2,1)');
    const r = obj(s, 'icon-refresh', 820, 380, 220, 900, 'pop', false);
    r.animate([{ rotate: '0deg' }, { rotate: '360deg' }], { duration: 2600, iterations: Infinity, easing: 'ease-in-out', delay: 1400 });
    s.nuti('bus-waiting', 1480, 560, 420, 1200);
    return s;
  },
  // 정리: 혼자보다 같이
  36(root) {
    const s = scene(root);
    headC(s, '정리', '혼자보다 같이', '실제 학우끼리 매칭은 Firebase로 구현');
    obj(s, 'taxi', 260, 380, 300, 300);
    obj(s, 'rice-bowl', 1380, 380, 300, 500);
    s.nuti('together-taxi', 700, 330, 560, 700);
    band(s, '돈도 아끼고, 밥친구도 찾고');
    return s;
  },
  // 문제: AI는 숫자를 틀리게 쓰기도 합니다
  40(root) {
    const s = scene(root);
    headC(s, '문제', 'AI는 숫자를 틀리게 쓰기도 합니다', '가격이 틀린 카드뉴스는 없는 것보다 나쁩니다');
    const t = obj(s, 'price-tag-wrong', 720, 340, 560, 300, 'pop', false);
    s.custom(t, [{ rotate: '-8deg' }, { rotate: '6deg' }, { rotate: '-3deg' }, { rotate: '0deg' }], 900, 1200, 'ease-out');
    s.nuti('ai-painter', 1380, 480, 460, 900);
    return s;
  },
  // 기준: 문구 85% · 가격 100%
  42(root) {
    const s = scene(root);
    headC(s, '기준', '문구 85% · 가격 100%', '숫자는 하나라도 틀리면 다시 만듭니다');
    [[85, '문구', 520], [100, '가격', 1400]].forEach(([v, l, cx], i) => {
      const g = obj(s, 'gauge', cx - 210, 360, 400, 300 + i * 300, 'pop', false);
      stat(s, cx, 780, v, l, null, 500 + i * 300, x => Math.round(x) + '%');
    });
    return s;
  },
  // 결과: 567장 검사, 다시 만들 장 0
  43(root) {
    const s = scene(root);
    headC(s, '결과', '567장 검사, 다시 만들 장 0', null);
    obj(s, 'card-stack-check', 780, 320, 560, 300, 'rise');
    stat(s, 420, 470, 567, '장 검사', null, 500);
    const z = stat(s, 1500, 470, 0, '다시 만들 장', null, 900);
    z.querySelector('b').style.color = '#22C55E';
    band(s, '새로 만든 카드뉴스 567장, 가격 오류 0', 1500);
    return s;
  },
  // 로컬 LLM: 질문이 밖으로 나가지 않습니다
  45(root) {
    const s = scene(root);
    headC(s, '로컬 LLM', '질문이 밖으로 나가지 않습니다', '노트북 안에서 도는 한국어 소형 모델');
    obj(s, 'laptop-lock', 620, 360, 560, 300, 'rise');
    s.chip('Ollama 로컬 LLM', 180, 560, 'ollama', 900);
    s.nuti('rag-books', 1400, 520, 440, 1100);
    return s;
  },
  // 품질: 하나라도 실패하면 배포하지 않습니다
  47(root) {
    const s = scene(root);
    headC(s, '품질', '하나라도 실패하면 배포하지 않습니다', null);
    const gate = obj(s, 'stop-gate', 260, 360, 420, 300, 'pop', false);
    obj(s, 'green-check', 1300, 380, 320, 900);
    s.rise(h(s.el, 'pill', { left: '330px', top: '820px', color: '#E0483E' }, '테스트 실패 → 배포 중지'), 700);
    s.rise(h(s.el, 'pill', { left: '1250px', top: '820px', color: '#16A34A' }, '모두 통과 → GitHub Pages'), 1100);
    s.nuti('ci-checklist', 780, 400, 460, 600);
    band(s, '누가 고쳐도 앱이 망가지지 않게', 1600);
    return s;
  },
  // 한계와 다음: 아직 남은 숙제
  49(root) {
    const s = scene(root), el = s.el;
    headC(s, '한계와 다음', '아직 남은 숙제', null);
    const R = [['좋아요·댓글·MOA는 브라우저에만 저장', '서버 연결'], ["'확인 안 됨' 66건", '다시 확인'], ['카드 속 글자는 번역 안 됨', '유학생용 카드'], ['누티는 로컬 LLM이 켜진 컴퓨터에서만', '배포 방식 검토']];
    R.forEach(([a, b], i) => s.slide(h(el, 'row', { left: '140px', top: px(330 + i * 150) }, `<span class="now">${a}</span><span class="to">→</span><span class="next">${b}</span>`), 300 + i * 220, -120));
    obj(s, 'todo-board', 1300, 330, 420, 500);
    s.nuti('numbers-pointer', 1480, 640, 400, 900);
    return s;
  },
  // 처음 질문으로: 이제 한 앱에서
  51(root) {
    const s = scene(root), el = s.el;
    headC(s, '처음 질문으로', '이제 한 앱에서', null);
    const Q = [['밥 어디서 먹지?', 200, 380], ['이 과는 몇 층이지?', 1180, 360], ['버스 언제 와?', 1260, 680]];
    Q.forEach(([t, x, y], i) => {
      s.pop(h(el, 'bubble', { left: px(x), top: px(y) }, t), 300 + i * 300);
      s.pop(h(el, 'check', { left: px(x - 30), top: px(y - 30) }, '✓'), 1300 + i * 250, { s: .3 });
    });
    s.nuti('open-swipe', 700, 380, 600, 600);
    return s;
  },
  // (모션 장) 숫자로 본 KNUTIPS: 3D 아이콘 여덟 개가 차례로 튀어나오며 숫자가 오른다
  numbers(root) {
    const s = scene(root);
    s.head(null, '숫자로 본 <em>KNUTIPS</em>', null, 140, 90);
    const N = [['icon-tips', 484, '장소·꿀팁'], ['icon-posts', 532, '게시물'], ['icon-cardnews', 680, '카드뉴스 그림'], ['icon-building', 37, '건물'], ['icon-bus', 24, '버스 노선'], ['icon-stop', 20, '정류장'], ['icon-shop', 48, '제휴 매장'], ['icon-camera', 14, '실제 사진']];
    N.forEach(([n, v, l], i) => {
      const cx = 260 + (i % 4) * 370, top = 230 + Math.floor(i / 4) * 410;
      obj(s, n, cx - 95, top, 190, 200 + i * 120);
      stat(s, cx, top + 200, v, l, null, 300 + i * 120);
    });
    s.nuti('numbers-pointer', 1560, 420, 520, 900);
    return s;
  },
};
