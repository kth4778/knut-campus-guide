import {BUS_STOPS, EXP_TERMINALS, mountBusStop, mountExpress, busKey,
  LIVE_MAX, LIVE_EVERY, liveColor, routeSort, routeIndex, liveBuses, liveBusInfo} from './transit.js';

import {moaPage, initMoa} from './moa.js';

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
const mapCategories = [...categories.map(([name]) => name), ...transitCategories];
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
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  target: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>',
  moa: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8"/>',
  bus: '<rect x="4" y="3" width="16" height="15" rx="3"/><path d="M4 11h16M8 18v3m8-3v3M8 14.5h.01M16 14.5h.01"/>',
};

const nativeIcons = {plus:'plus', comment:'comment', heart:'heart', heartFilled:'heartFilled', bookmark:'bookmark'};
const icon = (name, filled = false) => nativeIcons[name] && !filled
  ? `<span class="icon native-icon" aria-hidden="true" style="--glyph:url('assets/${nativeIcons[name]}.png')"></span>`
  : `<svg class="icon" viewBox="0 0 24 24" fill="${filled?'currentColor':'none'}" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
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
const likes = new Set(readLocal('likes', []));
const comments = readLocal('comments', {});
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

function renderNav(active) {
  const links = [
    ['','홈','home'], ['moa','MOA','moa'], ['map','지도','pin'], ['search','검색','search'], ['my','프로필','user'],
  ];
  nav.innerHTML = links.map(([page,label,symbol]) => page === null
    ? '<span aria-hidden="true"></span>'
    : `<a href="${route(page)}" data-tab="${page || 'home'}" ${active===page?'aria-current="page"':''}>${page==='my'?brandAvatar():icon(symbol, page==='' && active===page)}<span>${label}</span></a>`).join('');
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

function categoryRail(active) {
  return `<nav class="rail" aria-label="장소 카테고리">
    ${categories.map(([label, symbol, asset]) => `<a class="category" data-cat="${escape(label)}" href="${escape(route('', label==='전체'?{}:{category:label}))}" ${label===active?'aria-current="true"':''}>
      <span class="category-disc">${asset?imageTag(asset):icon(symbol)}</span><span>${label}</span>
    </a>`).join('')}
  </nav>`;
}

function brandAvatar() {
  return '<img class="account-avatar" src="assets/app-192.png" alt="" width="34" height="34">';
}

function postCover(post, grid = false) {
  if (post.local && post.image) {
    return `<img class="cover-image" src="${escape(post.image)}" alt="" loading="lazy">`;
  }
  if (post.cover) {
    return `<img class="cover-image" src="assets/${escape(post.cover.asset)}" alt="${escape(post.cover.note)}" loading="lazy">`;
  }
  const info = categoryInfo.get(post.category) || categoryInfo.get('전체');
  const area = post.area === '장소 없음' ? '' : post.area;
  return `<div class="cover-art" data-cat="${escape(post.category)}">
    ${info.asset ? imageTag(info.asset) : icon(info.icon)}
    ${grid ? '' : `<div><small>${escape(post.category)}${area?' · '+escape(area):''}</small><strong>${escape(post.name)}</strong></div>`}
  </div>`;
}

function creditLine(post) {
  if (!post.cover?.page) return '';
  return `<div class="cover-credit">${escape(post.cover.note)} ·
    <a href="${safeUrl(post.cover.page)}" target="_blank" rel="noopener">${escape(post.cover.author)} / Wikimedia Commons</a> ·
    <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>
  </div>`;
}

function postActions(post) {
  const on = likes.has(post.id);
  return `<div class="post-actions">
    ${button(on?'heartFilled':'heart',on?'좋아요 취소':'좋아요','like',`data-id="${post.id}" aria-pressed="${on}"`)}
    ${button('comment','댓글','comments',`data-id="${post.id}"`)}
    ${post.latlng ? iconLink('pin','지도에서 위치 보기',route('map',{focus:post.id})) : ''}
    ${post.local ? '' : button('share','게시물 링크 복사','copy',`data-id="${post.id}"`)}
    ${saveButton(post)}
  </div>`;
}

function postCaption(post) {
  const text = post.local ? post.caption : (post.reasons?.[0] ?? post.address ?? '');
  const count = comments[post.id]?.length ?? 0;
  return `<div class="post-caption">
    ${post.rec ? `<strong>추천 ${post.rec}개</strong>` : ''}
    <p><strong>${escape(post.name)}</strong> ${escape(text)}</p>
    <button data-action="comments" data-id="${post.id}">${count?'댓글 '+count+'개 모두 보기':'댓글 달기'}</button>
  </div>`;
}

function feedPost(post) {
  const url = route(post.local?'post':'place',{id:post.id});
  return `<article class="feed-post">
    <header class="post-header">
      <a href="${route('my')}" aria-label="프로필 열기">${brandAvatar()}</a>
      <a class="post-owner" href="${url}"><strong>${escape(post.name)}</strong><small>${escape(post.category)}${post.area && post.area!=='장소 없음'?' · '+escape(post.area):''}</small></a>
      ${iconLink('arrow','게시물 열기',url)}
    </header>
    <a class="post-cover" href="${url}" aria-label="${escape(post.name)} 게시물">${postCover(post)}</a>
    ${creditLine(post)}
    ${postActions(post)}
    ${postCaption(post)}
  </article>`;
}

function welcomePost() {
  return `<article class="feed-post welcome-post">
    <header class="post-header"><a href="${route('my')}" aria-label="프로필 열기">${brandAvatar()}</a>
      <a class="post-owner" href="${route('map')}"><strong>우리학교 가이드</strong><small>한국교통대 충주캠퍼스</small></a>
      ${iconLink('pin','캠퍼스 지도',route('map'))}
    </header>
    <a class="post-cover campus-cover" href="${route('map')}" aria-label="캠퍼스 지도 열기">
      <img class="cover-image" src="assets/campus.webp" alt="충주캠퍼스 일러스트" width="900" height="675" fetchpriority="high">
    </a>
    <div class="post-actions">${iconLink('pin','캠퍼스 지도',route('map'))}</div>
    <div class="post-caption"><p><strong>우리학교 가이드</strong> 충주캠퍼스의 교내 시설과 학교 앞 장소를 찾아보세요.</p></div>
  </article>`;
}

function home(category) {
  const allPosts = [...localPosts,...places];
  const items = category === '전체' ? allPosts : allPosts.filter(post => post.category === category);
  const visible = items.slice(0, homeLimit);
  return `${top('우리학교 가이드', iconLink('plus','새 게시물',route('compose')), iconLink('bookmark','저장한 게시물',route('my',{tab:'saved'})), true)}
    <main class="scroll" aria-label="홈">
      ${categoryRail(category)}
      ${category==='전체'?welcomePost():''}
      ${visible.map(feedPost).join('')}
      ${items.length>visible.length?`<div class="more-row"><button class="pill" data-action="more-home">게시물 더 보기</button></div>`:''}
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
  if (!query) return gridPosts(places.slice(0,30),true);
  if (!matches.length) return '<div class="empty">검색 결과가 없어요.<br>장소 이름이나 다른 키워드를 입력해 보세요.</div>';
  return `<div class="section-head"><h2>${query?'검색 결과':'추천 장소'}</h2><span>${matches.length}개</span></div>
    <div class="places">${matches.slice(0,searchLimit).map(place => placeRow(place,'search')).join('')}</div>
    ${matches.length>searchLimit?`<div class="more-row"><button class="pill" data-action="more-search">더 보기</button></div>`:''}`;
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
  return `${top('우리학교 가이드',iconLink('plus','새 게시물',route('compose')),iconLink('menu','설정',route('settings')))}
    <main class="scroll">
      <section class="profile">
        <div class="profile-line">${brandAvatar()}<div class="profile-info">
          <h1>우리학교 가이드</h1>
          <div class="profile-counts">
            <a href="${route('my')}"><b>${localPosts.length}</b>게시물</a>
            <a href="${route('my',{tab:'saved'})}"><b>${savedItems.length}</b>저장됨</a>
          </div>
        </div></div>
        <p>한국교통대 충주캠퍼스</p>
        <div class="profile-actions"><a class="pill" href="${route('compose')}">새 게시물</a><a class="pill" href="${route('search')}">장소 찾아보기</a></div>
      </section>
      <nav class="profile-tabs" aria-label="프로필 게시물">
        <a href="${route('my')}" aria-label="내 게시물" ${profileTab==='posts'?'aria-current="page"':''}>${icon('grid')}</a>
        <a href="${route('my',{tab:'saved'})}" aria-label="저장한 게시물 격자" ${profileTab==='saved'?'aria-current="page"':''}>${icon('bookmark')}</a>
      </nav>
      ${items.length?gridPosts(items):empty}
    </main>`;
}

