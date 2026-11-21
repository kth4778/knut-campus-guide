import {BUS_STOPS, EXP_TERMINALS, mountBusStop, mountExpress, busKey,
  LIVE_MAX, liveEvery, liveColor, routeSort, routeIndex, liveBuses, liveBusInfo} from './transit.js';

import {moaPage, initMoa, openNewFund, fundById} from './moa.js';
import {moaChatPage, initMoaChat} from './moa-chat.js';
import {chatPage, initChat, scrollChat} from './chat.js';
import {mealRoomPage, mountMealRoom} from './meal-room.js';
import {initShare, openShare} from './share.js';
import {initBuildings, floorOf, buildingOf, buildingPinHtml, buildingPage, mapBuildings, buildingMarkHtml, guideCount, shortName} from './buildings.js';
import {initAccounts, storyRail, accountPage, partnerPage, partnerFeedPost, homeFeed, accountAvatar} from './accounts.js';

const app = document.getElementById('app');
const nav = document.getElementById('nav');
const campus = [36.969692, 127.872252];
const categories = [
  ['전체', 'grid', ''],
  ['맛집', 'food', 'food.webp'],
  ['숨은장소', 'tree', 'walk.webp'],
  ['생활꿀팁', 'book', 'card.webp'],
  ['자유', 'spark', 'dice.webp'],
];
const categoryInfo = new Map(categories.map(([name, icon, asset]) => [name, {icon, asset}]));
// 지도에만 있는 교통 분류
const transitCategories = ['버스', '고속버스'];
// 지도에만 있는 분류(장소 핀 대신 다른 점을 보여줌). 지도 칩 순서: 전체 · 버스 · 고속버스 · 교통대 제휴 · 장소 분류들
const mapOnlyCategories = [...transitCategories, '교통대 제휴'];
const mapCategories = ['전체', ...mapOnlyCategories, ...categories.slice(1).map(([name]) => name)];
// 교통대 제휴 매장 (지도에서 처음 고를 때 data/partners.json 을 받아요)
let mapPartners = null;
function loadMapPartners() {
  loadMapPartners.ready ??= fetch('./data/partners.json')
    .then(response => response.ok ? response.json() : [])
    .then(list => { mapPartners = list.filter(partner => partner.latlng); })
    .catch(() => { mapPartners = []; });
  return loadMapPartners.ready;
}
const paths = {
  home: '<path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/>',
  search: '<circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/>',
  pin: '<path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  bookmark: '<path d="M5 3h14v18l-7-5-7 5z"/>',
  back: '<path d="m11 4-8 8 8 8M3 12h18"/>',
  arrow: '<path d="m9 5 7 7-7 7"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  food: '<path d="M4 3v7a3 3 0 0 0 6 0V3m-3 0v18m12 0V3c-3 1-5 4-5 8v2h5"/>',
  tree: '<path d="M12 21v-6m-4 2H5l4-6H7l5-8 5 8h-2l4 6h-3"/>',
  book: '<path d="M3 4h6l3 2 3-2h6v15h-6l-3 2-3-2H3zm9 2v15"/>',
  spark: '<path d="M12 2c1 7 3 9 10 10-7 1-9 3-10 10-1-7-3-9-10-10 7-1 9-3 10-10z"/>',
  share: '<path d="M12 15V3m-5 5 5-5 5 5M5 12H3v9h18v-9h-2"/>',
  link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3.2-3.2a4.5 4.5 0 0 0-6.4-6.4l-1.1 1.1M14 10a4.5 4.5 0 0 0-6.4 0l-3.2 3.2a4.5 4.5 0 0 0 6.4 6.4l1.1-1.1"/>',
  send: '<path d="M21.5 2.5 10.6 13.4M21.5 2.5 14.6 21l-4-7.6-7.6-4z"/>',
  more: '<circle cx="5.5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18.5" cy="12" r="1.3"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  target: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>',
  moa: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.6A8 8 0 1 1 21 12Z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/>',
  camera: '<path d="M4 8h3.2l1.8-2.6h6l1.8 2.6H20v11H4z"/><circle cx="12" cy="13" r="3.6"/>',
  bus: '<rect x="4" y="3" width="16" height="15" rx="3"/><path d="M4 11h16M8 18v3m8-3v3M8 14.5h.01M16 14.5h.01"/>',
};

// 하트·말풍선·+ 도 그림(png) 대신 다른 아이콘과 같은 굵기의 선으로 그린다 (크기·굵기가 맞도록)
paths.heart = '<path d="M12 20.3s-7.6-4.5-9.3-9.3C1.5 7.5 3.7 3.9 7.3 3.9c2 0 3.6 1.1 4.7 2.7 1.1-1.6 2.7-2.7 4.7-2.7 3.6 0 5.8 3.6 4.6 7.1-1.7 4.8-9.3 9.3-9.3 9.3Z"/>';
paths.heartFilled = paths.heart;
paths.comment = '<path d="M20.6 16.4A9 9 0 1 0 17.2 20l4.3 1.4z"/>';
paths.plus = '<rect x="3" y="3" width="18" height="18" rx="5.5"/><path d="M12 7.8v8.4M7.8 12h8.4"/>';
const icon = (name, filled = false) => (filled = filled || name === 'heartFilled', `<svg class="icon" viewBox="0 0 24 24" fill="${filled?'currentColor':'none'}" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`);
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));
const normalize = value => String(value ?? '').normalize('NFKC').toLowerCase().replace(/\s+/g, '');
const route = (page, params = {}) => {
  const query = new URLSearchParams(params).toString();
  return `#/${page}${query ? '?' + query : ''}`;
};
const safeUrl = url => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' ? escape(parsed.href) : '';
  } catch {
    return '';
  }
};
const button = (name, label, action, extra = '') =>
  `<button type="button" class="ib" data-action="${action}" aria-label="${escape(label)}" ${extra}>${icon(name)}</button>`;
const iconLink = (name, label, url) =>
  `<a class="ib" href="${escape(url)}" aria-label="${escape(label)}">${icon(name)}</a>`;
const imageTag = asset => `<img src="assets/${asset}" alt="" width="48" height="48">`;
const saveKey = 'knut-campus-guide:saved';
let saved = new Set();
try {
  const existing = JSON.parse(localStorage.getItem(saveKey));
  if (Array.isArray(existing)) saved = new Set(existing.filter(id => typeof id === 'string'));
} catch {}
function readLocal(key, fallback) {
  try { return JSON.parse(localStorage.getItem('knut-campus-guide:'+key)) ?? fallback; }
  catch { return fallback; }
}
function writeLocal(key, value) {
  localStorage.setItem('knut-campus-guide:'+key, JSON.stringify(value));
}
let localPosts = readLocal('posts', []);
// 프로필 편집에서 바꾸는 이름·소개 (이 브라우저에만 저장)
let profile = {name:'KNUTIPS', bio:'한국교통대 충주캠퍼스', ...readLocal('profile', {})};
const likes = new Set(readLocal('likes', []));
// 댓글: 게시물 id → [{id, text, at(작성 시각), liked, replyTo(답글이면 원 댓글 id)}]. 예전 글자만 저장된 것도 읽는다
const comments = Object.fromEntries(Object.entries(readLocal('comments', {})).map(([pid, list]) =>
  [pid, list.map((c, i) => typeof c === 'string' ? {id:`old${i}`, text:c, at:0, liked:false, replyTo:null} : c)]));
const saveComments = () => { try { writeLocal('comments', comments); } catch { toast('댓글을 저장하지 못했어요.'); } };
let profileTab = 'posts';
let places = [];
let byId = new Map();
let mappedPlaces = [];
let map = null;
let mapMarkers = null;
const NAVER_MAP_ID = 'g0yc562ytb';
let usingNaver = false;
let naverFailed = false;
let naverInfo = null;
let mapCategory = '전체';
let lastViewKey = ''; // 직전에 그린 화면 (같은 화면에서 주소만 바뀌면 스크롤 유지)
let focusedMapPlace = null;
let searchQuery = '';
let homeLimit = 16;
let searchLimit = 35;
let currentView = '';
let toastTimer;
let placeBack = '#/';
// 실시간 버스 위치 (지도 '버스' 분류에서만 돌아요)
const live = {picked:new Set(readLocal('liveRoutes', ['999'])), index:null, buses:[], error:'', last:null, timer:null, on:false};

