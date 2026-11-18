// 교내 건물: 장소를 건물마다 묶고, 건물 화면(#/building?name=…)에서 층을 3D 로 쌓아 보여준다.
// - 건물 이름은 places.json 의 location.building, 층은 주소·이름 속 「1층」「지하1층」「B1」에서 읽는다
// - 실제 도면(방 위치)은 데이터에 없어서 그리지 않는다. 층마다 「그 층에 무엇이 있는지」만 보여준다
// - 건물 사진은 그 건물 장소에 붙은 실제 사진(위키미디어 공용)이 있을 때만 쓴다

const NOT_BUILDING = new Set(['', '원본 지도 제보 지점']);
let ctx = null;            // app.js 에서 넘겨받는 도구 (escape, route, top, iconLink, placeRow, icon)
let buildings = new Map(); // 건물 이름 → {name, latlng, places, floors, photo}

// 「지하1층」「B1」 → -1, 「3층」 → 3, 없으면 null
export function floorOf(place) {
  const text = `${place.address || ''} ${place.name || ''}`;
  const under = /(?:지하\s*(\d+)\s*층?|\bB(\d+)\b)/.exec(text);
  if (under) return -Number(under[1] || under[2]);
  const floor = /(\d+)\s*층/.exec(text);
  return floor ? Number(floor[1]) : null;
}

const floorLabel = n => n == null ? '층 모름' : n < 0 ? `B${-n}` : `${n}F`;
const floorName = n => n == null ? '층 정보 없음' : n < 0 ? `지하 ${-n}층` : `${n}층`;

export function initBuildings(tools, places) {
  ctx = tools;
  buildings = new Map();
  for (const place of places) {
    const name = place.location?.building || '';
    if (place.area !== '교내' || !place.latlng || NOT_BUILDING.has(name)) continue;
    if (!buildings.has(name)) buildings.set(name, {name, places:[]});
    buildings.get(name).places.push(place);
  }
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
  }
}

export const buildingOf = place => buildings.get(place.location?.building || '') || null;
export const allBuildings = () => [...buildings.values()];

// 지도에 올릴 건물 핀 모양 (개수 + 이름)
export function buildingPinHtml(building, count, showName) {
  return `<span class="marker building-pin" title="${ctx.escape(building.name)}"><b>${count}</b>${showName ? `<span class="building-name">${ctx.escape(building.name)}</span>` : ''}</span>`;
}

// ---------- 건물 화면 ----------
function sortedFloors(building) {
  const known = [...building.floors.keys()].filter(n => n != null).sort((a, b) => b - a); // 위층부터
  return {known, unknown:building.floors.get(null) || []};
}

function floorList(building, floor) {
  const places = building.floors.get(floor) || [];
  return `<section class="floor-places" aria-live="polite">
    <h2>${ctx.escape(floorName(floor))} <small>${places.length}곳</small></h2>
    <div class="places">${places.map(p => ctx.placeRow(p)).join('')}</div>
  </section>`;
}

export function buildingPage(name, params) {
  const { escape, route, top, iconLink } = ctx;
  const building = buildings.get(name);
  if (!building) return `${top('건물', iconLink('back', '뒤로', route('map')))}<main class="scroll empty">건물을 찾을 수 없어요.</main>`;
  const {known, unknown} = sortedFloors(building);
  const picked = params.has('floor') ? (params.get('floor') === 'none' ? null : Number(params.get('floor'))) : (known.length ? known[known.length - 1] : null);
  const photo = building.photo
    ? `<figure class="building-photo"><img src="assets/${escape(building.photo.asset)}" alt="${escape(building.name)} 사진">
        <figcaption>${escape(building.photo.note || '')} · ${escape(building.photo.author || '')} / Wikimedia Commons · CC BY-SA 4.0</figcaption></figure>`
    : '';
  // 3D 층 쌓기: 층마다 얇은 판을 비스듬히 눕혀 위로 쌓는다. 장소가 있는 층만 있다(데이터에 없는 층은 그리지 않음)
  const stack = known.length ? `<div class="floor-stack" style="--floors:${known.length}" role="group" aria-label="${escape(building.name)} 층 선택">
      ${known.map((floor, i) => `<a class="floor-slab${floor === picked ? ' on' : ''}" style="--i:${known.length - 1 - i}"
          href="${route('building', {name, floor})}" aria-current="${floor === picked}" aria-label="${escape(floorName(floor))} ${building.floors.get(floor).length}곳">
          <span class="slab-top"><b>${escape(floorLabel(floor))}</b><small>${building.floors.get(floor).length}곳</small></span><span class="slab-side"></span></a>`).join('')}
    </div>` : '';
  return `${top(building.name, iconLink('back', '지도로', route('map')), iconLink('pin', '지도에서 보기', route('map', {focus:building.places[0].id})))}
    <main class="scroll building-page">
      ${photo}
      <section class="building-head">
        <h1>${escape(building.name)}</h1>
        <p>장소·정보 ${building.places.length}곳${known.length ? ` · ${known.length}개 층` : ''}</p>
      </section>
      ${stack}
      ${known.length || unknown.length ? floorList(building, known.length ? picked : null) : ''}
      ${unknown.length && picked !== null ? `<a class="floor-unknown" href="${route('building', {name, floor:'none'})}">층 정보 없는 곳 ${unknown.length}곳 보기</a>` : ''}
      <p class="building-note">층 안의 자세한 위치(방 번호·도면)는 아직 없어요. 장소를 누르면 주소와 설명을 볼 수 있어요.</p>
    </main>`;
}