// 인스타그램 프로필의 세 줄 메뉴 자리. 이 앱에서 실제로 할 수 있는 것만 둔다.
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
  for (const key of ['posts','likes','comments','saved']) {
    try { localStorage.removeItem('knut-campus-guide:'+key); } catch {}
  }
  localPosts = [];
  likes.clear();
  for (const id of Object.keys(comments)) delete comments[id];
  saved = new Set();
  render();
  toast('내 기록을 모두 지웠어요.');
}

function composePage() {
  return `${top('새 게시물',iconLink('back','뒤로',placeBack))}
    <main class="scroll compose">
      <form id="compose-form">
        <label>사진 <span>(선택)</span><input name="photo" type="file" accept="image/jpeg,image/png,image/webp"></label>
        <label>카테고리 <select name="category">${categories.slice(1).map(([name])=>`<option>${name}</option>`).join('')}</select></label>
        <label>제목 <input name="name" placeholder="장소나 기록 이름" required maxlength="60"></label>
        <label>내용 <textarea name="caption" placeholder="문구를 입력하세요…" required maxlength="500"></textarea></label>
        <p>게시물은 이 브라우저에 저장됩니다.</p>
        <button class="primary" type="submit">게시</button>
        <p class="form-error" role="status"></p>
      </form>
    </main>`;
}