function readRoute() {
  const [raw = '', query = ''] = location.hash.slice(1).split('?');
  return [raw.replace(/^\//, ''), new URLSearchParams(query)];
}

function top(title, left = '', right = '', brand = false) {
  return `<header class="top"><div>${left}</div><div class="middle${brand?' brand':''}">${escape(title)}</div><div>${right}</div></header>`;
}

// 하단 탭 아이콘: 평소엔 같은 굵기의 빈 선, 선택된 탭은 같은 모양을 꽉 채운다 (돋보기는 굵은 선)
const tabShapes = {
  home: {
    line: '<path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/>',
    fill: '<path fill-rule="evenodd" d="M2.4 9.2 12 1.7l9.6 7.5V19a2.7 2.7 0 0 1-2.7 2.7H5.1A2.7 2.7 0 0 1 2.4 19zM9.8 21.7v-6.2h4.4v6.2z"/>',
  },
  moa: {
    line: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8"/>',
    fill: '<circle cx="9" cy="7.8" r="4"/><path d="M1.8 20.6a7.2 7.2 0 0 1 14.4 0z"/><path fill="none" stroke="currentColor" stroke-width="2.3" d="M16 4.4a3.6 3.6 0 0 1 0 7M18 14a6.6 6.6 0 0 1 3.8 6.1"/>',
  },
  pin: {
    line: '<path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    fill: '<path fill-rule="evenodd" d="M20.6 10c0 6.5-8.6 12-8.6 12S3.4 16.5 3.4 10a8.6 8.6 0 1 1 17.2 0ZM12 7.3a2.7 2.7 0 1 0 0 5.4 2.7 2.7 0 0 0 0-5.4Z"/>',
  },
  // 프로필: 학사모 쓴 사람 (다른 탭과 같은 1.7 굵기 선 / 고르면 같은 모양을 채움). gpt-image 시안을 보고 24칸에 다시 그림
  profile: {
    line: '<path d="M2.8 6.6 12 2.9l9.2 3.7L12 10.3z"/><path d="M21 6.8v3.6"/><path d="M8.7 10.9a3.4 3.4 0 1 0 6.6 0"/><path d="M5 21a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5z"/>',
    fill: '<path d="M2.4 6.6 12 2.5l9.6 4.1L12 10.7z"/><path fill="none" stroke="currentColor" stroke-width="2.2" d="M21.2 6.9v4.1"/><path d="M8.3 10.4Q12 12.6 15.7 10.4A3.9 3.9 0 1 1 8.3 10.4Z"/><path d="M4.6 21.6a5.2 5.2 0 0 1 5.2-5.2h4.4a5.2 5.2 0 0 1 5.2 5.2.8.8 0 0 1-.8.8H5.4a.8.8 0 0 1-.8-.8Z"/>',
  },
  search: {
    line: '<circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/>',
    fill: '<circle cx="10.5" cy="10.5" r="6.6" fill="none" stroke="currentColor" stroke-width="2.9"/><path fill="none" stroke="currentColor" stroke-width="2.9" d="m15.8 15.8 5.2 5.2"/>',
  },
};
const tabIcon = (name, on) =>
  `<svg class="icon tab-icon" viewBox="0 0 24 24" fill="${on?'currentColor':'none'}" stroke="${on?'none':'currentColor'}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${tabShapes[name][on?'fill':'line']}</svg>`;

// 탭 바 렌즈를 마우스·손가락으로 끌어 옮기기: 끄는 동안 유리 알이 커져 따라오고, 놓으면 가장 가까운 탭으로 붙으며 그 화면으로 간다.
// 6px 안쪽으로 움직였다 놓으면 그냥 탭 누르기로 본다
let navDrag = null;
nav.addEventListener('pointerdown', event => {
  const lens = nav.querySelector('.nav-lens');
  if (!lens || lens.hidden || event.button > 0) return;
  navDrag = {x0:event.clientX, moved:false, id:event.pointerId, lens, tabs:nav.querySelector('.nav-tabs')};
});
nav.addEventListener('pointermove', event => {
  if (!navDrag || event.pointerId !== navDrag.id) return;
  if (!navDrag.moved) {
    if (Math.abs(event.clientX - navDrag.x0) < 6) return;
    navDrag.moved = true;
    nav.setPointerCapture(event.pointerId);
    navDrag.lens.classList.remove('moving');
    navDrag.lens.classList.add('dragging');
  }
  const box = navDrag.tabs.getBoundingClientRect(), cell = (box.width - 12) / 5;
  navDrag.pos = Math.min(4, Math.max(0, (event.clientX - box.left - 6 - cell / 2) / cell));
  navDrag.lens.style.setProperty('--i', navDrag.pos.toFixed(3));
});
const endNavDrag = event => {
  if (!navDrag || event.pointerId !== navDrag.id) return;
  const {moved, pos, lens} = navDrag;
  navDrag = null;
  if (!moved) return;
  lens.classList.remove('dragging');
  const index = Math.round(pos ?? 0);
  lens.style.setProperty('--i', index);
  // 끌기 끝의 click 이 다른 탭을 누른 것으로 처리되지 않게 한 번 막는다
  navDragEnded = Date.now();
  const link = nav.querySelectorAll('.nav-tabs a')[index];
  if (link && location.hash !== link.getAttribute('href')) location.hash = link.getAttribute('href');
};
let navDragEnded = 0;
nav.addEventListener('click', event => { if (Date.now() - navDragEnded < 350) event.preventDefault(); }, true);
nav.addEventListener('pointerup', endNavDrag);
nav.addEventListener('pointercancel', endNavDrag);

function renderNav(active) {
  const links = [
    ['','홈','home'], ['moa','MOA','moa'], ['map','지도','pin'], ['search','검색','search'], ['my','프로필','profile'],
  ];
  // 렌즈(고른 탭 뒤의 유리 알)는 한 번만 만들고 계속 쓴다 → 탭을 바꾸면 이전 자리에서 새 자리로 미끄러진다
  // 바의 유리(흐림)는 따로 깐 층(.nav-glass)에만 건다 — 바 자체에 걸면 렌즈가 바의 어두운 색만 비춰 보여서
  if (!nav.querySelector('.nav-lens')) nav.innerHTML = '<span class="nav-glass" aria-hidden="true"></span><span class="nav-lens" aria-hidden="true"></span><div class="nav-tabs"></div>';
  nav.querySelector('.nav-tabs').innerHTML = links.map(([page,label,symbol]) => page === null
    ? '<span aria-hidden="true"></span>'
    : `<a href="${route(page)}" data-tab="${page || 'home'}" ${active===page?'aria-current="page"':''}>${tabIcon(symbol, active===page)}<span>${label}</span></a>`).join('');
  const lens = nav.querySelector('.nav-lens');
  const index = links.findIndex(([page]) => page === active);
  lens.hidden = index < 0;
  if (index < 0 || String(index) === lens.style.getPropertyValue('--i')) return;
  if (lens.style.getPropertyValue('--i')) { lens.classList.remove('moving'); void lens.offsetWidth; lens.classList.add('moving'); }
  lens.style.setProperty('--i', index);
}

function placeIcon(category) {
  const info = categoryInfo.get(category) || categoryInfo.get('전체');
  return `<span class="place-icon" data-cat="${escape(category)}">${info.asset ? imageTag(info.asset) : icon(info.icon)}</span>`;
}

function saveButton(place) {
  const on = saved.has(place.id);
  return `<button class="ib" data-action="save" data-id="${place.id}" aria-pressed="${on}" aria-label="${on?'저장 취소':'장소 저장'}">${icon('bookmark',on)}</button>`;
}

function placeRow(place, mode = 'detail', showSave = true) {
  const detailUrl = route('place', {id:place.id});
  const mapUrl = route('map', {focus:place.id});
  const goesToMap = mode === 'search' && place.latlng;
  const context = place.area === '장소 없음' ? '장소 없이 보는 정보' :
    place.area === '위치 확인 안 됨' ? '위치 확인 필요' : place.area;
  const rowAction = mode === 'search'
    ? iconLink(goesToMap?'arrow':'book',goesToMap?'상세 정보':'정보 보기',detailUrl)
    : mode === 'map' ? iconLink('arrow', '상세 정보', detailUrl)
    : place.latlng ? iconLink('pin', '지도에서 위치 보기', mapUrl) : '';
  return `<div class="place-row">
    <a class="place-main" href="${escape(goesToMap?mapUrl:detailUrl)}">
      ${placeIcon(place.category)}
      <span class="place-text"><strong>${escape(place.name)}</strong><small>${escape(place.category)} · ${escape(context)}${goesToMap?' · 지도에서 보기':''}</small></span>
    </a>
    ${rowAction}
    ${showSave ? saveButton(place) : ''}
  </div>`;
}

function brandAvatar() {
  return '<img class="account-avatar" src="assets/knutips-logo.webp" alt="" width="34" height="34">';
}

// 카드뉴스 (data/cards.json: 게시물 id → 그림 한 장 또는 여러 장 [표지, 메뉴, …]. 게시물 글을 gpt-image 로 만든 것)
let cards = {};
const cardList = id => [].concat(cards[id] || []);

function postCover(post, grid = false) {
  if (post.local && post.image) {
    return `<img class="cover-image" src="${escape(post.image)}" alt="" loading="lazy">`;
  }
  const slides = cardList(post.id);
  if (slides.length === 1 || (slides.length && grid)) {
    return `<img class="cover-image card-image" src="assets/${escape(slides[0])}" alt="${escape(post.name)} 카드뉴스" loading="lazy">`;
  }
  if (slides.length) {
    // 여러 장: 옆으로 넘겨 보는 카드뉴스 (인스타처럼 오른쪽 위 1/3, 아래 점, 컴퓨터에선 좌우 화살표)
    return `<div class="card-carousel">
      <div class="card-track" tabindex="0" role="group" aria-label="${escape(post.name)} 카드뉴스 ${slides.length}장 · 좌우 화살표로 넘기기">${slides.map((src, i) => `<img class="cover-image card-image" src="assets/${escape(src)}" alt="${escape(post.name)} 카드뉴스 ${i + 1}/${slides.length}" loading="lazy" draggable="false">`).join('')}</div>
      <span class="card-count">1/${slides.length}</span>
      <button type="button" class="card-nav prev" data-action="card-step" data-step="-1" aria-label="이전 장" hidden>‹</button>
      <button type="button" class="card-nav next" data-action="card-step" data-step="1" aria-label="다음 장">›</button>
      <div class="card-dots" aria-hidden="true">${slides.map((_, i) => `<i${i ? '' : ' class="on"'}></i>`).join('')}</div>
    </div>`;
  }
  const info = categoryInfo.get(post.category) || categoryInfo.get('전체');
  const area = post.area === '장소 없음' ? '' : post.area;
  return `<div class="cover-art" data-cat="${escape(post.category)}">
    ${info.asset ? imageTag(info.asset) : icon(info.icon)}
    ${grid ? '' : `<div><small>${escape(post.category)}${area?' · '+escape(area):''}</small><strong>${escape(post.name)}</strong></div>`}
  </div>`;
}


// 인스타그램처럼: 아이콘만 있는 줄(♡ 💬 ✈︎ 📍 … 🔖) → 추천 수 → 캡션 2줄 → 댓글 → 날짜
function postActions(post) {
  const on = likes.has(post.id);
  return `<div class="post-actions">
    ${button(on?'heartFilled':'heart',on?'좋아요 취소':'좋아요','like',`data-id="${post.id}" aria-pressed="${on}"`)}
    ${button('comment','댓글','comments',`data-id="${post.id}"`)}
    ${post.local ? '' : button('send','공유하기','copy',`data-id="${post.id}"`)}
    ${post.latlng ? iconLink('pin','지도에서 위치 보기',route('map',{focus:post.id})) : ''}
    ${saveButton(post)}
  </div>`;
}

const likeCount = post => (post.rec || 0) + (likes.has(post.id) ? 1 : 0);

function postedDate(post) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(post.checked || '') ? new Date(post.checked) : null;
  return date ? `${date.getMonth() + 1}월 ${date.getDate()}일` : '';
}

function postCaption(post, url) {
  const text = post.local ? post.caption : (post.reasons?.[0] ?? post.address ?? '');
  const count = comments[post.id]?.length ?? 0;
  const n = likeCount(post);
  return `<div class="post-caption">
    <p class="post-likes" data-likes="${post.id}" ${n?'':'hidden'}>추천 ${n}개</p>
    <p class="caption-text"><a href="${url}"><strong>${escape(post.name)}</strong></a> ${escape(text)}</p>
    ${text.length > 60 ? `<button type="button" class="caption-more" data-action="caption-more">더 보기</button>` : ''}
    <button data-action="comments" data-id="${post.id}">${count?'댓글 '+count+'개 모두 보기':'댓글 달기…'}</button>
    ${commentPreview(post.id)}
    ${postedDate(post) ? `<p class="post-time">${postedDate(post)}</p>` : ''}
  </div>`;
}

// ⋯ : 인스타처럼 게시물로 가지 않고 아래 메뉴 창을 연다 (저장·공유·링크 복사 / 지도에서 보기·게시물 자세히·관심 없음)
function moreButton({id, url, mapUrl = '', save = false}) {
  return `<button type="button" class="ib post-more" data-action="post-menu" data-id="${escape(id)}" data-url="${escape(url)}" data-map="${escape(mapUrl)}" data-save="${save}" aria-label="옵션 더 보기">${icon('more')}</button>`;
}

function openPostMenu(control) {
  const {id, url, map: mapUrl, save} = control.dataset;
  app.querySelector('dialog.post-menu')?.close();
  const dialog = document.createElement('dialog');
  dialog.className = 'comment-sheet post-menu';
  const on = saved.has(id);
  const round = (action, iconName, label, extra = '') => `<button type="button" class="pm-round" data-pm="${action}" ${extra}><span>${icon(iconName, action === 'save' && on)}</span>${label}</button>`;
  const row = (action, label, extra = '') => `<button type="button" class="pm-row${extra}" data-pm="${action}">${label}</button>`;
  dialog.innerHTML = `<span class="share-grip" aria-hidden="true"></span>
    <div class="pm-rounds">${save === 'true' ? round('save', 'bookmark', on ? '저장됨' : '저장') : ''}${round('share', 'share', '공유')}${round('copy', 'link', '링크 복사')}</div>
    <div class="pm-list">
      ${mapUrl ? row('map', '지도에서 보기') : ''}
      ${row('open', '게시물 자세히 보기')}
      ${id !== 'welcome' ? row('hide', '관심 없음', ' danger') : ''}
    </div>`;
  app.append(dialog);
  dialog.addEventListener('close', () => dialog.remove());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) { dialog.close(); return; }
    const pick = event.target.closest('[data-pm]')?.dataset.pm;
    if (!pick) return;
    const full = new URL(url, location.href).href;
    dialog.close();
    if (pick === 'save') toggleSave(id);
    else if (pick === 'share') openShare(app, {title:`${control.closest('.feed-post')?.querySelector('.post-owner strong')?.textContent || 'KNUTIPS'} · KNUTIPS`, text:'', url:full});
    else if (pick === 'copy') navigator.clipboard?.writeText(full).then(() => toast('링크를 복사했어요'), () => toast(full));
    else if (pick === 'map') location.hash = mapUrl;
    else if (pick === 'open') location.hash = url;
    else if (pick === 'hide') {
      hiddenPosts.add(id);
      try { writeLocal('hiddenPosts', [...hiddenPosts]); } catch {}
      control.closest('.feed-post')?.remove();
      toast('이 게시물을 홈에서 숨겼어요');
    }
  });
  dialog.showModal();
}

