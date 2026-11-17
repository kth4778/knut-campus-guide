// 누팁스(KNUTIPS) 앱의 「계정」을 옮겨 온 것.
// - 홈 맨 위 동그라미 줄: 교통대 제휴 · 장소 분류(식사·카페…) · 자취방·기숙사 · 꿀팁 분류
// - 계정 화면(#/account?id=…): 인스타 프로필처럼 머리말 + 게시물 격자
// - 제휴 게시물 화면(#/partner?id=S01)
// - 홈 피드: 추천 많은 곳 사이사이에 제휴 혜택과 오늘의 꿀팁을 섞는다 (날짜마다 순서가 바뀜)
// 장소·꿀팁 데이터는 places.json 의 kCat(누팁스 분류)으로 계정에 나눈다. scripts/merge_knutips.py 참고.

// 다른 탭 아이콘과 같은 굵기의 선 아이콘
const GLYPH = {
  store: '<path d="M4 9.5V20h16V9.5M3 9.5 5 4h14l2 5.5c0 1.4-1.1 2.5-2.5 2.5S16 10.9 16 9.5c0 1.4-1.1 2.5-2.5 2.5h-3C9.1 12 8 10.9 8 9.5 8 10.9 6.9 12 5.5 12S3 10.9 3 9.5Z"/><path d="M10 20v-4.5h4V20"/>',
  food: '<path d="M4 3v7a3 3 0 0 0 6 0V3m-3 0v18m12 0V3c-3 1-5 4-5 8v2h5"/>',
  cafe: '<path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zm12 1h1.5a2.5 2.5 0 0 1 0 5H16M7 3.5c-.6.8-.6 1.7 0 2.5m4-2.5c-.6.8-.6 1.7 0 2.5"/>',
  beer: '<path d="M6 7h9v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2zm9 3h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2M6 7a3 3 0 0 1 4.5-3.4A3 3 0 0 1 15 7M9.5 11v6m3-6v6"/>',
  book: '<path d="M3 4h6l3 2 3-2h6v15h-6l-3 2-3-2H3zm9 2v15"/>',
  tree: '<path d="M12 21v-6m-4 2H5l4-6H7l5-8 5 8h-2l4 6h-3"/>',
  play: '<circle cx="12" cy="12" r="9"/><path d="m10 8.5 5.5 3.5-5.5 3.5z"/>',
  bag: '<path d="M5 8h14l-1 13H6zm4 0V6a3 3 0 0 1 6 0v2"/>',
  bus: '<rect x="4.5" y="3" width="15" height="15" rx="3"/><path d="M4.5 11h15M8 18v3m8-3v3M8 14.5h.01M16 14.5h.01"/>',
  home: '<path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/>',
  bed: '<path d="M3 19V6m0 8h18v5M3 14V11h7v3m4-4h4a3 3 0 0 1 3 3v1"/><circle cx="6.5" cy="9" r="1.6"/>',
  bulb: '<path d="M9 18h6m-5 3h4M8.5 14.5A6 6 0 1 1 15.5 14.5c-.8.7-1.5 1.6-1.5 2.5h-4c0-.9-.7-1.8-1.5-2.5Z"/>',
  cap: '<path d="M2.5 9 12 4.5 21.5 9 12 13.5z"/><path d="M6.5 11v4.5c3 2.5 8 2.5 11 0V11M21.5 9v5"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  back: '<path d="m11 4-8 8 8 8M3 12h18"/>',
  share: '<path d="M12 15V3m-5 5 5-5 5 5M5 12H3v9h18v-9h-2"/>',
};
const glyph = (name, size = 24) =>
  `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GLYPH[name]}</svg>`;

