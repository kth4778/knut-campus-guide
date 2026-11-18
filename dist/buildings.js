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
  // 같은 공식 건물을 앱에서 두 이름으로 부르면(「경영항공관」「경영항공관 · SPACE K」) 하나로 합친다
  const byCode = new Map();
  for (const [name, building] of buildings) {
    building.official = official.find(b => b.names.some(n => squash(n) === squash(name))) || null;
    const same = building.official && byCode.get(building.official.code);
    if (same) {
      same.places.push(...building.places);
      if (squash(name) === squash(building.official.names[0])) same.name = name; // 공식 이름과 같은 쪽을 화면 이름으로
      buildings.set(name, same);
      continue;
    }
    if (building.official) byCode.set(building.official.code, building);
  }
  // 앱 장소가 하나도 없는 공식 건물도 층별 안내를 볼 수 있게 등록한다
  for (const b of official) {
    if (byCode.has(b.code) || !b.latlng) continue;
    const name = b.name.replaceAll('/', '·').replaceAll(',', '·');
    const building = {name, places:[], official:b};
    buildings.set(name, building);
    byCode.set(b.code, building);
  }
  for (const building of new Set(buildings.values())) {
    // 건물 좌표: OSM 건물 외곽선의 가운데. 없으면 그 건물 장소들이 가장 많이 가리키는 점
    const votes = new Map();
    building.places.forEach(p => { const key = p.latlng.join(); votes.set(key, (votes.get(key) || 0) + 1); });
    building.latlng = building.official?.latlng || [...votes.entries()].sort((a, b) => b[1] - a[1])[0][0].split(',').map(Number);
    building.floors = new Map();
    for (const place of building.places) {
      const floor = floorOf(place);
      if (!building.floors.has(floor)) building.floors.set(floor, []);
      building.floors.get(floor).push(place);
    }
    building.photo = building.places.find(p => p.cover?.asset)?.cover || null;
    building.type = typeOf(building.official?.name || building.name);
  }
}

// 건물 이름 → 지도 아이콘 종류 (assets/building-types/*.webp)
function typeOf(name) {
  if (/도서관/.test(name)) return 'library';
  if (/생활관|관리동/.test(name)) return 'dorm';
  if (/본부/.test(name)) return 'admin';
  if (/아레나|운동장|테니스/.test(name)) return 'sports';
  if (/실험|실습|시험동|생산동|화학|창업/.test(name)) return 'lab';
  if (/학생회관|동아리|학군단/.test(name)) return 'student';
  if (/극장|쉼터|정문/.test(name)) return 'culture';
  return 'lecture';
}

export const buildingOf = place => buildings.get(place.location?.building?.trim() || '') || null;
// 지도 첫 화면에 올릴 건물: 학교 건물 코드(E8·W3 …)가 있고 자리를 아는 건물
export const mapBuildings = () => [...new Set(buildings.values())].filter(b => b.official && b.latlng);
// 학교 안내 수 (「1~9층 중원생활관」처럼 여러 층에 걸친 것은 한 번만 센다)
export const guideCount = building => new Set(Object.values(building.official?.floors || {}).flat()).size;

// 지도에 올릴 건물 핀 모양 (개수 + 이름) — 장소 칩을 골랐을 때 장소를 건물마다 묶은 핀
export function buildingPinHtml(building, count, showName) {
  return `<span class="marker building-pin" title="${ctx.escape(building.name)}"><b>${count}</b>${showName ? `<span class="building-name">${ctx.escape(building.name)}</span>` : ''}</span>`;
}