function feedPost(post) {
  const url = route(post.local?'post':'place',{id:post.id});
  return `<article class="feed-post">
    <header class="post-header">
      ${accountAvatar(post) || `<a href="${route('my')}" aria-label="프로필 열기">${brandAvatar()}</a>`}
      <a class="post-owner" href="${url}"><strong>${escape(post.name)}</strong><small>${escape(post.category)}${post.area && post.area!=='장소 없음'?' · '+escape(post.area):''}</small></a>
      ${moreButton({id:post.id, url, mapUrl:post.latlng ? route('map', {focus:post.id}) : '', save:!post.local})}
    </header>
    <div class="post-cover" data-like-area="${post.id}" aria-label="${escape(post.name)} 사진 · 두 번 누르면 좋아요">${postCover(post)}<span class="like-burst" aria-hidden="true"></span></div>
    ${postActions(post)}
    ${postCaption(post, url)}
  </article>`;
}

// 전체: 누팁스처럼 추천 많은 곳 사이사이에 제휴 혜택·오늘의 꿀팁을 섞는다
let feedSeed = Math.random().toString(36).slice(2); // 앱을 열 때·끌어내려 새로고침할 때마다 바뀌어 홈·검색 순서를 새로 섞는다
const seedHash = text => { let h = 0; for (const c of text) h = (h * 31 + c.charCodeAt(0)) | 0; return h; };
let exploreCache = {seed:'', list:[]};
// 검색 탭 첫 화면(격자)의 순서: 새로고침마다 새로 섞는다
function explorePlaces() {
  if (exploreCache.seed !== feedSeed) exploreCache = {seed:feedSeed, list:places.slice().sort((a, b) => seedHash(a.id + feedSeed) - seedHash(b.id + feedSeed))};
  return exploreCache.list;
}
const hiddenPosts = new Set(readLocal('hiddenPosts', [])); // ⋯ → 관심 없음
function homeItems(category) {
  const items = category === '전체'
    ? [...localPosts.map(post => ({kind:'place', post})), ...homeFeed(places, feedSeed)]
    : [...localPosts, ...places].filter(post => post.category === category).map(post => ({kind:'place', post}));
  return items.filter(item => !hiddenPosts.has(item.post.id));
}
const feedItem = item => item.kind==='partner' ? partnerFeedPost(item.post) : feedPost(item.post);
// 목록 끝 표시: 여기까지 스크롤하면 다음 묶음을 이어 붙인다 (더 보기 버튼 없이 끝없이)
const ptrBox = '<div class="ptr" aria-hidden="true"><svg class="ptr-spin" viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 1-8.5 6"/></svg></div>';
const sentinel = kind => `<div class="feed-sentinel" data-more="${kind}" aria-hidden="true"><span></span></div>`;

function home(category) {
  const items = homeItems(category);
  const visible = items.slice(0, homeLimit);
  return `<header class="top home-top"><div class="middle brand">KNUTIPS</div><div class="home-actions"></div></header>
    <main class="scroll" aria-label="홈">
      ${ptrBox}
      ${storyRail()}
      ${visible.map(feedItem).join('')}
      ${items.length>visible.length?sentinel('home'):''}
    </main>`;
}

function searchMatches(text) {
  const words = text.trim().toLowerCase().split(/\s+/).filter(Boolean).map(normalize);
  if (!words.length) return places.slice(0, 12);
  const plain = normalize(text);
  return places.filter(place => words.every(word => place.searchText.includes(word)))
    .sort((a, b) => Number(normalize(b.name).includes(plain)) - Number(normalize(a.name).includes(plain)));
}

function searchResults() {
  const matches = searchMatches(searchQuery);
  const query = searchQuery.trim();
  if (!query) return ptrBox + gridPosts(explorePlaces().slice(0,searchLimit),true) + (places.length>searchLimit?sentinel('search'):'');
  if (!matches.length) return '<div class="empty">검색 결과가 없어요.<br>장소 이름이나 다른 키워드를 입력해 보세요.</div>';
  return `<div class="section-head"><h2>${query?'검색 결과':'추천 장소'}</h2><span>${matches.length}개</span></div>
    <div class="places">${matches.slice(0,searchLimit).map(place => placeRow(place,'search')).join('')}</div>
    ${matches.length>searchLimit?sentinel('search'):''}`;
}

function searchPage() {
  return `<header class="top search-top">
      <div class="search-field">
        ${icon('search')}
        <input type="search" id="place-search" placeholder="장소·건물·메뉴 검색" aria-label="장소·건물·메뉴 검색" value="${escape(searchQuery)}" autocomplete="off">
        ${button('close','검색어 지우기','clear-search')}
      </div>
      ${iconLink('bookmark','저장한 장소',route('my'))}
    </header>
    <main class="scroll" id="search-results">${searchResults()}</main>`;
}

function gridPosts(items, mapFirst = false) {
  return `<div class="post-grid">${items.map(post => {
    const pin = mapFirst && post.latlng;
    const url = pin ? route('map',{focus:post.id}) : route(post.local?'post':'place',{id:post.id});
    return `<a href="${url}" aria-label="${escape(post.name)} ${pin?'지도에서 보기':'게시물'}">${postCover(post,true)}${mapFirst?`<span class="grid-name">${escape(post.name)}</span>`:''}</a>`;
  }).join('')}</div>`;
}

function savedPage() {
  const savedItems = [...saved].map(findPost).filter(Boolean);
  const items = profileTab==='saved' ? savedItems : localPosts;
  const empty = profileTab==='saved'
    ? `<div class="empty"><p>아직 저장한 게시물이 없어요.</p><a class="primary" href="${route('search')}">장소 찾아보기</a></div>`
    : `<div class="empty"><strong>첫 번째 게시물을 만들어보세요</strong><p>학교에서 발견한 장소를 기록해 보세요.</p><a class="primary" href="${route('compose')}">새 게시물</a></div>`;
  return `${top('KNUTIPS',iconLink('plus','새 게시물',route('compose')),iconLink('menu','설정',route('settings')))}
    <main class="scroll">
      <section class="profile">
        <div class="profile-line">${brandAvatar()}<div class="profile-info">
          <h1>${escape(profile.name)}</h1>
          <div class="profile-counts">
            <a href="${route('my')}"><b>${localPosts.length}</b>게시물</a>
            <span><b>0</b>팔로워</span>
            <span><b>0</b>팔로잉</span>
          </div>
        </div></div>
        <p>${escape(profile.bio)}</p>
        <div class="profile-actions"><a class="pill" href="${route('profile-edit')}">프로필 편집</a><a class="pill profile-nuti" href="${route('chat')}"><img class="nuti-peek" src="assets/nuti/peek.webp" alt="" width="320" height="174">누티 <span class="nuti-en">Nuti</span></a></div>
      </section>
      <nav class="profile-tabs" aria-label="프로필 게시물">
        <a href="${route('my')}" aria-label="내 게시물" ${profileTab==='posts'?'aria-current="page"':''}>${icon('grid')}</a>
        <a href="${route('my',{tab:'saved'})}" aria-label="저장한 게시물 격자" ${profileTab==='saved'?'aria-current="page"':''}>${icon('bookmark')}</a>
      </nav>
      ${items.length?gridPosts(items):empty}
    </main>`;
}

// 인스타그램 프로필의 세 줄 메뉴 자리. 이 앱에서 실제로 할 수 있는 것만 둔다.
function profileEditPage() {
  return `${top('프로필 편집',iconLink('back','뒤로',route('my')))}
    <main class="scroll compose">
      <form id="profile-form">
        <div class="profile-edit-avatar">${brandAvatar()}</div>
        <label>이름 <input name="name" value="${escape(profile.name)}" required maxlength="30"></label>
        <label>소개 <textarea name="bio" maxlength="100" placeholder="나를 소개해 보세요">${escape(profile.bio)}</textarea></label>
        <p>이름과 소개는 이 브라우저에만 저장돼요.</p>
        <button class="primary" type="submit">저장</button>
      </form>
    </main>`;
}

function settingsPage() {
  const row = (href, symbol, label, sub = '') =>
    `<a class="setting-row" href="${href}">${icon(symbol)}<span><strong>${label}</strong>${sub?`<small>${sub}</small>`:''}</span>${icon('arrow')}</a>`;
  const external = (href, label, sub) =>
    `<a class="setting-row" href="${href}" target="_blank" rel="noopener">${icon('share')}<span><strong>${label}</strong><small>${sub}</small></span>${icon('arrow')}</a>`;
  return `${top('설정',iconLink('back','뒤로',route('my')))}
    <main class="scroll settings">
      <h2>내 활동</h2>
      ${row(route('my'),'grid','내 게시물',`${localPosts.length}개`)}
      ${row(route('my',{tab:'saved'}),'bookmark','저장한 게시물',`${saved.size}개`)}
      <h2>기록</h2>
      <p class="setting-note">게시물·좋아요·댓글·저장은 이 브라우저에만 저장돼요. 다른 기기나 다른 사람과 공유되지 않아요.</p>
      <button type="button" class="setting-row danger" data-action="reset-data">${icon('close')}<span><strong>내 기록 모두 지우기</strong><small>게시물 ${localPosts.length} · 좋아요 ${likes.size} · 댓글 ${Object.values(comments).flat().length} · 저장 ${saved.size}</small></span></button>
      <h2>정보</h2>
      ${external('https://github.com/kth4778/knut-campus-guide','소스 코드','GitHub')}
      <p class="setting-note">지도: 네이버 지도 (연결이 안 되면 OpenStreetMap)<br>건물 사진: Wikimedia Commons · CC BY-SA 4.0</p>
    </main>`;
}

function resetData() {
  if (!confirm('이 브라우저에 저장된 게시물·좋아요·댓글·저장을 모두 지울까요? 되돌릴 수 없어요.')) return;
  for (const key of ['posts','likes','comments','saved','profile']) {
    try { localStorage.removeItem('knut-campus-guide:'+key); } catch {}
  }
  localPosts = [];
  likes.clear();
  for (const id of Object.keys(comments)) delete comments[id];
  saved = new Set();
  profile = {name:'KNUTIPS', bio:'한국교통대 충주캠퍼스'};
  render();
  toast('내 기록을 모두 지웠어요.');
}