// 누팁스 분류 색 그대로
const ACCOUNTS = [
  {id:'제휴', name:'교통대 제휴', icon:'store', color:'#c0392b', kind:'partner', bio:"43대 총학생회 '우리' 제휴 매장 · 재학생·휴학생 학생증 제시 (졸업생 제외)"},
  {id:'식사', name:'식사', icon:'food', color:'#2a78d6', kind:'place', bio:'학교 안팎 밥집, 선배 추천 많은 순'},
  {id:'카페·디저트', name:'카페·디저트', icon:'cafe', color:'#eb6834', kind:'place', bio:'공부하기 좋은 카페와 디저트'},
  {id:'술', name:'술', icon:'beer', color:'#6250d6', kind:'place', bio:'학교 앞 술집'},
  {id:'공부', name:'공부', icon:'book', color:'#d99400', kind:'place', bio:'열람실·스터디 공간'},
  {id:'휴식·산책', name:'휴식·산책', icon:'tree', color:'#1f8a3a', kind:'place', bio:'쉬는 시간에 가기 좋은 곳'},
  {id:'운동·놀거리', name:'운동·놀거리', icon:'play', color:'#d4628d', kind:'place', bio:'운동하고 놀 곳'},
  {id:'생활편의', name:'생활편의', icon:'bag', color:'#139a6b', kind:'place', bio:'편의점·문구·복사·은행 등 생활 시설'},
  {id:'교통', name:'교통', icon:'bus', color:'#5b6472', kind:'place', bio:'학교 오가는 교통'},
  {id:'set:자취방', name:'자취방', icon:'home', color:'#c0562b', kind:'set', bio:'원룸·자취방과 방 구할 때 꿀팁',
    place:p => p.kCat === '주거·생활관' && !/생활관/.test(p.name), tip:t => /원룸|자취|월세/.test(t.name)},
  {id:'set:기숙사', name:'기숙사', icon:'bed', color:'#2f6f9f', kind:'set', bio:'생활관(기숙사) 시설과 벌점·외박 꿀팁',
    place:p => /생활관/.test(p.name), tip:t => /생활관|기숙사/.test(t.name)},
  {id:'식사 팁', name:'식사 팁', icon:'bulb', color:'#2a78d6', kind:'tip', bio:'밥 먹을 때 알아두면 좋은 선배 꿀팁'},
  {id:'생활·주거 팁', name:'생활·주거 팁', icon:'bulb', color:'#139a6b', kind:'tip', bio:'학교생활·자취 꿀팁'},
  {id:'교통 팁', name:'교통 팁', icon:'bus', color:'#d99400', kind:'tip', bio:'버스·택시·기차 타는 꿀팁'},
  {id:'학사·장학 팁', name:'학사·장학 팁', icon:'cap', color:'#6250d6', kind:'tip', bio:'수강신청·장학금·휴학 꿀팁'},
];
const TIP_CATS = new Set(ACCOUNTS.filter(a => a.kind === 'tip').map(a => a.id));
const byAccountId = new Map(ACCOUNTS.map(a => [a.id, a]));

let ctx = null;           // app.js 에서 넘겨받는 도구들 (escape, route, top, postCover…)
let partners = [];
const partnerById = new Map();
const SEEN_KEY = 'knut-campus-guide:seenAccounts';
let seen = new Set();
try { seen = new Set(JSON.parse(localStorage.getItem(SEEN_KEY)) || []); } catch {}

export async function initAccounts(tools) {
  ctx = tools;
  try {
    const response = await fetch('./data/partners.json');
    if (response.ok) partners = await response.json();
  } catch {}
  partners.forEach(p => partnerById.set(p.id, p));
}

const isTip = post => TIP_CATS.has(post.kCat);
const byRec = (a, b) => (b.rec || 0) - (a.rec || 0);

function accountPosts(account) {
  const all = ctx.getPlaces();
  if (account.kind === 'partner') return partners;
  if (account.kind === 'set') return [...all.filter(p => !isTip(p) && account.place(p)).sort(byRec), ...all.filter(t => isTip(t) && account.tip(t))];
  return all.filter(p => p.kCat === account.id).sort(byRec);
}

export function accountOf(post) {
  return byAccountId.get(post.kCat) || null;
}

