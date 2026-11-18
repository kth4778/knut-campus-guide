// 교내 건물: 장소를 건물마다 묶고, 건물 화면(#/building?name=…)에서 층을 3D 로 쌓아 보여준다.
// - 건물 이름은 places.json 의 location.building, 층은 주소·이름 속 「1층」「지하1층」「B1」에서 읽는다
// - 층별 안내(그 층에 어떤 부서·시설이 있는지)는 학교 캠퍼스지도에서 모은 data/buildings.json 을 쓴다
//   (만드는 법: scripts/collect_buildings.py → scripts/export_buildings.py)
// - 실제 도면(방 위치)은 데이터에 없어서 그리지 않는다
// - 건물 사진은 그 건물 장소에 붙은 실제 사진(위키미디어 공용)이 있을 때만 쓴다

const NOT_BUILDING = new Set(['', '원본 지도 제보 지점']);
let ctx = null;            // app.js 에서 넘겨받는 도구 (escape, route, top, iconLink, placeRow, icon)
let buildings = new Map(); // 건물 이름 → {name, latlng, places, floors, photo, official}
let collected = '';

// 시설 이름 → 아이콘 종류. 위에서부터 먼저 맞는 것을 쓴다 (예: 「스포츠의학전공」은 운동이 아니라 학과)
const KINDS = [
  ['food', '식당·카페', /식당|카페|Caffee|음료/],
  ['shop', '가게', /편의점|마트|서점|안경점|농협|우편|복사/],
  ['dept', '학과·전공', /전공|학과|학부|대학원/],
  ['reading', '열람·자료', /열람|자료실|도서관/],
  ['hall', '강당·회의', /회의장|회의실|극장/],
  ['exhibit', '전시', /박물관|전시/],
  ['sports', '운동', /휘트니스|헬스|운동장|테니스|아레나/],
  ['dorm', '생활관', /생활관|관리동/],
  ['club', '학생 활동', /총학|동아리|방송국|신문사|졸업준비|학생복지/],
  ['care', '보건·상담', /보건|상담|인권|장애/],
  ['lab', '연구·지원', /센터|사업단|실험|실습|연구|원$|3D|RIC|비행|역학|창업|항공$/],
  ['office', '사무실', /./],
];
const kindOf = what => KINDS.find(([, , test]) => test.test(what));
const squash = text => text.replace(/\s+/g, '');

// 「지하1층」「B1」 → -1, 「3층」 → 3, 없으면 null
export function floorOf(place) {
  const text = `${place.address || ''} ${place.name || ''}`;
  const under = /(?:지하\s*(\d+)\s*층?|\bB(\d+)\b)/.exec(text);
  if (under) return -Number(under[1] || under[2]);
  const floor = /(\d+)\s*층/.exec(text);
  return floor ? Number(floor[1]) : null;
}

const floorLabel = n => n < 0 ? `B${-n}` : `${n}F`;
const floorName = n => n == null ? '층 정보 없음' : n < 0 ? `지하 ${-n}층` : `${n}층`;

export async function initBuildings(tools, places) {
  ctx = tools;
  buildings = new Map();
  for (const place of places) {
    const name = place.location?.building?.trim() || '';
    if (place.area !== '교내' || !place.latlng || NOT_BUILDING.has(name)) continue;
    if (!buildings.has(name)) buildings.set(name, {name, places:[]});
    buildings.get(name).places.push(place);
  }
  let official = [];
  try {
    const response = await fetch('./data/buildings.json');
    if (response.ok) ({buildings:official, collected} = await response.json());
  } catch { /* 층별 안내 없이도 건물 화면은 열린다 */ }
  for (const building of buildings.values()) {
    // 건물 좌표: 그 건물 장소들이 가장 많이 가리키는 점
    const votes = new Map();
    building.places.forEach(p => { const key = p.latlng.join(); votes.set(key, (votes.get(key) || 0) + 1); });
    building.latlng = [...votes.entries()].sort((a, b) => b[1] - a[1])[0][0].split(',').map(Number);
    building.floors = new Map();
    for (const place of building.places) {
      const floor = floorOf(place);
      if (!building.floors.has(floor)) building.floors.set(floor, []);
      building.floors.get(floor).push(place);
    }
    building.photo = building.places.find(p => p.cover?.asset)?.cover || null;
    building.official = official.find(b => b.names.some(n => squash(n) === squash(building.name))) || null;
  }
}

export const buildingOf = place => buildings.get(place.location?.building?.trim() || '') || null;
export const allBuildings = () => [...buildings.values()];

// 지도에 올릴 건물 핀 모양 (개수 + 이름)
export function buildingPinHtml(building, count, showName) {
  return `<span class="marker building-pin" title="${ctx.escape(building.name)}"><b>${count}</b>${showName ? `<span class="building-name">${ctx.escape(building.name)}</span>` : ''}</span>`;
}

// ---------- 건물 화면 ----------
const guideOf = (building, floor) => building.official?.floors[floor] || [];

// 아래층부터 꼭대기까지 빠짐없이: 꼭대기 = 층수(OSM)·학교 안내·장소 중 가장 높은 층
function floorRange(building) {
  const placeFloors = [...building.floors.keys()].filter(n => n != null);
  const guideFloors = Object.keys(building.official?.floors || {}).map(Number);
  const known = [...placeFloors, ...guideFloors];
  if (!known.length) return [];
  const top = Math.max(...known, building.official?.levels || 0);
  const bottom = Math.min(...known, 1);
  const list = [];
  for (let n = top; n >= bottom; n--) if (n !== 0) list.push(n);
  return list; // 위층부터
}