function composePage() {
  return `${top('새 게시물',iconLink('back','뒤로',placeBack))}
    <main class="scroll compose">
      <form id="compose-form" class="compose-form">
        <label class="photo-drop">
          <input class="photo-input" name="photo" type="file" accept="image/jpeg,image/png,image/webp">
          <span class="photo-empty">${icon('camera')}<b>사진 추가</b><small>JPG · PNG · WebP (선택)</small></span>
          <img class="photo-preview" alt="" hidden>
        </label>
        <fieldset class="cat-pick"><legend>카테고리</legend>
          <div>${categories.slice(1).map(([name,,asset],i)=>`<label><input type="radio" name="category" value="${name}" ${i?'':'checked'}><span>${asset?imageTag(asset):''}${name}</span></label>`).join('')}</div>
        </fieldset>
        <label class="field"><span>제목</span><input name="name" placeholder="장소나 기록 이름" required maxlength="60"></label>
        <label class="field"><span>내용</span><textarea name="caption" placeholder="문구를 입력하세요…" required maxlength="500"></textarea><small class="count">0/500</small></label>
        <p class="compose-note">게시물은 이 브라우저에 저장됩니다. 학교 꿀팁이라면 <a href="${route('tip')}">꿀팁 제보</a>로 보내 주세요 — 모두에게 보여요.</p>
        <p class="form-error" role="status"></p>
        <button class="primary compose-submit" type="submit">게시</button>
      </form>
    </main>`;
}

// 꿀팁 제보: 학생이 보낸 팁은 팀이 확인한 뒤 게시물·카드뉴스로 올린다.
// 이 앱은 서버가 없어서, 공개 저장소 GitHub 이슈(「꿀팁 제보」)로 미리 채워 열어 준다 (GitHub 로그인 필요)
const TIP_REPO = 'https://github.com/kth4778/knut-campus-guide/issues/new';
const TIP_ACCOUNTS = ['학사·장학 팁', '생활·주거 팁', '교통 팁', '식사 팁'];
function tipPage(params) {
  const pick = TIP_ACCOUNTS.includes(params.get('account')) ? params.get('account') : TIP_ACCOUNTS[0];
  return `${top('꿀팁 제보',iconLink('back','뒤로',placeBack))}
    <main class="scroll compose">
      <form id="tip-form" class="compose-form">
        <p class="tip-lead">선배·동기만 아는 학교 꿀팁을 알려 주세요. 팀이 확인한 뒤 카드뉴스로 올려요.</p>
        <fieldset class="cat-pick"><legend>어느 계정에 올릴까요</legend>
          <div>${TIP_ACCOUNTS.map(name => `<label><input type="radio" name="account" value="${name}" ${name === pick ? 'checked' : ''}><span>${name}</span></label>`).join('')}</div>
        </fieldset>
        <label class="field"><span>제목</span><input name="title" placeholder="예: 휴학 신청하는 법" required maxlength="40"></label>
        <label class="field"><span>내용</span><textarea name="body" placeholder="언제·어디서·어떻게를 적어 주세요" required maxlength="500"></textarea></label>
        <label class="field"><span>어디서 알게 됐나요 (선택)</span><input name="source" placeholder="예: 학교 홈페이지 공지, 직접 겪음" maxlength="80"></label>
        <label class="tip-agree"><input type="checkbox" name="agree" required><span>이름·연락처·학번 같은 개인정보는 적지 않았어요. 앱에 소개되는 것에 동의해요.</span></label>
        <p class="compose-note">보내기를 누르면 GitHub 「꿀팁 제보」 창이 열려요. 거기서 한 번 더 제출해 주세요.</p>
        <button class="primary compose-submit" type="submit">보내기</button>
      </form>
    </main>`;
}

app.addEventListener('submit', event => {
  const form = event.target;
  if (form.id !== 'tip-form') return;
  event.preventDefault();
  const f = new FormData(form);
  const body = `### 계정\n${f.get('account')}\n\n### 내용\n${f.get('body').trim()}\n\n### 출처\n${(f.get('source') || '').trim() || '(적지 않음)'}\n\n— KNUTIPS 앱 꿀팁 제보`;
  const url = `${TIP_REPO}?${new URLSearchParams({title:`[꿀팁 제보] ${f.get('title').trim()}`, body, labels:'꿀팁 제보'})}`;
  window.open(url, '_blank', 'noopener');
  toast('GitHub 창에서 제출하면 접수돼요. 고마워요!');
});

// 새 게시물: 고른 사진 미리보기, 내용 글자 수
app.addEventListener('change', event => {
  const input = event.target;
  if (!input.classList?.contains('photo-input')) return;
  const drop = input.closest('.photo-drop'), img = drop.querySelector('.photo-preview'), file = input.files?.[0];
  if (img.src) URL.revokeObjectURL(img.src);
  img.hidden = !file;
  drop.classList.toggle('has-photo', !!file);
  if (file) img.src = URL.createObjectURL(file); else img.removeAttribute('src');
});
app.addEventListener('input', event => {
  const field = event.target;
  if (field.name === 'caption' && field.form?.id === 'compose-form') field.form.querySelector('.count').textContent = `${field.value.length}/500`;
});

function findPost(id) {
  return byId.get(id) ?? localPosts.find(post => post.id===id);
}

function localPostPage(post) {
  const content = post ? feedPost(post) : '<div class="empty">게시물을 찾을 수 없어요.</div>';
  return `${top('게시물',iconLink('back','뒤로',placeBack))}<main class="scroll">${content}</main>`;
}