function disc(account, size = 'md') {
  return `<span class="acct-disc ${size}" style="--acct:${account.color}">${glyph(account.icon)}</span>`;
}

// 게시물 머리의 작은 계정 동그라미 (누르면 그 계정으로)
export function accountAvatar(post) {
  const account = accountOf(post);
  if (!account) return '';
  return `<a href="${ctx.route('account', {id:account.id})}" aria-label="${ctx.escape(account.name)} 계정 열기">${disc(account, 'sm')}</a>`;
}

// ---------- 홈 맨 위 동그라미 줄 ----------
export function storyRail() {
  const { escape, route } = ctx;
  return `<nav class="stories" aria-label="계정">
    ${ACCOUNTS.filter(a => accountPosts(a).length).map(a => `<a class="story${seen.has(a.id) ? ' seen' : ''}" href="${route('account', {id:a.id})}">
      <span class="story-ring">${disc(a)}</span><span class="story-name">${escape(a.name)}</span>
    </a>`).join('')}
  </nav>`;
}

// ---------- 계정 화면 ----------
export function accountPage(id, params) {
  const { escape, route, top, iconLink } = ctx;
  const account = byAccountId.get(id);
  if (!account) return `${top('계정', iconLink('back', '뒤로', route('')))}<main class="scroll empty">계정을 찾을 수 없어요.</main>`;
  if (!seen.has(id)) { seen.add(id); try { localStorage.setItem(SEEN_KEY, JSON.stringify([...seen])); } catch {} }
  const posts = accountPosts(account);
  let counts, chips = '', grid;
  if (account.kind === 'partner') {
    const groups = [...new Set(partners.map(p => p.cat))];
    const pick = groups.includes(params.get('cat')) ? params.get('cat') : '';
    const shown = pick ? partners.filter(p => p.cat === pick) : partners;
    const last = partners.map(p => p.to).filter(Boolean).sort().pop() || '';
    counts = [[partners.length, '게시물'], [groups.length, '분류'], [last ? `~${+last.slice(5, 7)}/${+last.slice(8)}` : '-', '혜택 기간']];
    chips = `<div class="chips acct-chips">${['', ...groups].map(g => `<a class="chip" aria-pressed="${g === pick}" href="${route('account', g ? {id, cat:g} : {id})}">${escape(g || '전체')} ${g ? partners.filter(p => p.cat === g).length : partners.length}</a>`).join('')}</div>`;
    grid = `<div class="post-grid">${shown.map(p => `<a class="partner-tile" href="${route('partner', {id:p.id})}">
      <span class="partner-kick">${escape(p.cat)}</span><strong>${escape(p.name)}</strong><small>${escape(p.benefits[0] || '')}</small></a>`).join('')}</div>`;
  } else {
    const recs = posts.reduce((sum, p) => sum + (p.rec || 0), 0);
    const mapped = posts.filter(p => p.latlng).length;
    counts = [[posts.length, '게시물'], [recs, '추천'], [mapped, '지도']];
    grid = `<div class="post-grid">${posts.map(p => `<a href="${route('place', {id:p.id})}" aria-label="${escape(p.name)} 게시물">${ctx.postCover(p, true)}<span class="grid-name">${escape(p.name)}</span></a>`).join('')}</div>`;
  }
  return `${top(account.name, iconLink('back', '뒤로', route('')))}
    <main class="scroll">
      <section class="profile acct-profile">
        <div class="profile-line"><span class="story-ring big">${disc(account, 'lg')}</span><div class="profile-info">
          <h1>${escape(account.name)}</h1>
          <div class="profile-counts">${counts.map(([n, label]) => `<span><b>${escape(n)}</b>${label}</span>`).join('')}</div>
        </div></div>
        <p>${escape(account.bio)}</p>
      </section>
      ${chips}
      ${grid}
    </main>`;
}

// ---------- 제휴 게시물 ----------
const dot = date => date ? `${date.slice(0, 4)}.${date.slice(5, 7)}.${date.slice(8)}` : '';