// 지도 첫 화면의 건물 표시. full = 그림+코드+이름, short = 그림+코드, code = 코드만, dot = 작은 점(그래도 겹칠 때)
export const shortName = building => (building.official?.name || building.name).split('/')[0].replaceAll(',', '·');
export function buildingMarkHtml(building, size) {
  const { escape } = ctx;
  const code = building.official?.code || '';
  if (size === 'dot') return `<span class="bmark dot" title="${escape(code)} ${escape(building.name)}"></span>`;
  if (size === 'code') return `<span class="bmark code" title="${escape(code)} ${escape(building.name)}"><b>${escape(code)}</b></span>`;
  return `<span class="bmark ${size}" title="${escape(code)} ${escape(building.name)}"><img src="assets/building-types/${building.type}.webp" alt="">`
    + `<b>${escape(code)}</b>${size === 'full' ? `<span>${escape(shortName(building))}</span>` : ''}</span>`;
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

// ---------- 3D 건물 (실제 바닥 모양으로 층 쌓기) ----------
// OSM 외곽선(미터)을 비스듬히(아이소메트릭) 눕혀 층마다 쌓는다. 층 = 바닥판(진하게) + 유리벽(반투명).
// 보는 쪽(남서쪽)을 향한 벽만 그리고, 아래층부터 그려 위층이 자연스럽게 덮는다. 외곽선이 없으면 정사각형으로
const COS = Math.cos(Math.PI / 6), SIN = Math.sin(Math.PI / 6);
const SQUARE = [[-15, -15], [15, -15], [15, 15], [-15, 15]];

function isoStack(building, range, picked) {
  const { escape, route } = ctx;
  const shape = building.official?.shape || SQUARE;
  const flat = shape.map(([x, y]) => [(x - y) * COS, -(x + y) * SIN]);
  const xs = flat.map(p => p[0]), ys = flat.map(p => p[1]);
  const scale = Math.min(170 / (Math.max(...xs) - Math.min(...xs)), 80 / (Math.max(...ys) - Math.min(...ys)));
  const floors = [...range].reverse(); // 아래층부터
  const step = floors.length > 8 ? 15 : floors.length > 5 ? 21 : 27; // 한 층 높이(px)
  const slab = Math.max(4, step * .26);                                // 바닥판 두께
  const left = 20 - Math.min(...xs) * scale;
  const groundY = (Math.max(...ys) - Math.min(...ys)) * scale + floors.length * step + 26;
  const baseY = groundY - Math.max(...ys) * scale;
  const at = (i, lift) => flat.map(([x, y]) => [left + x * scale, baseY + y * scale - i * step - lift]);
  const pts = list => list.map(p => p.map(n => n.toFixed(1)).join(',')).join(' ');
  // 보는 쪽(남서)을 향한 벽: 바깥쪽 법선이 (-1,-1) 쪽이면 보인다. 먼 벽부터
  const walls = shape.map((a, i) => [a, shape[(i + 1) % shape.length], i])
    .filter(([a, b]) => -((b[1] - a[1]) + -(b[0] - a[0])) > 0)
    .sort((p, q) => (q[0][0] + q[0][1] + q[1][0] + q[1][1]) - (p[0][0] + p[0][1] + p[1][0] + p[1][1]));
  const lightSide = ([a, b]) => (b[1] - a[1]) > -(b[0] - a[0]) ? 'r' : 'l'; // 남쪽 벽 / 서쪽 벽 명암
  const wallPoly = (i, from, to, [, , k]) => {
    const lo = at(i, from), hi = at(i, to), j = (k + 1) % shape.length;
    return pts([hi[k], hi[j], lo[j], lo[k]]);
  };
  // 유리벽의 창틀: 보이는 벽마다 약 4.5m 간격으로 세로줄
  const project = ([x, y], i, lift) => [left + (x - y) * COS * scale, baseY - (x + y) * SIN * scale - i * step - lift];
  const mullions = i => walls.map(([a, b]) => {
    const n = Math.floor(Math.hypot(b[0] - a[0], b[1] - a[1]) / 4.5);
    return Array.from({length:Math.max(0, n - 1)}, (_, k) => {
      const t = (k + 1) / n, p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      const lo = project(p, i, slab), hi = project(p, i, step);
      return `M${lo[0].toFixed(1)} ${lo[1].toFixed(1)}V${hi[1].toFixed(1)}`;
    }).join('');
  }).join('');
  const right = Math.max(...flat.map(p => left + p[0] * scale));
  const midY = ys.reduce((a, b) => a + b, 0) / ys.length;
  const tagH = Math.min(20, step - 2);
  const labelX = Math.max(right + 22, 214);
  const body = floors.map((floor, i) => {
    const count = guideOf(building, floor).length + (building.floors.get(floor)?.length || 0);
    const cls = `fl${floor === picked ? ' on' : ''}${count ? ' has' : ''}`;
    const glass = walls.map(w => `<polygon class="glass ${lightSide(w)}" points="${wallPoly(i, slab, step, w)}"/>`).join('');
    const slabs = walls.map(w => `<polygon class="edge ${lightSide(w)}" points="${wallPoly(i, 0, slab, w)}"/>`).join('');
    const labelY = baseY + midY * scale - i * step - step / 2; // 그 층 가운데 높이
    const anchor = at(i, step / 2).reduce((best, p) => p[0] > best[0] ? p : best);
    return `<g class="${cls}"><polygon class="plate" points="${pts(at(i, slab))}"/>${slabs}${glass}<path class="mullion" d="${mullions(i)}"/></g>
      <a class="floor-slab${floor === picked ? ' on' : ''}${count ? ' has' : ''}" href="${route('building', {name:building.name, floor})}"
        aria-current="${floor === picked}" aria-label="${escape(floorName(floor))} ${count}곳">
        <rect class="hit" x="0" y="${(labelY - step / 2).toFixed(1)}" width="330" height="${step}"/>
        <line class="lead" x1="${anchor[0].toFixed(1)}" y1="${anchor[1].toFixed(1)}" x2="${labelX - 6}" y2="${labelY.toFixed(1)}"/>
        <rect class="tag" x="${labelX}" y="${(labelY - tagH / 2).toFixed(1)}" rx="${tagH / 2}" width="${count ? 58 : 38}" height="${tagH}"/>
        <text class="tag-text" x="${labelX + 9}" y="${(labelY + 4).toFixed(1)}">${escape(floorLabel(floor))}</text>
        ${count ? `<circle class="tag-count" cx="${labelX + 44}" cy="${labelY.toFixed(1)}" r="${tagH / 2 - 2}"/><text class="tag-count-text" x="${labelX + 44}" y="${(labelY + 3.5).toFixed(1)}">${count}</text>` : ''}
      </a>`;
  }).join('');
  const top = floors.length;
  const roof = `<polygon class="iso-roof" points="${pts(at(top, 0))}"/>${walls.map(w => `<polygon class="edge ${lightSide(w)}" points="${wallPoly(top, -slab, 0, w)}"/>`).join('')}`;
  const shadow = `<polygon class="shadow" points="${pts(at(0, -4))}"/>`;
  return `<figure class="iso-building">
    <svg viewBox="0 0 330 ${(groundY + 14).toFixed(0)}" role="group" aria-label="${escape(building.name)} 층 선택">
      <defs><filter id="iso-blur"><feGaussianBlur stdDeviation="6"/></filter></defs>
      ${shadow}${body.replace(/<a [\s\S]*?<\/a>/g, '')}${roof}${(body.match(/<a [\s\S]*?<\/a>/g) || []).join('')}
      <g class="compass" transform="translate(300 ${(groundY - 10).toFixed(0)})"><path d="M0-11 4 0 0-3-4 0Z"/><text y="11">N</text></g>
    </svg>
    <figcaption>${building.official?.shape ? '바닥 모양: OpenStreetMap 건물 외곽선' : '바닥 모양 정보가 없어 사각형으로 그렸어요'} · 층을 누르면 그 층 안내</figcaption>
  </figure>`;
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
  const guideTotal = guideCount(building);
  const photo = building.photo
    ? `<figure class="building-photo"><img src="assets/${escape(building.photo.asset)}" alt="${escape(building.name)} 사진">
        <figcaption>${escape(building.photo.note || '')} · ${escape(building.photo.author || '')} / Wikimedia Commons · CC BY-SA 4.0</figcaption></figure>`
    : '';
  const stack = range.length ? isoStack(building, range, picked) : '';
  const facts = [range[0] > 0 && `지상 ${range[0]}층`, range.at(-1) < 0 && `지하 ${-range.at(-1)}층`, guideTotal && `학교 안내 ${guideTotal}곳`, building.places.length && `누팁스 장소 ${building.places.length}곳`].filter(Boolean).join(' · ');
  return `${top(building.name, iconLink('back', '지도로', route('map')), building.places.length ? iconLink('pin', '지도에서 보기', route('map', {focus:building.places[0].id})) : '')}
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