// ---------- 댓글 (인스타그램처럼) ----------
// 아래에서 올라오는 창: 맨 위 손잡이 + 「댓글」, 댓글마다 이름·시간·내용·「답글 달기」·오른쪽 하트, 답글은 들여쓰기,
// 맨 아래 이모지 한 줄 + 내 프로필 + 입력칸 + 「게시」. 달아도 창은 열린 채로 바로 목록에 붙는다
const QUICK_EMOJI = ['❤️', '🙌', '🔥', '👏', '😢', '😍', '😮', '😂'];
function ago(at) {
  if (!at) return '';
  const m = Math.floor((Date.now() - at) / 60000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분`;
  if (m < 1440) return `${Math.floor(m / 60)}시간`;
  if (m < 10080) return `${Math.floor(m / 1440)}일`;
  return `${Math.floor(m / 10080)}주`;
}
function commentPreview(postId) {
  const list = (comments[postId] ?? []).filter(c => !c.replyTo).slice(-2);
  return list.length ? `<div class="comment-preview">${list.map(c => `<p><strong>${escape(profile.name)}</strong> ${escape(c.text)}</p>`).join('')}</div>` : '';
}
function commentItem(c, reply = false) {
  return `<div class="cm${reply ? ' reply' : ''}" data-cid="${escape(c.id)}">
    ${brandAvatar()}
    <div class="cm-body">
      <p><strong>${escape(profile.name)}</strong> <small>${ago(c.at)}</small></p>
      <p class="cm-text">${escape(c.text)}</p>
      <div class="cm-tools"><button type="button" data-cm="reply">답글 달기</button><button type="button" data-cm="delete">삭제</button></div>
    </div>
    <button type="button" class="cm-like" data-cm="like" aria-pressed="${!!c.liked}" aria-label="${c.liked ? '좋아요 취소' : '댓글 좋아요'}">${icon(c.liked ? 'heartFilled' : 'heart')}${c.liked ? '<span>1</span>' : ''}</button>
  </div>`;
}
function commentListHtml(postId) {
  const list = comments[postId] ?? [];
  if (!list.length) return '<div class="cm-empty"><strong>아직 댓글이 없습니다.</strong><span>댓글을 남겨 보세요.</span></div>';
  return list.filter(c => !c.replyTo).map(c => commentItem(c) + list.filter(r => r.replyTo === c.id).map(r => commentItem(r, true)).join('')).join('');
}
function refreshCommentCount(postId) {
  const n = comments[postId]?.length ?? 0;
  app.querySelectorAll(`.post-caption button[data-action="comments"][data-id="${CSS.escape(postId)}"]`).forEach(b => {
    b.textContent = n ? `댓글 ${n}개 모두 보기` : '댓글 달기…';
    b.parentElement.querySelector('.comment-preview')?.remove();
    b.insertAdjacentHTML('afterend', commentPreview(postId));
  });
}

function openComments(id) {
  if (!findPost(id)) return;
  app.querySelector('dialog.comment-sheet.comments')?.close();
  const dialog = document.createElement('dialog');
  dialog.className = 'comment-sheet comments';
  dialog.innerHTML = `<span class="share-grip" aria-hidden="true"></span>
    <h2 class="cm-title">댓글</h2>
    <div class="comment-list">${commentListHtml(id)}</div>
    <div class="cm-compose">
      <div class="cm-replying" hidden><span></span><button type="button" data-cm="cancel-reply" aria-label="답글 취소">${icon('close')}</button></div>
      <div class="cm-emoji">${QUICK_EMOJI.map(e => `<button type="button" data-emoji="${e}">${e}</button>`).join('')}</div>
      <form id="comment-form" data-id="${escape(id)}">${brandAvatar()}<input name="text" aria-label="댓글 입력" placeholder="${escape(profile.name)}(으)로 댓글 달기..." required maxlength="300" autocomplete="off"><button type="submit" disabled>게시</button></form>
    </div>`;
  app.append(dialog);
  const form = dialog.querySelector('form'), input = form.text, send = form.querySelector('button[type="submit"]');
  const sync = () => { send.disabled = !input.value.trim(); };
  input.addEventListener('input', sync);
  dialog.addEventListener('close', () => dialog.remove());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) { dialog.close(); return; }
    const emoji = event.target.closest('[data-emoji]')?.dataset.emoji;
    if (emoji) { input.value += emoji; sync(); input.focus(); return; }
    const act = event.target.closest('[data-cm]')?.dataset.cm;
    if (!act) return;
    if (act === 'cancel-reply') { delete form.dataset.reply; dialog.querySelector('.cm-replying').hidden = true; return; }
    const cid = event.target.closest('[data-cid]')?.dataset.cid;
    const list = comments[id] ?? [], c = list.find(x => x.id === cid);
    if (!c) return;
    if (act === 'like') { c.liked = !c.liked; saveComments(); dialog.querySelector('.comment-list').innerHTML = commentListHtml(id); return; }
    if (act === 'reply') {
      form.dataset.reply = c.replyTo || c.id; // 답글의 답글은 같은 줄기에 붙는다 (인스타처럼 한 단계만)
      const bar = dialog.querySelector('.cm-replying');
      bar.querySelector('span').textContent = `${profile.name}님에게 답글 남기는 중`;
      bar.hidden = false;
      input.value = `@${profile.name} `; sync(); input.focus();
      return;
    }
    if (act === 'delete') {
      comments[id] = list.filter(x => x.id !== cid && x.replyTo !== cid);
      saveComments();
      dialog.querySelector('.comment-list').innerHTML = commentListHtml(id);
      refreshCommentCount(id);
    }
  });
  dialog.showModal();
  setTimeout(() => input.focus({preventScroll:true}), 60);
}

// 아래에서 올라오는 시트. mount(body)가 돌려준 정리 함수는 닫힐 때 불러요.
function openSheet(title, mount) {
  app.querySelector('dialog.transit-sheet')?.close();
  const dialog = document.createElement('dialog');
  dialog.className = 'comment-sheet transit-sheet';
  dialog.innerHTML = `<div class="sheet-top"><h2>${escape(title)}</h2>${button('close','닫기','close-sheet')}</div><div class="sheet-body"></div>`;
  app.append(dialog);
  const cleanup = mount(dialog.querySelector('.sheet-body')) || (() => {});
  dialog.addEventListener('close', () => { cleanup(); dialog.remove(); });
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.showModal();
  return dialog;
}

function openBusSheet(stop) {
  openSheet(stop.name, body => mountBusStop(body, stop, {onLive:showLiveRoute}));
}

function openExpressSheet(terminal) {
  // 충주터미널은 학교에서 멀어서 택시 같이 타기를 바로 모집할 수 있게 해요.
  const extra = terminal.code === '420' ? '<button type="button" class="primary moa-taxi" data-action="moa-taxi">🚕 터미널까지 택시 같이 타기</button>' : '';
  openSheet(terminal.name, body => mountExpress(body, terminal, {extra}));
}

function placePage(place) {
  if (!place) return `${top('장소 정보',iconLink('back','뒤로',placeBack))}<main class="scroll empty">등록된 장소를 찾을 수 없어요.</main>`;
  const address = place.address && !['확인 안 됨','해당 없음'].includes(place.address) ? place.address : '';
  const externalMap = safeUrl(place.map);
  const official = safeUrl(place.officialInfo?.page);
  const price = value => Number.isFinite(value) ? `${value.toLocaleString('ko-KR')}원` : '';
  const menus = (place.menus ?? []).map(item => {
    const min = price(item.min);
    const max = price(item.max);
    return `<li>${escape(item.name)}${min?' · '+min+(max&&max!==min?'~'+max:''):max?' · '+max:''}</li>`;
  }).join('');
  const renderSection = (title, lines) => lines.length
    ? `<section><h2>${title}</h2><ul>${lines.map(line => `<li>${escape(line)}</li>`).join('')}</ul></section>` : '';
  return `${top('장소 정보',iconLink('back','뒤로',placeBack),saveButton(place))}
    <main class="scroll"><div class="detail-post">${feedPost(place)}</div><div class="detail-body">
      <div class="detail-title">${placeIcon(place.category)}<div><p>${escape(place.category)} · ${escape(place.area)}</p><h1>${escape(place.name)}</h1></div></div>
      ${address?`<p>${escape(address)}</p>`:''}
      ${place.location.note?`<p>${escape(place.location.note)}</p>`:''}
      <div class="detail-actions">
        ${place.latlng?`<a class="primary" href="${escape(route('map',{focus:place.id}))}">${icon('pin')} 지도에서 보기</a>`:''}
        ${externalMap?`<a class="pill" href="${externalMap}" target="_blank" rel="noopener">네이버 지도</a>`:''}
        ${official?`<a class="pill" href="${official}" target="_blank" rel="noopener">학교 공식 안내</a>`:''}
      </div>
      ${renderSection('가이드 정보', place.reasons ?? [])}
      ${renderSection(escape(place.officialInfo?.title || '학교 안내'), place.officialInfo?.lines ?? [])}
      ${menus ? `<section><h2>메뉴</h2><ul>${menus}</ul></section>` : ''}
      ${renderSection('운영 정보', (place.hours ?? []).map(hours => hours.raw).filter(Boolean))}
      ${place.checked&&place.checked!=='확인 안 됨'?`<p>기존 가이드 확인일 ${escape(place.checked)}</p>`:''}
    </div></main>`;
}

function mapPage() {
  return `${top('캠퍼스 지도',iconLink('search','지도에서 찾을 장소 검색',route('search')),iconLink('bookmark','저장한 장소',route('my')))}
    <div class="chips map-chips" aria-label="지도 카테고리">
      ${mapCategories.map(name=>`<button class="chip${transitCategories.includes(name)?' transit-chip':name==='교통대 제휴'?' partner-chip':''}" data-action="map-category" data-category="${escape(name)}" aria-pressed="${name===mapCategory}">${name==='전체'?'건물':name}</button>`).join('')}
    </div>
    <div id="live-row" class="chips live-row" aria-label="실시간 버스 노선" hidden></div>
    <main class="map-panel" aria-label="장소 지도">
      <div id="map-canvas" class="map-canvas"></div>
      <button class="ib map-reset" type="button" data-action="campus" aria-label="캠퍼스 중심으로">${icon('target')}</button>
    </main>
    <div id="map-result" class="map-result" aria-live="polite"></div>`;
}

// 지도 핀 그림 (assets/pins/*.webp, gpt-image 로 만든 네이버 지도식 물방울 핀)
const PIN = {'맛집':'food', '숨은장소':'spot', '생활꿀팁':'tip', '자유':'free'};
const pinImg = category => `<img class="poi-pin" src="assets/pins/${PIN[category] || 'building'}.webp" alt="">`;

// 장소 핀: 물방울 핀 + (자리가 나면) 아래에 이름. 같은 자리 여러 곳이면 오른쪽 위에 개수
function markerHtml(place, selected, count, label = '') {
  return `<span class="marker poi${selected?' selected':''}" data-cat="${escape(place.category)}">${pinImg(place.category)}`
    + `${count>1 ? `<span class="marker-count">${count}</span>` : ''}${label ? `<em class="poi-label">${escape(label)}</em>` : ''}</span>`;
}

// 핀 이름표가 서로 겹치지 않게: 화면 좌표 칸을 먼저 잡은 쪽이 이름을 단다 (네이버 지도처럼 겹치면 이름만 뺀다)
let labelSpace = [];
function claimLabel(latlng, text, force = false) {
  const [x, y] = toPixel(latlng);
  const w = Math.min(text.length, 11) * 11 + 10;
  const rect = [x - w / 2, y - 2, x + w / 2, y + 18];
  const free = !labelSpace.some(r => rect[0] < r[2] && rect[2] > r[0] && rect[1] < r[3] && rect[3] > r[1]);
  labelSpace.push([x - 13, y - 34, x + 13, y]); // 핀 자리
  if (!free && !force) return '';
  labelSpace.push(rect);
  return text.length > 11 ? text.slice(0, 10) + '…' : text;
}

function showMapResult(place) {
  const result = document.getElementById('map-result');
  if (!place) {
    if (mapCategory === '고속버스') {
      result.innerHTML = `<p>교통대 정류소·충주터미널 · 누르면 서울행 시간표와 요금이 나와요.</p>`;
      return;
    }
    if (mapCategory === '버스') {
      result.innerHTML = `<p>정류장 ${BUS_STOPS.length}곳 · 정류장을 누르면 실시간 도착 정보가 나와요.</p>`;
      return;
    }
    if (mapCategory === '교통대 제휴') {
      result.innerHTML = mapPartners ? `<p>제휴 매장 ${mapPartners.length}곳 · 핀을 누르면 혜택을 볼 수 있어요.</p>` : '<p>제휴 매장을 불러오는 중…</p>';
      return;
    }
    if (mapCategory === '전체') {
      result.innerHTML = `<p>교내 건물 ${mapBuildings().length}곳 · 건물을 누르면 층별 안내가 나와요. 장소는 위 칩에서 골라 보세요.</p>`;
      return;
    }
    const count = mappedPlaces.filter(item => item.category===mapCategory).length;
    result.innerHTML = `<p>${count}개 위치 · 핀을 눌러 장소를 확인하세요.</p>`;
    return;
  }
  result.innerHTML = mapPlaceCard(place);
}

// 핀을 누르면 아래에 뜨는 장소 카드 (네이버 지도 장소 카드처럼: 이름·분류 → 위치 → 주소 → 상세·길찾기·저장·공유)
function mapPlaceCard(place) {
  const floor = floorOf(place);
  const building = place.location?.building?.trim();
  const where = [place.area, building && `${building}${floor ? ` ${floor < 0 ? `지하 ${-floor}` : floor}층` : ''}`].filter(Boolean).join(' · ');
  const address = place.address && !['확인 안 됨','해당 없음'].includes(place.address) ? place.address : '';
  const external = safeUrl(place.map);
  const on = saved.has(place.id);
  const action = (img, label, attrs) => `<${attrs.startsWith('href') ? 'a' : 'button type="button"'} class="mc-btn" ${attrs}><img src="assets/actions/${img}.webp" alt="" width="40" height="40"><span>${label}</span></${attrs.startsWith('href') ? 'a' : 'button'}>`;
  return `<article class="map-card" data-cat="${escape(place.category)}">
    <a class="mc-head" href="${escape(route('place', {id:place.id}))}"><b>${escape(place.name)}</b><span class="mc-cat">${escape(place.category)}</span></a>
    ${where ? `<p class="mc-where">${escape(where)}</p>` : ''}
    ${address ? `<p class="mc-addr">${escape(address)}</p>` : ''}
    ${place.location?.note ? `<p class="mc-note">${escape(place.location.note)}</p>` : ''}
    <div class="mc-actions">
      ${action('detail', '상세보기', `href="${escape(route('place', {id:place.id}))}"`)}
      ${external ? action('route', '네이버 지도', `href="${escape(external)}" target="_blank" rel="noopener"`) : ''}
      ${action('save', on ? '저장됨' : '저장', `data-action="map-save" data-id="${place.id}" aria-pressed="${on}"`)}
      ${action('share', '공유', `data-action="copy" data-id="${place.id}"`)}
    </div>
  </article>`;
}

// 같은 자리 여러 곳: 네이버 지도의 목록 말풍선처럼 핀 그림 + 이름 + 분류
function mapGroupPopup(group) {
  const popup = document.createElement('div');
  popup.className = 'map-popup';
  popup.innerHTML = `<p class="map-popup-head">이 자리 ${group.length}곳</p>` + group.map(place =>
    `<a href="${route('map', {focus:place.id})}">${pinImg(place.category)}<span><b>${escape(place.name)}</b><small>${escape(place.category)} · ${escape(place.area || '')}</small></span><i aria-hidden="true">›</i></a>`).join('');
  return popup;
}

function clearMarkers() {
  if (usingNaver) {
    mapMarkers.forEach(marker => marker.setMap(null));
    mapMarkers = [];
    naverInfo.close();
  } else mapMarkers.clearLayers();
}

function addLeafletMarker(group, place, selected, name) {
  const label = claimLabel(place.latlng, place.name, selected);
  const marker = L.marker(place.latlng, {
    title:name, alt:name, zIndexOffset:selected?1000:0, riseOnHover:true,
    icon:L.divIcon({className:'guide-pin',html:markerHtml(place,selected,group.length,label),iconSize:[26,26],iconAnchor:[13,13]}),
  }).addTo(mapMarkers);
  if (group.length>1) marker.bindPopup(() => mapGroupPopup(group), {offset:[0,-24], className:'kt-popup', closeButton:false});
  else marker.on('click', () => { location.hash = route('map',{focus:place.id}); });
}

function addNaverMarker(group, place, selected, name) {
  const {maps} = window.naver;
  const label = claimLabel(place.latlng, place.name, selected);
  const marker = new maps.Marker({
    map, position:new maps.LatLng(...place.latlng), title:name, zIndex:selected?1000:0,
    icon:{content:markerHtml(place,selected,group.length,label), anchor:new maps.Point(13,13)},
  });
  maps.Event.addListener(marker, 'click', () => {
    if (group.length>1) {
      naverInfo.setContent(mapGroupPopup(group));
      naverInfo.open(map, marker);
    } else location.hash = route('map',{focus:place.id});
  });
  mapMarkers.push(marker);
}

// 장소가 아닌 점(정류장 등)을 지도에 올려요.
function addPoint(latlng, html, title, onClick, zIndex = 500) {
  if (usingNaver) {
    const {maps} = window.naver;
    const marker = new maps.Marker({map, position:new maps.LatLng(...latlng), title, zIndex, icon:{content:html, anchor:new maps.Point(13,13)}});
    maps.Event.addListener(marker, 'click', onClick);
    mapMarkers.push(marker);
    return;
  }
  L.marker(latlng, {title, alt:title, zIndexOffset:zIndex, riseOnHover:true,
    icon:L.divIcon({className:'guide-pin', html, iconSize:[26,26], iconAnchor:[13,13]}),
  }).on('click', onClick).addTo(mapMarkers);
}

function paintTransit() {
  if (mapCategory === '교통대 제휴') {
    for (const partner of mapPartners ?? []) {
      addPoint(partner.latlng, '<span class="marker transit-marker partner"><img class="poi-pin" src="assets/pins/partner.webp" alt=""></span>', partner.name,
        () => { location.hash = route('partner', {id:partner.id}); }, 400);
    }
    return;
  }
  // 버스 정류장·고속버스 핀은 그 칩을 골랐을 때만 (「전체」가 난잡해지지 않게)
  if (mapCategory === '고속버스') {
    for (const terminal of EXP_TERMINALS) {
      addPoint(terminal.latlng, `<span class="marker transit-marker exp"><img class="poi-pin" src="assets/pins/express.webp" alt=""><em class="poi-label">${escape(terminal.name)}</em></span>`, terminal.name, () => openExpressSheet(terminal), 900);
    }
  }
  if (mapCategory !== '버스') return;
  for (const stop of BUS_STOPS) {
    addPoint(stop.latlng, `<span class="marker transit-marker bus"><img class="poi-pin" src="assets/pins/bus.webp" alt=""></span>`, stop.name, () => openBusSheet(stop), 300);
  }
  if (!live.on) return;
  for (const bus of live.buses) {
    addPoint(bus.latlng, `<span class="live-bus" style="background:${liveColor(bus.no)}">${escape(bus.no)}</span>`,
      `${bus.no}번 버스`, () => openSheet(`${bus.no}번 버스`, body => { body.innerHTML = liveBusInfo(bus, liveEvery(live.picked.size) / 1000); }), 1100);
  }
}

function renderLiveRow() {
  const row = document.getElementById('live-row');
  if (!row) return;
  row.hidden = !live.on;
  if (!live.on) return;
  const time = live.last ? [live.last.getHours(), live.last.getMinutes(), live.last.getSeconds()].map(n => String(n).padStart(2,'0')).join(':') : '';
  const status = !busKey() ? 'config.js 에 버스 API 키가 필요해요'
    : live.error ? live.error
    : live.index ? `실시간 ${live.buses.length}대${time ? ' · ' + time : ''}` : '노선 불러오는 중…';
  const numbers = live.index ? Object.keys(live.index).sort(routeSort) : [];
  row.innerHTML = `<span class="live-status">${live.error || !busKey() ? '' : '<i></i>'}${escape(status)}</span>`
    + numbers.map(no => {
      const on = live.picked.has(no);
      return `<button class="chip" data-action="live-route" data-no="${escape(no)}" aria-pressed="${on}" ${on?`style="background:${liveColor(no)};color:#fff"`:''}>${escape(no)}</button>`;
    }).join('');
}

async function livePoll() {
  if (!live.on || !live.index || !busKey()) return;
  const {buses, error} = await liveBuses([...live.picked], live.index);
  if (!live.on) return;
  Object.assign(live, {buses, error, last:new Date()});
  if (map) paintMarkers();
  renderLiveRow();
}

async function liveStart() {
  if (live.on) return;
  live.on = true;
  renderLiveRow();
  if (!busKey()) return;
  try { live.index = await routeIndex(); }
  catch { live.error = '노선 목록을 못 불러왔어요'; }
  if (!live.on) return;
  renderLiveRow();
  livePoll();
  // 고른 노선 수에 따라 간격이 바뀌므로 매번 다음 간격을 새로 정한다 (1~2개 10초, 3~4개 20초)
  const tick = () => { live.timer = setTimeout(() => { if (!document.hidden) livePoll(); if (live.on) tick(); }, liveEvery(live.picked.size)); };
  tick();
}

function liveStop() {
  live.on = false;
  live.buses = [];
  clearTimeout(live.timer);
  renderLiveRow();
}

function toggleLiveRoute(no) {
  if (live.picked.has(no)) live.picked.delete(no);
  else {
    if (live.picked.size >= LIVE_MAX) { toast(`노선은 ${LIVE_MAX}개까지 고를 수 있어요.`); return; }
    live.picked.add(no);
  }
  try { writeLocal('liveRoutes', [...live.picked]); } catch {}
  live.buses = live.buses.filter(bus => live.picked.has(bus.no));
  if (map) paintMarkers();
  renderLiveRow();
  livePoll();
}

// 정류장 도착 목록의 '위치' 버튼: 그 노선을 골라서 지도에 띄워요.
function showLiveRoute(no) {
  if (!live.picked.has(no)) {
    if (live.picked.size >= LIVE_MAX) live.picked.delete([...live.picked][0]);
    live.picked.add(no);
    try { writeLocal('liveRoutes', [...live.picked]); } catch {}
  }
  app.querySelector('dialog.transit-sheet')?.close();
  toast(`${no}번 버스 위치를 보여줘요.`);
  if (mapCategory === '버스' && live.on) { renderLiveRow(); livePoll(); }
  else location.hash = route('map', {category:'버스'});
}

// 지도 단계별로 핀을 정리한다
// - 18단계 미만: 교내 장소는 건물 핀 하나로 묶는다(건물 이름 + 개수)
// - 그래도 화면에서 겹치는 핀(건물·학교 밖 장소)은 숫자 하나로 합치고, 누르면 그 자리로 확대
// - 18단계 이상: 장소 핀이 하나하나 펼쳐진다
const DETAIL_ZOOM = 18;
const CELL = 58; // 이 정도(px) 안에 모인 핀은 하나로 합친다
const mapZoom = () => map ? map.getZoom() : 15;

function toPixel(latlng) {
  if (usingNaver) {
    const point = map.getProjection().fromCoordToOffset(new window.naver.maps.LatLng(...latlng));
    return [point.x, point.y];
  }
  const point = map.project(latlng, map.getZoom());
  return [point.x, point.y];
}

function zoomInto(latlng, zoom) {
  if (usingNaver) map.morph(new window.naver.maps.LatLng(...latlng), zoom);
  else map.setView(latlng, zoom);
}

function paintOverview(shown, zoom) {
  // 1) 교내 장소 → 건물마다 하나
  const items = [], byBuilding = new Map();
  for (const place of shown) {
    if (place === focusedMapPlace) continue;
    const building = buildingOf(place);
    if (!building) { items.push({latlng:place.latlng, count:1, place}); continue; }
    if (!byBuilding.has(building)) {
      const item = {latlng:building.latlng, count:0, building};
      byBuilding.set(building, item);
      items.push(item);
    }
    byBuilding.get(building).count++;
  }
  // 2) 화면에서 가까운 것끼리 한 칸에 모은다
  const cells = new Map();
  for (const item of items) {
    const [x, y] = toPixel(item.latlng);
    const key = `${Math.floor(x / CELL)},${Math.floor(y / CELL)}`;
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key).push(item);
  }
  for (const list of cells.values()) {
    if (list.length === 1) {
      const [item] = list;
      if (item.building) addPoint(item.building.latlng, buildingPinHtml(item.building, item.count, zoom >= 16, pinImg(mapCategory)), item.building.name,
        () => { location.hash = route('building', {name:item.building.name}); }, 200);
      else (usingNaver ? addNaverMarker : addLeafletMarker)([item.place], item.place, false, item.place.name);
      continue;
    }
    const total = list.reduce((sum, item) => sum + item.count, 0);
    const center = [0, 1].map(k => list.reduce((sum, item) => sum + item.latlng[k] * item.count, 0) / total);
    addPoint(center, `<span class="marker cluster-pin">${pinImg(mapCategory)}<b>${total}</b></span>`, `${mapCategory} ${total}곳`,
      () => zoomInto(center, Math.min(DETAIL_ZOOM - 1, zoom + 2)), 100);
  }
  if (focusedMapPlace) (usingNaver ? addNaverMarker : addLeafletMarker)([focusedMapPlace], focusedMapPlace, true, focusedMapPlace.name);
}

// 지도 첫 화면(칩을 고르기 전): 장소는 숨기고 학교 건물만. 네이버 지도의 건물 이름표처럼
// 중요한 건물(안내·장소가 많은 곳)부터 자리를 잡고, 겹치면 이름을 빼고 코드만, 그래도 겹치면 작은 점으로 줄인다
function paintBuildings(zoom) {
  const placed = [];
  const fits = rect => !placed.some(r => rect[0] < r[2] && rect[2] > r[0] && rect[1] < r[3] && rect[3] > r[1]);
  const rectAt = ([x, y], w, h) => [x - w / 2 - 3, y - h / 2 - 3, x + w / 2 + 3, y + h / 2 + 3];
  const score = b => guideCount(b) + b.places.length * 2;
  if (focusedMapPlace) placed.push(rectAt(toPixel(focusedMapPlace.latlng), 44, 44)); // 고른 장소 핀 자리는 비워 둔다
  for (const building of mapBuildings().sort((a, b) => score(b) - score(a))) {
    const point = toPixel(building.latlng);
    const code = building.official.code.length;
    const sizes = [
      !usingNaver && zoom >= 16 && ['full', Math.max(shortName(building).length * 12, 40), 58], // 대체 지도엔 한글 건물 이름이 없어 직접 단다
      ['short', 30, 40],
      ['dot', 10, 10],
    ].filter(Boolean);
    const [size, w, h] = sizes.find(([, w, h]) => fits(rectAt(point, w, h))) || sizes.at(-1);
    placed.push(rectAt(point, w, h));
    addPoint(building.latlng, buildingMarkHtml(building, size), `${building.official.code} ${building.name}`,
      () => { location.hash = route('building', {name:building.name}); }, size === 'dot' ? 100 : 300 + score(building));
  }
  if (focusedMapPlace) (usingNaver ? addNaverMarker : addLeafletMarker)([focusedMapPlace], focusedMapPlace, true, focusedMapPlace.name);
}

function paintMarkers() {
  clearMarkers();
  labelSpace = [];
  if (map && focusedMapPlace) claimLabel(focusedMapPlace.latlng, focusedMapPlace.name, true); // 고른 장소 이름이 먼저
  paintTransit();
  if (mapOnlyCategories.includes(mapCategory) && !focusedMapPlace) return;
  const zoom = mapZoom();
  if (mapCategory === '전체') { paintBuildings(zoom); return; }
  const shown = mappedPlaces.filter(place => place.category === mapCategory || place === focusedMapPlace);
  if (zoom < DETAIL_ZOOM) { paintOverview(shown, zoom); return; }
  const groups = new Map();
  for (const place of shown) {
    const key = place.latlng.map(num => num.toFixed(5)).join(',');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(place);
  }
  for (const group of groups.values()) {
    const selected = group.includes(focusedMapPlace);
    const place = selected ? focusedMapPlace : group[0];
    const name = group.length===1 ? place.name : `${place.name} 외 ${group.length - 1}곳`;
    (usingNaver ? addNaverMarker : addLeafletMarker)(group, place, selected, name);
  }
}

function updateMap(focus, category) {
  mapCategory = category;
  focusedMapPlace = focus?.latlng ? focus : null;
  const buttons = app.querySelectorAll('[data-action="map-category"]');
  buttons.forEach(button => button.setAttribute('aria-pressed', button.dataset.category===category));
  // 고른 칩이 칩 줄 밖에 있으면 가운데로 끌어온다 (검색에서 「숨은장소」로 열렸을 때 등)
  const pressed = [...buttons].find(button => button.dataset.category===category);
  const row = pressed?.parentElement;
  if (row) row.scrollLeft = Math.max(0, pressed.offsetLeft - row.offsetLeft - (row.clientWidth - pressed.offsetWidth) / 2);
  showMapResult(focusedMapPlace);
  if (category === '버스') liveStart();
  else liveStop();
  if (!map) return;
  paintMarkers();
  // 고속버스는 충주터미널이 학교에서 멀어서 두 터미널이 다 보이게 넓혀요.
  const wide = !focusedMapPlace && category === '고속버스';
  const city = !focusedMapPlace && category === '교통대 제휴'; // 제휴 매장은 시내까지 퍼져 있어요
  if (city && !mapPartners) loadMapPartners().then(() => { if (mapCategory === '교통대 제휴') { showMapResult(null); if (map) paintMarkers(); } });
  const center = focusedMapPlace?.latlng ?? (wide ? [36.9725, 127.8925] : city ? [36.988, 127.905] : campus);
  const zoom = focusedMapPlace ? DETAIL_ZOOM : wide ? 13 : city ? 12 : category === '전체' ? 16 : 15; // 건물 이름표가 읽히게 한 단계 가깝게
  if (usingNaver) {
    map.setCenter(new window.naver.maps.LatLng(...center));
    map.setZoom(zoom);
    return;
  }
  map.invalidateSize({pan:false});
  map.closePopup();
  map.setView(center, zoom, {animate:false}); // 움직임 없이 바로 (움직이는 중에 화면을 떠나면 Leaflet 이 오류를 낸다)
}

function destroyMap() {
  if (!map) return;
  if (usingNaver) {
    clearMarkers();
    map.destroy();
  } else map.remove();
  map = null;
}

// 네이버 지도를 먼저 시도한다. SDK를 못 받거나 인증에 실패하면 Leaflet으로 그린다.
function loadNaverMaps() {
  if (!loadNaverMaps.ready) {
    // 등록 안 된 주소에서는 스크립트는 받아지고 이 함수만 불린다.
    window.navermap_authFailure = () => {
      naverFailed = true;
      if (currentView !== 'map' || !usingNaver) return;
      // 인증에 실패한 지도는 정리 중에 오류를 내기도 하고, 지도 칸에 실패 안내 배경을 남긴다.
      try { destroyMap(); } catch {}
      map = null;
      const canvas = document.getElementById('map-canvas');
      canvas.replaceWith(Object.assign(document.createElement('div'), {id:'map-canvas', className:'map-canvas'}));
      startLeaflet();
      updateMap(focusedMapPlace, mapCategory);
    };
    loadNaverMaps.ready = new Promise(resolve => {
      const script = document.createElement('script');
      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_MAP_ID}`;
      script.onload = resolve;
      script.onerror = resolve;
      setTimeout(resolve, 4000);
      document.head.append(script);
    });
  }
  return loadNaverMaps.ready;
}