function partnerCard(p) {
  const { escape } = ctx;
  return `<div class="partner-card">
    <span class="partner-kick">학생증 제시</span>
    <span class="partner-icon">${glyph('store', 44)}</span>
    <h3>${escape(p.name)}</h3>
    <ul>${p.benefits.map(b => `<li>${glyph('check', 16)}<span>${escape(b)}</span></li>`).join('')}</ul>
    <div class="partner-meta"><span>${escape(p.cat)}</span>${p.to ? `<span>~ ${dot(p.to)}</span>` : ''}</div>
  </div>`;
}

export function partnerFeedPost(p) {
  const { escape, route } = ctx;
  const account = byAccountId.get('제휴');
  const url = route('partner', {id:p.id});
  return `<article class="feed-post">
    <header class="post-header">
      <a href="${route('account', {id:'제휴'})}" aria-label="교통대 제휴 계정 열기">${disc(account, 'sm')}</a>
      <a class="post-owner" href="${route('account', {id:'제휴'})}"><strong>교통대 제휴</strong><small>${escape(p.cat)} · ${escape(shortAddr(p.addr))}</small></a>
      ${ctx.iconLink('arrow', '게시물 열기', url)}
    </header>
    <a class="post-cover" href="${url}" aria-label="${escape(p.name)} 제휴 게시물">${partnerCard(p)}</a>
    <div class="post-caption"><p><strong>교통대 제휴</strong> ${escape(p.name)} 제휴 혜택이에요. 재학생·휴학생 학생증을 보여주세요.</p></div>
  </article>`;
}

const shortAddr = addr => String(addr || '').replace(/^(충북|충청북도)\s*/, '').replace(/^충주시\s*/, '');

export function partnerPage(id) {
  const { escape, route, top, iconLink } = ctx;
  const p = partnerById.get(id);
  if (!p) return `${top('게시물', iconLink('back', '뒤로', route('account', {id:'제휴'})))}<main class="scroll empty">제휴 게시물을 찾을 수 없어요.</main>`;
  const naver = `https://map.naver.com/p/search/${encodeURIComponent(p.name)}`;
  return `${top('게시물', iconLink('back', '뒤로', route('account', {id:'제휴'})))}
    <main class="scroll">
      ${partnerFeedPost(p)}
      <div class="detail-body">
        <p>방법: ${escape(p.how || '학생증 제시')} · 기간: ${dot(p.from)} ~ ${dot(p.to)}</p>
        <p>${escape(p.addr)}${p.approx ? ' (도로 기준 대략 위치)' : ''}</p>
        <div class="detail-actions">
          <a class="pill" href="${naver}" target="_blank" rel="noopener">네이버 지도에서 찾기</a>
          <a class="pill" href="${route('account', {id:'제휴', cat:p.cat})}">${escape(p.cat)} 제휴 더 보기</a>
        </div>
      </div>
    </main>`;
}

// ---------- 홈 피드: 추천 많은 곳 · 제휴 · 오늘의 꿀팁 ----------
function dayHash(text) { let h = 0; for (const c of text) h = (h * 31 + c.charCodeAt(0)) | 0; return h; }

export function homeFeed(items) {
  const today = new Date().toISOString().slice(0, 10);
  const shuffle = (list, key) => list.slice().sort((a, b) => dayHash(key(a) + today) - dayHash(key(b) + today));
  const tips = shuffle(items.filter(p => isTip(p) && p.memos?.length), p => p.id);
  const others = items.filter(p => !tips.includes(p)).sort(byRec);
  const deals = shuffle(partners, p => p.id);
  const feed = [];
  others.forEach((post, i) => {
    feed.push({kind:'place', post});
    if (i % 2 === 0 && deals[i / 2]) feed.push({kind:'partner', post:deals[i / 2]});
    if (i % 2 === 1 && tips[(i - 1) / 2]) feed.push({kind:'tip', post:tips[(i - 1) / 2]});
  });
  return feed;
}