function findPost(id) {
  return byId.get(id) ?? localPosts.find(post => post.id===id);
}

function localPostPage(post) {
  const content = post ? feedPost(post) : '<div class="empty">게시물을 찾을 수 없어요.</div>';
  return `${top('게시물',iconLink('back','뒤로',placeBack))}<main class="scroll">${content}</main>`;
}

function openComments(id) {
  const post = findPost(id);
  if (!post) return;
  const entries = comments[id] ?? [];
  const dialog = document.createElement('dialog');
  dialog.className = 'comment-sheet';
  dialog.innerHTML = `<div class="sheet-top"><h2>댓글</h2>${button('close','댓글 닫기','close-comments')}</div>
    <div class="comment-list">${entries.length ? entries.map(entry=>`<p>${brandAvatar()}<span>${escape(entry)}</span></p>`).join('') : '<p>첫 댓글을 남겨 보세요.</p>'}</div>
    <form id="comment-form" data-id="${id}"><input name="text" aria-label="댓글 입력" placeholder="댓글 달기…" required maxlength="300"><button type="submit">게시</button></form>`;
  app.append(dialog);
  dialog.addEventListener('close', () => dialog.remove());
  dialog.showModal();
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
  openSheet(terminal.name, body => mountExpress(body, terminal));
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
      ${mapCategories.map(name=>`<button class="chip${transitCategories.includes(name)?' transit-chip':''}" data-action="map-category" data-category="${escape(name)}" aria-pressed="${name===mapCategory}">${name}</button>`).join('')}
    </div>
    <div id="live-row" class="chips live-row" aria-label="실시간 버스 노선" hidden></div>
    <main class="map-panel" aria-label="장소 지도">
      <div id="map-canvas" class="map-canvas"></div>
      <button class="ib map-reset" type="button" data-action="campus" aria-label="캠퍼스 중심으로">${icon('target')}</button>
    </main>
    <div id="map-result" class="map-result" aria-live="polite"></div>`;
}

function markerHtml(place, selected, count) {
  const label = count>1 && !selected ? `<span class="marker-count">${count}</span>`
    : icon(selected?'pin':(categoryInfo.get(place.category)?.icon || 'pin'));
  return `<span class="marker${selected?' selected':''}" data-cat="${escape(place.category)}">${label}</span>`;
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
    const count = mappedPlaces.filter(item => mapCategory==='전체'||item.category===mapCategory).length;
    result.innerHTML = `<p>${count}개 위치 · 핀을 눌러 장소를 확인하세요.</p>`;
    return;
  }
  result.innerHTML = placeRow(place,'map') +
    (place.location.note ? `<p class="location-note">${escape(place.location.note)}</p>` : '');
}

function mapGroupPopup(group) {
  const popup = document.createElement('div');
  popup.className = 'map-popup';
  for (const place of group) {
    const link = document.createElement('a');
    link.href = route('map', {focus:place.id});
    link.textContent = place.name;
    popup.append(link);
  }
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
  const marker = L.marker(place.latlng, {
    title:name, alt:name, zIndexOffset:selected?1000:0, riseOnHover:true,
    icon:L.divIcon({className:'guide-pin',html:markerHtml(place,selected,group.length),iconSize:[26,26],iconAnchor:[13,13]}),
  }).addTo(mapMarkers);
  if (group.length>1) marker.bindPopup(() => mapGroupPopup(group), {offset:[0,-9]});
  else marker.on('click', () => { location.hash = route('map',{focus:place.id}); });
}

function addNaverMarker(group, place, selected, name) {
  const {maps} = window.naver;
  const marker = new maps.Marker({
    map, position:new maps.LatLng(...place.latlng), title:name, zIndex:selected?1000:0,
    icon:{content:markerHtml(place,selected,group.length), anchor:new maps.Point(13,13)},
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
  if (mapCategory === '전체' || mapCategory === '고속버스') {
    for (const terminal of EXP_TERMINALS) {
      addPoint(terminal.latlng, `<span class="marker transit-marker exp">${icon('bus')}</span>`, terminal.name, () => openExpressSheet(terminal), 900);
    }
  }
  if (mapCategory !== '전체' && mapCategory !== '버스') return;
  for (const stop of BUS_STOPS) {
    addPoint(stop.latlng, `<span class="marker transit-marker bus">${icon('bus')}</span>`, stop.name, () => openBusSheet(stop), 300);
  }
  if (!live.on) return;
  for (const bus of live.buses) {
    addPoint(bus.latlng, `<span class="live-bus" style="background:${liveColor(bus.no)}">${escape(bus.no)}</span>`,
      `${bus.no}번 버스`, () => openSheet(`${bus.no}번 버스`, body => { body.innerHTML = liveBusInfo(bus); }), 1100);
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
  live.timer = setInterval(() => { if (!document.hidden) livePoll(); }, LIVE_EVERY);
}

function liveStop() {
  live.on = false;
  live.buses = [];
  clearInterval(live.timer);
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

function paintMarkers() {
  clearMarkers();
  paintTransit();
  if (transitCategories.includes(mapCategory) && !focusedMapPlace) return;
  const groups = new Map();
  for (const place of mappedPlaces) {
    if (mapCategory !== '전체' && place.category!==mapCategory && place!==focusedMapPlace) continue;
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
  showMapResult(focusedMapPlace);
  if (category === '버스') liveStart();
  else liveStop();
  if (!map) return;
  paintMarkers();
  const center = focusedMapPlace?.latlng ?? campus;
  const zoom = focusedMapPlace ? 17 : 15;
  if (usingNaver) {
    map.setCenter(new window.naver.maps.LatLng(...center));
    map.setZoom(zoom);
    return;
  }
  map.invalidateSize({pan:false});
  map.closePopup();
  map.setView(center, zoom);
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
    logoControlOptions:{position:maps.Position.BOTTOM_LEFT},
    zoomControl:true, zoomControlOptions:{position:maps.Position.RIGHT_BOTTOM, style:maps.ZoomControlStyle.SMALL},
  });
  mapMarkers = [];
  naverInfo = new maps.InfoWindow({borderColor:'#c9d2e0', anchorSize:new maps.Size(10,8), pixelOffset:new maps.Point(0,-6)});
  maps.Event.addListener(map, 'click', () => naverInfo.close());
}

function startLeaflet() {
  usingNaver = false;
  if (!window.L) {
    document.getElementById('map-canvas').innerHTML = '<div class="empty"><p>지도를 불러오지 못했어요.</p><a class="primary" href="#/search">장소 검색</a></div>';
    return;
  }
  map = L.map('map-canvas',{zoomControl:false,scrollWheelZoom:true,attributionControl:true}).setView(campus,15);
  map.attributionControl.setPrefix(false);
  L.control.zoom({position:'bottomright',zoomInTitle:'확대',zoomOutTitle:'축소'}).addTo(map);
  const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom:19,
    attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>',
  }).addTo(map);
  tiles.on('tileerror', () => toast('배경 지도 연결이 지연되고 있어요.'));
  mapMarkers = L.layerGroup().addTo(map);
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
  const category = categoryInfo.has(requested) || (path==='map' && transitCategories.includes(requested)) ? requested : '전체';
  const place = byId.get(params.get(path==='map'?'focus':'id'));
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
  currentView = path;
  if (path === 'map') {
    app.innerHTML = mapPage();
    bindMap(place, category);
  } else if (path === 'search') app.innerHTML = searchPage();
  else if (path === 'moa') app.innerHTML = moaPage(top('MOA'));
  else if (path === 'my') {
    profileTab = params.get('tab')==='saved' ? 'saved' : 'posts';
    app.innerHTML = savedPage();
  } else if (path === 'settings') app.innerHTML = settingsPage();
  else if (path === 'compose') app.innerHTML = composePage();
  else if (path === 'post') app.innerHTML = localPostPage(findPost(params.get('id')));
  else if (path === 'place') app.innerHTML = placePage(place);
  else app.innerHTML = home(category);
  renderNav(path === 'place' ? '' : path === 'settings' ? 'my' : path);
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
    case 'like': {
      const id = control.dataset.id;
      if (likes.has(id)) likes.delete(id);
      else likes.add(id);
      try { writeLocal('likes',[...likes]); } catch {}
      control.innerHTML = icon(likes.has(id)?'heartFilled':'heart');
      control.setAttribute('aria-label',likes.has(id)?'좋아요 취소':'좋아요');
      control.setAttribute('aria-pressed',likes.has(id));
      break;
    }
    case 'comments': openComments(control.dataset.id); break;
    case 'reset-data': resetData(); break;
    case 'close-comments':
    case 'close-sheet': control.closest('dialog').close(); break;
    case 'copy': {
      const url = new URL(route('place',{id:control.dataset.id}),location.href);
      if (!navigator.clipboard) { toast('링크를 복사하지 못했어요.'); break; }
      navigator.clipboard.writeText(url.href).then(()=>toast('링크를 복사했어요.')).catch(()=>toast('링크를 복사하지 못했어요.'));
      break;
    }
    case 'clear-search':
      searchQuery='';
      searchLimit=35;
      document.getElementById('place-search').value='';
      document.getElementById('search-results').innerHTML=searchResults();
      document.getElementById('place-search').focus({preventScroll:true});
      break;
    case 'more-home': {
      const scroll = app.querySelector('.scroll').scrollTop;
      homeLimit+=16;
      render();
      app.querySelector('.scroll').scrollTop=scroll;
      break;
    }
    case 'more-search':
      searchLimit+=35;
      document.getElementById('search-results').innerHTML=searchResults();
      break;
    case 'map-category':
      location.hash=route('map',control.dataset.category==='전체'?{}:{category:control.dataset.category});
      break;
    case 'live-route': toggleLiveRoute(control.dataset.no); break;
    case 'campus':
      updateMap(null,mapCategory);
      history.replaceState(history.state,'',route('map',mapCategory==='전체'?{}:{category:mapCategory}));
      break;
  }
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
  if (!['compose-form','comment-form'].includes(form.id)) return;
  event.preventDefault();
  const fields = new FormData(form);
  if (form.id==='comment-form') {
    const id = form.dataset.id;
    const text = fields.get('text').trim();
    if (!text) return;
    const entries = comments[id] ?? [];
    comments[id] = [...entries,text];
    try { writeLocal('comments',comments); } catch { toast('댓글을 저장하지 못했어요.'); }
    form.closest('dialog').close();
    const scroll = app.querySelector('.scroll');
    const offset = scroll?.scrollTop ?? 0;
    render();
    app.querySelector('.scroll')?.scrollTo(0,offset);
    openComments(id);
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

async function start() {
  try {
    await loadConfig();
    const response = await fetch('./data/places.json');
    if (!response.ok) throw new Error('Place data unavailable');
    places = (await response.json()).map(place => ({
      ...place,
      searchText:normalize([place.name, place.address, place.area, place.category,
        place.location.building, ...(place.reasons ?? []), ...(place.menus ?? []).map(menu=>menu.name)].join(' ')),
    }));
    byId = new Map(places.map(place => [place.id,place]));
    mappedPlaces = places.filter(place => place.latlng);
    window.addEventListener('hashchange', event => {
      if (['place','compose','post'].includes(readRoute()[0]) && readRoute()[0] !== currentView) {
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