function startNaver() {
  const {maps} = window.naver;
  usingNaver = true;
  map = new maps.Map('map-canvas', {
    center:new maps.LatLng(...campus), zoom:15, scaleControl:false, mapDataControl:false,
    // 아래쪽엔 유리 카드·탭 바가 떠 있어서 로고는 위 왼쪽, 확대 버튼은 오른쪽 가운데로
    logoControlOptions:{position:maps.Position.TOP_LEFT},
    zoomControl:true, zoomControlOptions:{position:maps.Position.RIGHT_CENTER, style:maps.ZoomControlStyle.SMALL},
  });
  mapMarkers = [];
  naverInfo = new maps.InfoWindow({borderWidth:0, backgroundColor:'transparent', disableAnchor:true, pixelOffset:new maps.Point(0,-30)}); // 말풍선 모양은 .map-popup 이 그린다
  maps.Event.addListener(map, 'click', () => naverInfo.close());
  maps.Event.addListener(map, 'zoom_changed', () => { if (map) paintMarkers(); }); // 확대·축소하면 묶음을 다시 계산
}

function startLeaflet() {
  usingNaver = false;
  if (!window.L) {
    document.getElementById('map-canvas').innerHTML = '<div class="empty"><p>지도를 불러오지 못했어요.</p><a class="primary" href="#/search">장소 검색</a></div>';
    return;
  }
  map = L.map('map-canvas',{zoomControl:false,scrollWheelZoom:true,attributionControl:false}).setView(campus,mapCategory === '전체' ? 16 : 15); // 처음부터 건물 보기 높이로 (확대 움직임 없이)
  L.control.attribution({position:'topleft', prefix:false}).addTo(map); // 아래쪽은 유리 카드·탭 바에 가려서 위로
  L.control.zoom({position:'topright',zoomInTitle:'확대',zoomOutTitle:'축소'}).addTo(map);
  const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom:19,
    attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>',
  }).addTo(map);
  tiles.on('tileerror', () => toast('배경 지도 연결이 지연되고 있어요.'));
  mapMarkers = L.layerGroup().addTo(map);
  map.on('zoomend', () => { if (map) paintMarkers(); }); // 확대·축소하면 묶음을 다시 계산
}