function guideCard(what) {
  const [kind, label] = kindOf(what);
  return `<li class="guide-card"><img src="assets/floor/${kind}.webp" alt="" width="40" height="40" loading="lazy">
    <span><b>${ctx.escape(what)}</b><small>${label}</small></span></li>`;
}

function floorPanel(building, floor, range) {
  const { escape, route } = ctx;
  const places = building.floors.get(floor) || [];
  const guide = floor == null ? [] : guideOf(building, floor);
  const i = range.indexOf(floor);
  const step = (n, arrow) => n == null ? '<span></span>'
    : `<a class="floor-step" href="${route('building', {name:building.name, floor:n})}">${arrow} ${escape(floorName(n))}</a>`;
  const counts = [guide.length && `학교 안내 ${guide.length}`, places.length && `장소 ${places.length}`].filter(Boolean).join(' · ');
  return `<section class="floor-places" aria-live="polite">
    <div class="floor-title"><h2>${escape(floorName(floor))} <small>${counts || '안내 없음'}</small></h2>
      ${i >= 0 ? `<nav class="floor-steps" aria-label="다른 층">${step(range[i - 1], '▲')}${step(range[i + 1], '▼')}</nav>` : ''}</div>
    ${guide.length ? `<h3 class="floor-sub">이 층에 있는 곳</h3><ul class="guide-grid">${guide.map(guideCard).join('')}</ul>` : ''}
    ${places.length ? `<h3 class="floor-sub">누팁스가 소개하는 곳</h3><div class="places">${places.map(p => ctx.placeRow(p)).join('')}</div>` : ''}
    ${!guide.length && !places.length ? `<div class="floor-empty"><img src="assets/floor/empty.webp" alt="" width="150" loading="lazy">
      <p>학교 안내에 이 층의 부서·시설이 적혀 있지 않아요.<br>강의실이나 연구실만 있는 층일 수 있어요.</p></div>` : ''}
  </section>`;
}

export function buildingPage(name, params) {
  const { escape, route, top, iconLink } = ctx;
  const building = buildings.get(name);
  if (!building) return `${top('건물', iconLink('back', '뒤로', route('map')))}<main class="scroll empty">건물을 찾을 수 없어요.</main>`;
  const range = floorRange(building);
  const unknown = building.floors.get(null) || [];
  const hasStuff = n => guideOf(building, n).length || building.floors.has(n);
  const firstFloor = [...range].reverse().find(n => n > 0 && hasStuff(n)) ?? [...range].reverse().find(hasStuff) ?? range[range.length - 1] ?? null;
  const picked = params.has('floor') ? (params.get('floor') === 'none' ? null : Number(params.get('floor'))) : firstFloor;
  const official = building.official;
  const guideTotal = official ? Object.values(official.floors).reduce((sum, list) => sum + list.length, 0) : 0;
  const photo = building.photo
    ? `<figure class="building-photo"><img src="assets/${escape(building.photo.asset)}" alt="${escape(building.name)} 사진">
        <figcaption>${escape(building.photo.note || '')} · ${escape(building.photo.author || '')} / Wikimedia Commons · CC BY-SA 4.0</figcaption></figure>`
    : '';
  // 3D 층 쌓기: 층마다 얇은 판을 비스듬히 눕혀 위로 쌓는다. 안내·장소가 있는 층은 밝게, 없는 층은 흐리게
  const stack = range.length ? `<div class="floor-stack${range.length > 8 ? ' tall' : ''}" style="--floors:${range.length}" role="group" aria-label="${escape(building.name)} 층 선택">
      ${range.map((floor, i) => {
        const count = guideOf(building, floor).length + (building.floors.get(floor)?.length || 0);
        return `<a class="floor-slab${floor === picked ? ' on' : ''}${count ? ' has' : ''}" style="--i:${range.length - 1 - i}"
          href="${route('building', {name, floor})}" aria-current="${floor === picked}" aria-label="${escape(floorName(floor))} ${count}곳">
          <span class="slab-side"></span><span class="slab-top"></span>
          <span class="slab-tag"><b>${escape(floorLabel(floor))}</b>${count ? `<small>${count}</small>` : ''}</span></a>`;
      }).join('')}
    </div>` : '';
  const facts = [range[0] > 0 && `지상 ${range[0]}층`, range.at(-1) < 0 && `지하 ${-range.at(-1)}층`, guideTotal && `학교 안내 ${guideTotal}곳`, `누팁스 장소 ${building.places.length}곳`].filter(Boolean).join(' · ');
  return `${top(building.name, iconLink('back', '지도로', route('map')), iconLink('pin', '지도에서 보기', route('map', {focus:building.places[0].id})))}
    <main class="scroll building-page">
      ${photo}
      <section class="building-head">
        <h1>${official ? `<span class="building-code">${escape(official.code)}</span>` : ''}${escape(building.name)}</h1>
        <p>${facts}</p>
      </section>
      ${stack}
      ${range.length || unknown.length ? floorPanel(building, range.length ? picked : null, range) : ''}
      ${unknown.length && picked !== null ? `<a class="floor-unknown" href="${route('building', {name, floor:'none'})}">층 정보 없는 곳 ${unknown.length}곳 보기</a>` : ''}
      <p class="building-note">${official ? `층별 안내: 한국교통대학교 캠퍼스지도(${escape(collected)} 기준)${official.levels ? ' · 층수: © OpenStreetMap contributors' : ''}<br>` : ''}
        방 번호·도면은 아직 없어요. 장소를 누르면 주소와 설명을 볼 수 있어요.</p>
    </main>`;
}