function bindMap(focus, category) {
  updateMap(focus, category);
  loadNaverMaps().then(() => {
    if (currentView !== 'map' || map) return;
    if (window.naver?.maps && !naverFailed) startNaver();
    else startLeaflet();
    updateMap(focusedMapPlace, mapCategory);
  });
}

function render() {
  const [path, params] = readRoute();
  const requested = params.get('category');
  const place = byId.get(params.get(path==='map'?'focus':'id'));
  // 검색에서 장소를 골라 지도로 오면 그 장소의 칩(맛집 등)으로 열어 같은 종류 장소도 함께 보여 준다
  const category = categoryInfo.has(requested) || (path==='map' && mapOnlyCategories.includes(requested)) ? requested
    : path==='map' && place?.latlng && categoryInfo.has(place.category) ? place.category : '전체';
  if (path==='map' && currentView==='map' && map) {
    updateMap(place, category);
    return;
  }
  destroyMap();
  liveStop();
  app.querySelector('dialog.transit-sheet')?.close();
  if (path !== currentView) {
    homeLimit = 16;
    searchLimit = 35;
  }
  const viewKey = `${path}|${params.get('name') || params.get('id') || ''}`;
  const keepScroll = viewKey === lastViewKey ? app.querySelector('.scroll')?.scrollTop : null;
  lastViewKey = viewKey;
  currentView = path;
  if (path === 'map') {
    app.innerHTML = mapPage();
    bindMap(place, category);
  } else if (path === 'search') app.innerHTML = searchPage();
  else if (path === 'moa') app.innerHTML = moaPage(top('MOA', iconLink('back','홈으로',route(''))), params);
  else if (path === 'moa-chat') app.innerHTML = moaChatPage(fundById(params.get('id')), title => top(title, iconLink('back','채팅방 목록',route('moa',{tab:'chat'}))), route);
  else if (path === 'my') {
    profileTab = params.get('tab')==='saved' ? 'saved' : 'posts';
    app.innerHTML = savedPage();
  } else if (path === 'chat') {
    app.innerHTML = chatPage(top('누티 Nuti', iconLink('back','프로필로',route('my'))));
    scrollChat(app);
  } else if (path === 'meal-room') {
    app.innerHTML = mealRoomPage(top('밥약속 채팅', iconLink('back','누티로',route('chat'))));
    mountMealRoom(app, params.get('id'));
  } else if (path === 'settings') app.innerHTML = settingsPage();
  else if (path === 'profile-edit') app.innerHTML = profileEditPage();
  else if (path === 'compose') app.innerHTML = composePage();
  else if (path === 'tip') app.innerHTML = tipPage(params);
  else if (path === 'post') app.innerHTML = localPostPage(findPost(params.get('id')));
  else if (path === 'place') app.innerHTML = placePage(place);
  else if (path === 'account') app.innerHTML = accountPage(params.get('id'), params);
  else if (path === 'partner') app.innerHTML = partnerPage(params.get('id'));
  else if (path === 'building') app.innerHTML = buildingPage(params.get('name'), params);
  else app.innerHTML = home(category);
  if (keepScroll) { const scroller = app.querySelector('.scroll'); if (scroller) scroller.scrollTop = keepScroll; }
  renderNav(path === 'building' ? 'map' : ['place','account','partner','tip'].includes(path) ? '' : ['settings','chat','meal-room','profile-edit'].includes(path) ? 'my' : path === 'moa-chat' ? 'moa' : path);
}

function toast(message) {
  const element = document.getElementById('toast');
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('show'), 1800);
}

function toggleSave(id) {
  const post = findPost(id);
  if (!post) return;
  if (saved.has(id)) saved.delete(id);
  else saved.add(id);
  try { localStorage.setItem(saveKey,JSON.stringify([...saved])); } catch {}
  if (currentView==='my') render();
  else app.querySelectorAll(`[data-action="save"][data-id="${id}"]`).forEach(el => {
    const template = document.createElement('template');
    template.innerHTML = saveButton(post);
    const fresh = template.content.firstElementChild;
    el.innerHTML = fresh.innerHTML;
    el.setAttribute('aria-label',fresh.getAttribute('aria-label'));
    el.setAttribute('aria-pressed',fresh.getAttribute('aria-pressed'));
  });
  toast(saved.has(id)?'장소를 저장했어요.':'저장을 취소했어요.');
}

app.addEventListener('input', event => {
  if (event.target.id !== 'place-search') return;
  searchQuery = event.target.value;
  searchLimit = 35;
  document.getElementById('search-results').innerHTML = searchResults();
});

app.addEventListener('click', event => {
  const control = event.target.closest('[data-action]');
  if (!control) return;
  switch (control.dataset.action) {
    case 'save': toggleSave(control.dataset.id); break;
    case 'caption-more': // 인스타처럼 그 자리에서 글 전체를 펼친다
      control.previousElementSibling?.classList.add('open');
      control.remove();
      break;
    case 'post-menu': openPostMenu(control); break;
    case 'card-step': {
      const track = control.closest('.card-carousel').querySelector('.card-track');
      track.scrollBy({left:track.clientWidth * Number(control.dataset.step), behavior:'smooth'});
      break;
    }
    case 'map-save':
      toggleSave(control.dataset.id);
      control.setAttribute('aria-pressed', saved.has(control.dataset.id));
      control.querySelector('span').textContent = saved.has(control.dataset.id) ? '저장됨' : '저장';
      break;
    case 'like': {
      const id = control.dataset.id;
      if (likes.has(id)) likes.delete(id);
      else likes.add(id);
      try { writeLocal('likes',[...likes]); } catch {}
      control.innerHTML = icon(likes.has(id)?'heartFilled':'heart');
      control.setAttribute('aria-label',likes.has(id)?'좋아요 취소':'좋아요');
      control.setAttribute('aria-pressed',likes.has(id));
      updateLikeCount(id);
      break;
    }
    case 'comments': openComments(control.dataset.id); break;
    case 'reset-data': resetData(); break;
    case 'close-comments':
    case 'close-sheet': control.closest('dialog').close(); break;
    case 'copy': {
      // 갤럭시 「공유」처럼 카카오톡·메일·메시지·링크 복사… 가 있는 창을 띄운다 (share.js)
      const post = findPost(control.dataset.id);
      const url = new URL(route('place',{id:control.dataset.id}),location.href).href;
      openShare(app, {title:post ? `${post.name} · KNUTIPS` : 'KNUTIPS', text:post?.reasons?.[0] ?? '', url});
      break;
    }
    case 'clear-search':
      searchQuery='';
      searchLimit=35;
      document.getElementById('place-search').value='';
      document.getElementById('search-results').innerHTML=searchResults();
      document.getElementById('place-search').focus({preventScroll:true});
      break;
    case 'map-category':
      location.hash=route('map',control.dataset.category==='전체'?{}:{category:control.dataset.category});
      break;
    case 'live-route': toggleLiveRoute(control.dataset.no); break;
    case 'moa-taxi':
      control.closest('dialog').close();
      // 화면이 MOA로 바뀐 뒤에 모집 창을 열어요 (먼저 열면 화면을 다시 그릴 때 사라져요)
      window.addEventListener('hashchange', () => openNewFund(toast, {type:'taxi', place:'정문', dest:'충주터미널', title:'충주터미널 같이 가요'}), {once:true});
      location.hash = route('moa');
      break;
    case 'campus':
      updateMap(null,mapCategory);
      history.replaceState(history.state,'',route('map',mapCategory==='전체'?{}:{category:mapCategory}));
      break;
  }
});

function updateLikeCount(id) {
  const post = findPost(id);
  app.querySelectorAll(`[data-likes="${id}"]`).forEach(line => {
    const n = post ? likeCount(post) : (likes.has(id) ? 1 : 0);
    line.textContent = `추천 ${n}개`;
    line.hidden = !n;
  });
}

// 홈 맨 위에서 아래로 끌어내리면 새로고침 (인스타처럼). 손가락·마우스 모두.
// 끌수록 맨 위에 도는 표시가 커지고, 64px 넘게 끌고 놓으면 피드 순서를 새로 섞어 다시 그린다
let pull = null;
const PULL_AREA = 'main.scroll[aria-label="홈"], main#search-results';
const pullBox = () => app.querySelector('main.scroll[aria-label="홈"] .ptr, main#search-results .ptr');
function pullStart(x, y, target) {
  const scroller = target.closest?.(PULL_AREA);
  if (scroller?.id === 'search-results' && searchQuery.trim()) return; // 검색 결과 목록은 그대로
  if (!scroller || scroller.scrollTop > 0 || target.closest('.card-track, .story-rail, dialog, input, textarea')) return;
  pull = {x, y, d:0, active:false, scroller};
}
function pullMove(x, y, event) {
  if (!pull) return;
  const dy = y - pull.y, dx = Math.abs(x - pull.x);
  if (!pull.active) {
    if (dy < 8 || dx > dy || pull.scroller.scrollTop > 0) { if (dy < -4 || dx > 12) pull = null; return; }
    pull.active = true;
    pullBox()?.classList.add('dragging');
  }
  if (event.cancelable) event.preventDefault();
  pull.d = Math.min(90, Math.max(0, dy * 0.5));
  const box = pullBox();
  if (box) { box.style.height = `${pull.d}px`; box.style.setProperty('--turn', `${pull.d * 4}deg`); box.classList.toggle('ready', pull.d >= 64); }
}
function pullEnd() {
  if (!pull) return;
  const {active, d} = pull;
  pull = null;
  const box = pullBox();
  if (!box || !active) return;
  box.classList.remove('dragging', 'ready');
  if (d < 64) { box.style.height = '0px'; return; }
  pullClick = Date.now();
  box.style.height = '52px';
  box.classList.add('loading');
  setTimeout(() => {
    feedSeed = Math.random().toString(36).slice(2);
    homeLimit = 16;
    searchLimit = 35;
    if (currentView === '') render();
    else if (currentView === 'search') document.getElementById('search-results').innerHTML = searchResults();
    app.querySelector('main.scroll')?.scrollTo({top:0});
  }, 700);
}
let pullClick = 0;
app.addEventListener('dragstart', e => { if (pull) e.preventDefault(); }); // 그림·링크를 잡고 끌 때 브라우저 기본 「그림 끌기」가 끼어들지 않게
app.addEventListener('touchstart', e => pullStart(e.touches[0].clientX, e.touches[0].clientY, e.target), {passive:true});
app.addEventListener('touchmove', e => pullMove(e.touches[0].clientX, e.touches[0].clientY, e), {passive:false});
app.addEventListener('touchend', pullEnd);
app.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button === 0) pullStart(e.clientX, e.clientY, e.target); });
window.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' && pull) pullMove(e.clientX, e.clientY, e); });
window.addEventListener('pointerup', e => { if (e.pointerType === 'mouse') pullEnd(); });
app.addEventListener('click', e => { if (Date.now() - pullClick < 400) { e.preventDefault(); e.stopPropagation(); } }, true); // 끌어 놓은 직후 클릭은 무시

// 끝없는 목록: 목록 끝 표시가 화면 아래 900px 안으로 들어오면 다음 묶음을 붙인다 (홈 16개씩, 검색 30개씩)
app.addEventListener('scroll', event => {
  const scroller = event.target;
  if (!scroller.classList?.contains('scroll')) return;
  const mark = scroller.querySelector('.feed-sentinel');
  if (!mark || mark.classList.contains('loading') || scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight > 600) return;
  mark.classList.add('loading'); // 인스타처럼 잠깐 도는 표시를 보여 준 뒤 붙인다
  setTimeout(() => loadMore(mark), 650);
}, true);

function loadMore(mark) {
  if (!mark.isConnected) return;
  if (mark.dataset.more === 'home') {
    const requested = readRoute()[1].get('category');
    const items = homeItems(categoryInfo.has(requested) ? requested : '전체');
    const from = homeLimit;
    homeLimit += 16;
    mark.insertAdjacentHTML('beforebegin', items.slice(from, homeLimit).map(feedItem).join(''));
    mark.classList.remove('loading');
    if (homeLimit >= items.length) mark.remove();
  } else {
    searchLimit += 30;
    const box = document.getElementById('search-results'), top = box.scrollTop;
    box.innerHTML = searchResults();
    box.scrollTop = top;
  }
}

// 카드뉴스를 넘기면 1/3 숫자·점·화살표를 맞춘다
app.addEventListener('scroll', event => {
  const track = event.target;
  if (!track.classList?.contains('card-track')) return;
  const box = track.parentElement, total = track.children.length;
  const index = Math.round(track.scrollLeft / track.clientWidth);
  box.querySelector('.card-count').textContent = `${index + 1}/${total}`;
  box.querySelectorAll('.card-dots i').forEach((dot, i) => dot.classList.toggle('on', i === index));
  box.querySelector('.card-nav.prev').hidden = index === 0;
  box.querySelector('.card-nav.next').hidden = index === total - 1;
}, true);

// 사진을 두 번 누르면 좋아요 (인스타처럼 이미 누른 건 취소하지 않는다) + 하트가 튀어 오른다
let lastTap = {id:'', at:0};
app.addEventListener('click', event => {
  const area = event.target.closest('[data-like-area]');
  if (!area) return;
  const id = area.dataset.likeArea;
  const now = Date.now();
  if (lastTap.id !== id || now - lastTap.at > 320) { lastTap = {id, at:now}; return; }
  lastTap = {id:'', at:0};
  const burst = area.querySelector('.like-burst');
  burst.classList.remove('on'); void burst.offsetWidth; burst.classList.add('on');
  if (likes.has(id)) return;
  likes.add(id);
  try { writeLocal('likes',[...likes]); } catch {}
  app.querySelectorAll(`[data-action="like"][data-id="${id}"]`).forEach(control => {
    control.innerHTML = icon('heartFilled');
    control.setAttribute('aria-label','좋아요 취소');
    control.setAttribute('aria-pressed','true');
  });
  updateLikeCount(id);
});

function readPhoto(file) {
  if (!file.size) return Promise.resolve('');
  if (file.size>950000 || !['image/jpeg','image/png','image/webp'].includes(file.type)) {
    return Promise.reject(new Error('950KB 이하의 JPG, PNG 또는 WebP 사진을 선택해 주세요.'));
  }
  return new Promise((resolve,reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('사진을 읽지 못했어요. 다시 선택해 주세요.'));
    reader.readAsDataURL(file);
  });
}

app.addEventListener('submit', async event => {
  const form = event.target;
  if (!['compose-form','comment-form','profile-form'].includes(form.id)) return;
  event.preventDefault();
  const fields = new FormData(form);
  if (form.id==='profile-form') {
    const name = fields.get('name').trim();
    if (!name) return;
    profile = {name, bio:fields.get('bio').trim()};
    try { writeLocal('profile', profile); } catch { toast('프로필을 저장하지 못했어요.'); return; }
    location.hash = route('my');
    toast('프로필을 저장했어요.');
    return;
  }
  if (form.id==='comment-form') {
    const id = form.dataset.id;
    const text = fields.get('text').trim();
    if (!text) return;
    const entry = {id:`c${Date.now().toString(36)}`, text, at:Date.now(), liked:false, replyTo:form.dataset.reply || null};
    comments[id] = [...(comments[id] ?? []), entry];
    saveComments();
    const dialog = form.closest('dialog');
    dialog.querySelector('.comment-list').innerHTML = commentListHtml(id);
    dialog.querySelector(`[data-cid="${entry.id}"]`)?.scrollIntoView({block:'nearest'});
    form.reset(); delete form.dataset.reply;
    dialog.querySelector('.cm-replying').hidden = true;
    form.querySelector('button[type="submit"]').disabled = true;
    refreshCommentCount(id);
    return;
  }
  const name = fields.get('name').trim();
  const caption = fields.get('caption').trim();
  const error = form.querySelector('.form-error');
  if (!name || !caption) {
    error.textContent = '제목과 내용을 입력해 주세요.';
    return;
  }
  const submit = form.querySelector('button[type=submit]');
  submit.disabled = true;
  try {
    const image = await readPhoto(fields.get('photo'));
    const id = 'local-'+crypto.randomUUID();
    const post = {id, name, caption, category:fields.get('category'), image, local:true};
    const updated = [post,...localPosts];
    writeLocal('posts',updated);
    localPosts = updated;
    location.hash = route('my');
    toast('게시물을 저장했어요.');
  } catch (err) {
    error.textContent = err.name==='QuotaExceededError' ? '이 브라우저의 저장 공간이 부족해요. 작은 사진을 선택해 주세요.' : err.message;
  } finally { submit.disabled = false; }
});

// config.js(버스 API 키)는 git에 없을 수 있어요. 없으면 키 없이 시작해요.
function loadConfig() {
  if (!loadConfig.ready) loadConfig.ready = new Promise(resolve => {
    const script = document.createElement('script');
    script.src = 'config.js';
    script.onload = script.onerror = resolve;
    document.head.append(script);
  });
  return loadConfig.ready;
}

initMoa(app, {toast});
initMoaChat(app, {fundById, toast});
initChat(app, {toast, getPlaces:() => places});
initShare({toast});

async function start() {
  try {
    await loadConfig();
    cards = await fetch('./data/cards.json').then(r => r.ok ? r.json() : {}).catch(() => ({}));
    const response = await fetch('./data/places.json');
    if (!response.ok) throw new Error('Place data unavailable');
    places = (await response.json()).map(place => ({
      ...place,
      searchText:normalize([place.name, place.address, place.area, place.category,
        place.location.building, ...(place.reasons ?? []), ...(place.menus ?? []).map(menu=>menu.name)].join(' ')),
    }));
    byId = new Map(places.map(place => [place.id,place]));
    mappedPlaces = places.filter(place => place.latlng);
    await initBuildings({escape, route, top, iconLink, placeRow}, places);
    await initAccounts({escape, route, top, iconLink, postCover, moreButton, hasCard:id => cardList(id).length > 0, getPlaces:() => places,
      isLiked:id => likes.has(id),
      likeButton:id => button(likes.has(id)?'heartFilled':'heart',likes.has(id)?'좋아요 취소':'좋아요','like',`data-id="${id}" aria-pressed="${likes.has(id)}"`)});
    window.addEventListener('hashchange', event => {
      if (['place','compose','post','tip'].includes(readRoute()[0]) && readRoute()[0] !== currentView) {
        placeBack = new URL(event.oldURL).hash || '#/';
      }
      render();
    });
    render();
  } catch (error) {
    console.error(error);
    app.innerHTML='<div class="empty"><p>가이드 정보를 불러오지 못했어요.</p><button class="primary" id="retry">다시 시도</button></div>';
    document.getElementById('retry').onclick=start;
  }
}
start();
