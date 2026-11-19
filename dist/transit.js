// 버스 · 고속버스 (국토교통부 TAGO 공공데이터). 누팁스(KNUTIPS) 앱의 기능을 옮겨 왔어요.
// API 키는 config.js 의 window.KNUT_CONFIG.BUS_API_KEY 에서 읽어요. 없으면 위치와 지도 링크만 보여요.

// 학교 주변 시내버스 정류장 (위치 © OpenStreetMap 기여자, no = 정류장 번호)
// node = TAGO 정류소 ID (충주시). 미리 적어 두어 정류장을 누르면 「정류소 찾기」 없이 바로 도착 정보를 묻는다
//   (2026-11-19 TAGO 좌표 근처 정류소 조회로 번호 → 이름 → 거리 순으로 맞춤)
export const BUS_STOPS = [
  {id:"bus8069151342", name:"검단리", no:"", latlng:[36.9670611, 127.8755407], node:"CHB272043004"},
  {id:"bus7883538065", name:"교통대(철도뒷길.시내방향)", no:"", latlng:[36.9620796, 127.871188], node:"CHB272064450"},
  {id:"bus7883538064", name:"교통대(철도뒷편.대소원방향)", no:"", latlng:[36.9621826, 127.8708181], node:"CHB272064449"},
  {id:"bus7883538058", name:"상검단", no:"", latlng:[36.9638845, 127.8637894], node:"CHB272043027"},
  {id:"bus7899541878", name:"상검단(상검단교)", no:"64070", latlng:[36.9678433, 127.8658047], node:"CHB272064070"},
  {id:"bus7899541877", name:"상검단(상검단교건너편)", no:"43028", latlng:[36.9679595, 127.8658358], node:"CHB272043028"},
  {id:"bus7945418661", name:"하검단리(하검단교)", no:"", latlng:[36.9723034, 127.8781254], node:"CHB272043066"},
  {id:"bus7945418662", name:"하검단리(하검단교건너편)", no:"", latlng:[36.972371, 127.8780343], node:"CHB272043067"},
  {id:"bus7258635086", name:"한국교통대 (대학본부)", no:"43069", latlng:[36.9707078, 127.8719474], node:"CHB272043069"},
  {id:"bus7258635087", name:"한국교통대 (대학본부건너편)", no:"43077", latlng:[36.970621, 127.8718724], node:"CHB272043077"},
  {id:"bus12299733741", name:"한국교통대 (스마트ICT관)", no:"64643", latlng:[36.9705303, 127.8746056], node:"CHB272064643"},
  {id:"bus12684305967", name:"한국교통대 (정문)", no:"43075", latlng:[36.9667185, 127.8721183], node:"CHB272043075"},
  {id:"bus7258635085", name:"한국교통대 (체육관)", no:"43076", latlng:[36.967993, 127.8715393], node:"CHB272043076"},
  {id:"bus7258635084", name:"한국교통대 (체육관건너편)", no:"43071", latlng:[36.9680665, 127.8718082], node:"CHB272043071"},
  {id:"bus7881714883", name:"한국교통대 (회차지)", no:"43078", latlng:[36.9727647, 127.8707643], node:"CHB272043078"},
  {id:"bus7883538059", name:"한국교통대(농협)", no:"43070", latlng:[36.9630457, 127.8700693], node:"CHB272043070"},
  {id:"bus4654355183", name:"한국교통대(농협.건너편)", no:"43072", latlng:[36.9625221, 127.8715314], node:"CHB272043072"},
  {id:"bus8059307234", name:"한국교통대(시내방향)", no:"43073", latlng:[36.9652493, 127.8711099], node:"CHB272043073"},
  {id:"bus8059307233", name:"한국교통대(요거프레소앞)", no:"", latlng:[36.9645239, 127.8709608], node:"CHB272043073"},
  {id:"bus8059307235", name:"한국교통대(정문방향)", no:"43074", latlng:[36.9652033, 127.8714065], node:"CHB272043074"},
];

const BUS_API = 'https://apis.data.go.kr/1613000';
const CITY = 33020; // 충주시
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad = n => String(n).padStart(2, '0');
const clock = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const busKey = () => String(window.KNUT_CONFIG?.BUS_API_KEY ?? '').trim();

// 개발계정은 초당 요청 수 제한이 있어서, 요청을 줄 세워 간격을 두고 보내요.
// 사람이 기다리는 요청(정류장 도착 정보)은 줄 맨 앞에 세워, 20초마다 도는 버스 위치 요청 뒤에서 기다리지 않게 해요.
const queue = {busy:0, wait:[], last:0};
function apiFetch(url, urgent = false) {
  return new Promise((ok, no) => { queue.wait[urgent ? 'unshift' : 'push']([url, ok, no, urgent]); pump(); });
}
function pump() {
  if (!queue.wait.length || queue.busy >= (queue.wait[0][3] ? 3 : 2)) return; // 급한 요청은 한 칸 더 열어 준다
  const gap = 150 - (Date.now() - queue.last);
  if (gap > 0) { setTimeout(pump, gap); return; }
  const [url, ok, no] = queue.wait.shift();
  queue.busy++;
  queue.last = Date.now();
  fetch(url).then(ok, no).finally(() => { queue.busy--; pump(); });
  pump();
}

async function tago(path, params, {retry = 1, urgent = false} = {}) {
  const query = new URLSearchParams({numOfRows:100, pageNo:1, _type:'json', ...params});
  // 인코딩된 키를 그대로 붙여야 해요 (URLSearchParams 로 넣으면 한 번 더 인코딩돼요)
  const response = await apiFetch(`${BUS_API}/${path}?serviceKey=${busKey()}&${query}`, urgent);
  let data;
  try { data = await response.json(); }
  catch { throw new Error(response.status === 403 ? '키가 등록되지 않았어요' : '응답 오류 ' + response.status); }
  const errMsg = data.OpenAPI_ServiceResponse?.cmmMsgHeader?.errMsg || '';
  if (/PER_SECOND/.test(errMsg) && retry) {
    await new Promise(wait => setTimeout(wait, 400));
    return tago(path, params, {retry:retry - 1, urgent});
  }
  const head = data.response?.header;
  if (!head) throw new Error(errMsg || '응답 오류 ' + response.status);
  if (head.resultCode !== '00') throw new Error(head.resultMsg || 'API 오류');
  const items = data.response?.body?.items?.item;
  return items ? [].concat(items) : [];
}

// ---------- 시내버스 정류장: 실시간 도착 ----------
const stopNodes = {};
const squash = text => String(text).replace(/[\s.()·]/g, '').replace('한국교통대', '교통대');
async function arrivals(stop) {
  if (!stopNodes[stop.id]) {
    if (stop.node) stopNodes[stop.id] = {citycode:CITY, nodeid:stop.node};
    else { // 정류소 ID를 모르는 정류장만: 좌표 근처 정류소를 찾아 번호 → 이름 → 거리 순으로 고른다
      const [lat, lng] = stop.latlng;
      const near = await tago('BusSttnInfoInqireService/getCrdntPrxmtSttnList', {gpsLati:lat, gpsLong:lng, numOfRows:30}, {urgent:true});
      if (!near.length) throw new Error('정류장을 찾지 못했어요');
      const dist = node => Math.hypot(node.gpslati - lat, node.gpslong - lng);
      stopNodes[stop.id] = near.find(node => stop.no && String(node.nodeno) === stop.no)
        || near.find(node => squash(node.nodenm) === squash(stop.name)) || near.sort((a, b) => dist(a) - dist(b))[0];
    }
  }
  const node = stopNodes[stop.id];
  const list = await tago('ArvlInfoInqireService/getSttnAcctoArvlPrearngeInfoList', {cityCode:node.citycode, nodeId:node.nodeid, numOfRows:50}, {urgent:true});
  return list.sort((a, b) => a.arrtime - b.arrtime);
}
// 마지막으로 받은 도착 정보 (정류장을 다시 열면 기다리지 않고 먼저 보여 주고 뒤에서 새로 받는다)
const arrivalCache = {};

export function mapLinks(name, [lat, lng]) {
  const naver = `https://map.naver.com/p/search/${encodeURIComponent(name)}?c=${lng},${lat},17,0,0,0,dh`;
  const kakao = `https://map.kakao.com/link/map/${encodeURIComponent(name)},${lat},${lng}`;
  return `<div class="transit-links"><a class="pill" href="${esc(naver)}" target="_blank" rel="noopener">네이버 지도</a><a class="pill" href="${esc(kakao)}" target="_blank" rel="noopener">카카오맵</a></div>`;
}

// 정류장 시트 내용을 그리고 30초마다 갱신해요. 시트를 닫을 때 부를 정리 함수를 돌려줘요.
export function mountBusStop(body, stop, {onLive} = {}) {
  const head = `<p class="transit-sub">${stop.no ? '정류장 번호 ' + esc(stop.no) : '시내버스 정류장'}</p>`;
  if (!busKey()) {
    body.innerHTML = head + '<p class="transit-note">config.js 에 버스 API 키를 넣으면 실시간 도착 정보가 나와요.</p>' + mapLinks(stop.name, stop.latlng);
    return () => {};
  }
  body.innerHTML = head + '<div class="transit-live"><p class="transit-note">도착 정보를 불러오는 중…</p></div>' + mapLinks(stop.name, stop.latlng);
  let alive = true;
  const draw = (list, at) => {
    const box = alive && body.querySelector('.transit-live');
    if (!box) return;
    box.innerHTML = (list.length
      ? `<ul class="arrivals">${list.slice(0, 8).map(bus => {
          const mins = Math.floor(bus.arrtime / 60);
          const route = String(bus.routeno);
          return `<li><b>${esc(route)}번</b><span>${mins < 1 ? '곧 도착' : mins + '분 후'}</span>
            <small>${bus.arrprevstationcnt ? bus.arrprevstationcnt + '정거장 전' : ''}</small>
            ${onLive ? `<button type="button" class="pill" data-live="${esc(route)}">위치</button>` : ''}</li>`;
        }).join('')}</ul>`
      : '<p class="transit-note">지금 도착 예정인 버스가 없어요.</p>')
      + `<p class="transit-foot">${clock(at)} 기준 · 30초마다 갱신 <button type="button" data-refresh>새로고침</button></p>`;
  };
  const cached = arrivalCache[stop.id];
  if (cached && Date.now() - cached.at < 120000) draw(cached.list, new Date(cached.at)); // 2분 안에 본 정류장은 바로 보여 준다
  const load = () => arrivals(stop).then(list => {
    arrivalCache[stop.id] = {list, at:Date.now()};
    draw(list, new Date());
  }).catch(error => {
    const box = alive && body.querySelector('.transit-live');
    if (box && !box.querySelector('.arrivals')) box.innerHTML = `<p class="transit-note">도착 정보를 못 불러왔어요 (${esc(error.message)})</p>`;
  });
  body.onclick = event => {
    const live = event.target.closest('[data-live]');
    if (live && onLive) { onLive(live.dataset.live); return; }
    const refresh = event.target.closest('[data-refresh]');
    if (refresh) { refresh.textContent = '불러오는 중…'; load(); }
  };
  load();
  const timer = setInterval(() => { if (!document.hidden) load(); }, 30000);
  return () => { alive = false; clearInterval(timer); };
}

// ---------- 고속버스: 시간표·요금(TAGO 고속버스정보) + 달리는 버스 위치(TAGO 고속버스도착정보) ----------
export const EXP_TERMINALS = [
  {code:'422', name:'교통대 고속버스 정류소', short:'교통대', latlng:[36.963086, 127.869625]},
  {code:'420', name:'충주 고속버스터미널', short:'충주터미널', latlng:[36.982041, 127.914885]},
];
const EXP_NAMES = {'021':'센트럴시티', '030':'동서울', '116':'고양백석', '420':'충주터미널', '422':'교통대'};
// API에서 운행이 확인된 노선 (터미널 코드). 동서울→충주는 이 API에 없어요.
const EXP_ROUTES = {
  '420': {out:['021', '030', '116'], inn:['021', '116']},
  '422': {out:['021', '030'], inn:['021']},
};
const won = n => (+n || 0).toLocaleString('ko-KR') + '원';
const ymd = d => d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate());
const hm = n => { const s = String(n); return s.slice(8, 10) + ':' + s.slice(10, 12); }; // 202611121610 → 16:10
const toDate = n => { const s = String(n); return new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8), +s.slice(8, 10), +s.slice(10, 12)); };
const expMinutes = text => { const m = /(\d+)시간\s*(\d+)분/.exec(text || ''); return m ? +m[1] * 60 + +m[2] : null; };
const duration = n => n <= 0 ? '곧' : ((n >= 60 ? Math.floor(n / 60) + '시간 ' : '') + (n % 60 ? (n % 60) + '분' : '')).trim();
const timetableCache = {};

function timetable(dep, arr, day) {
  const key = `${dep}:${arr}:${day}`;
  timetableCache[key] ??= tago('ExpBusInfo/GetStrtpntAlocFndExpbusInfo', {depTerminalId:'NAEK' + dep, arrTerminalId:'NAEK' + arr, depPlandTime:day, numOfRows:200})
    .then(list => list.sort((a, b) => a.depPlandTime - b.depPlandTime))
    .catch(error => { delete timetableCache[key]; throw error; });
  return timetableCache[key];
}
const runningBuses = (dep, arr) => tago('ExpBusArrInfo/GetExpBusArrPrdtInfo', {depTmnCd:dep, arrTmnCd:arr}).catch(() => []);

// 터미널 시트: 방향·도착지·날짜를 고르면 시간표와 달리는 버스를 보여주고 1분마다 갱신해요.
export function mountExpress(body, terminal, {extra = ''} = {}) {
  const routes = EXP_ROUTES[terminal.code];
  const state = {dir:'out', arr:routes.out[0], day:0, showPast:false};
  if (!busKey()) {
    body.innerHTML = '<p class="transit-note">config.js 에 버스 API 키를 넣으면 고속버스 시간표와 요금이 나와요.</p>' + extra + mapLinks(terminal.name, terminal.latlng);
    return () => {};
  }
  let alive = true;
  const chip = (attr, on, label, disabled = false) => `<button type="button" class="chip" ${attr} aria-pressed="${on}" ${disabled ? 'disabled' : ''}>${esc(label)}</button>`;
  const draw = () => {
    const targets = state.dir === 'out' ? routes.out : routes.inn;
    const days = [0, 1, 2].map(i => { const d = new Date(); d.setDate(d.getDate() + i); return [i, i === 0 ? '오늘' : i === 1 ? '내일' : `${d.getMonth() + 1}/${d.getDate()}`]; });
    body.innerHTML = `<p class="transit-sub">고속버스 시간표·요금 · 달리는 버스 실시간 위치</p>
      <div class="exp-seg">${chip('data-dir="out"', state.dir === 'out', terminal.short + '에서 출발')}${chip('data-dir="in"', state.dir === 'in', terminal.short + '(으)로 오기', !routes.inn.length)}</div>
      <div class="exp-chips">${targets.map(code => chip(`data-arr="${code}"`, code === state.arr, (state.dir === 'out' ? '→ ' : '← ') + (EXP_NAMES[code] || code))).join('')}</div>
      <div class="exp-chips">${days.map(([i, label]) => chip(`data-day="${i}"`, i === state.day, label)).join('')}</div>
      <div class="exp-list"><p class="transit-note">불러오는 중…</p></div>${extra}`;
    load();
  };
  const load = async () => {
    const snap = `${state.dir}|${state.arr}|${state.day}`;
    const dep = state.dir === 'out' ? terminal.code : state.arr;
    const arr = state.dir === 'out' ? state.arr : terminal.code;
    const date = new Date();
    date.setDate(date.getDate() + state.day);
    try {
      const [list, live] = await Promise.all([timetable(dep, arr, ymd(date)), state.day === 0 ? runningBuses(dep, arr) : []]);
      const box = body.querySelector('.exp-list');
      if (!alive || !box || `${state.dir}|${state.arr}|${state.day}` !== snap) return;
      const now = new Date();
      // 달리는 버스는 출발 시각(HH:MM)으로 시간표 칸과 짝지어요.
      const liveByTime = {};
      live.forEach(bus => { (liveByTime[bus.depTm] ??= []).push(bus); });
      const rows = list.map(item => {
        const depTime = toDate(item.depPlandTime);
        const bus = (liveByTime[hm(item.depPlandTime)] || []).shift();
        const arrived = bus && (bus.curLocNm === '도착' || bus.rmnTm === '도착완료');
        const status = bus ? (arrived ? 'done' : 'run') : depTime > now ? 'wait' : toDate(item.arrPlandTime) > now ? 'gone' : 'done';
        return {item, bus, depTime, status};
      });
      const nextIndex = rows.findIndex(row => row.status === 'wait');
      const visible = rows.filter(row => state.showPast || row.status !== 'done');
      const hidden = rows.length - visible.length;
      const rowHtml = row => {
        const {item, bus, depTime, status} = row;
        const mins = Math.round((depTime - now) / 60000);
        let right = '<small>운행 끝</small>';
        if (status === 'run') { const m = expMinutes(bus.rmnTm); right = `<b class="run">${m != null ? duration(m) + ' 후 도착' : esc(bus.rmnTm)}</b><small>${esc(bus.curLocNm)}</small>`; }
        else if (status === 'wait') right = state.day === 0 ? `<b class="${mins <= 30 ? 'soon' : ''}">${mins <= 0 ? '곧 출발' : duration(mins) + ' 후 출발'}</b>` : '';
        else if (status === 'gone') right = `<b class="run">운행 중</b><small>${hm(item.arrPlandTime)} 도착 예정</small>`;
        const premium = /우등|프리미엄/.test(item.gradeNm || '');
        return `<div class="exp-row${status === 'done' ? ' past' : ''}${rows.indexOf(row) === nextIndex ? ' next' : ''}">
          <div><b>${hm(item.depPlandTime)}</b> <span>→ ${hm(item.arrPlandTime)}</span>
            <small><span class="grade${premium ? ' premium' : ''}">${esc(item.gradeNm)}</span> ${won(item.charge)}${bus ? ' · ' + esc(bus.corpNm) : ''}</small></div>
          <div class="exp-right">${right}</div></div>`;
      };
      const cheapest = list.length ? Math.min(...list.map(item => +item.charge || 1e9)) : 0;
      box.innerHTML = !list.length ? '<p class="transit-note">이 날은 운행하는 버스가 없어요.</p>'
        : `<p class="transit-sub">${list.length}회 운행 · ${won(cheapest)}부터 · 약 ${duration(Math.round((toDate(list[0].arrPlandTime) - toDate(list[0].depPlandTime)) / 60000))} 걸려요</p>`
          + (hidden && !state.showPast ? `<button type="button" class="pill exp-past" data-past>지난 차 ${hidden}대 보기</button>` : '')
          + (visible.length ? visible.map(rowHtml).join('') : '<p class="transit-note">오늘 남은 버스가 없어요. 내일 시간표를 확인해 보세요.</p>')
          + `<p class="transit-foot">${state.day === 0 ? clock(now) + ' 기준 · 1분마다 위치 갱신 <button type="button" data-refresh>새로고침</button>' : '예매는 고속버스 예매 앱에서 해요'}</p>`;
    } catch (error) {
      const box = body.querySelector('.exp-list');
      if (alive && box) box.innerHTML = `<p class="transit-note">못 불러왔어요 (${esc(error.message)})</p>`;
    }
  };
  body.onclick = event => {
    const target = event.target.closest('button');
    if (!target || target.disabled) return;
    if (target.dataset.dir) { state.dir = target.dataset.dir; state.arr = (state.dir === 'out' ? routes.out : routes.inn)[0]; state.showPast = false; draw(); }
    else if (target.dataset.arr) { state.arr = target.dataset.arr; state.showPast = false; draw(); }
    else if (target.dataset.day) { state.day = +target.dataset.day; state.showPast = false; draw(); }
    else if ('past' in target.dataset) { state.showPast = true; load(); }
    else if ('refresh' in target.dataset) { target.textContent = '불러오는 중…'; load(); }
  };
  draw();
  const timer = setInterval(() => { if (!document.hidden && state.day === 0) load(); }, 60000);
  return () => { alive = false; clearInterval(timer); };
}

// ---------- 실시간 시내버스 위치 (TAGO 버스위치정보) ----------
// 학교 주변 정류장을 지나는 노선 목록은 data/bus-routes.json (TAGO, 2026-11-12 기준)에 넣어 뒀어요.
// 하루 호출 한도 때문에 고른 노선(최대 LIVE_MAX개)만 20초마다 위치를 받아요.
export const LIVE_MAX = 4;
export const LIVE_EVERY = 20000;
export const liveColor = no => /급행/.test(no) ? '#e5483f' : String(no) === '999' ? '#9b2a2e' : '#4f9a1c';
export const routeSort = (a, b) => (parseInt(a) || 9999) - (parseInt(b) || 9999) || a.localeCompare(b);

let routeIndexReady;
export function routeIndex() {
  routeIndexReady ??= fetch('./data/bus-routes.json')
    .then(response => { if (!response.ok) throw new Error('노선 목록 없음'); return response.json(); })
    .catch(error => { routeIndexReady = null; throw error; });
  return routeIndexReady;
}

// 고른 노선 번호들의 버스 위치. 일부 노선이 실패해도 받은 것만 돌려줘요.
export async function liveBuses(numbers, index) {
  const jobs = [];
  numbers.forEach(no => Object.entries(index[no] || {}).forEach(([routeId, dir]) => jobs.push(
    tago('BusLcInfoInqireService/getRouteAcctoBusLcList', {cityCode:CITY, routeId})
      .then(list => list.map(bus => ({no, dir, vehicleno:bus.vehicleno, latlng:[+bus.gpslati, +bus.gpslong], nodenm:bus.nodenm, nodeord:bus.nodeord}))),
  )));
  const results = await Promise.allSettled(jobs);
  const buses = results.filter(r => r.status === 'fulfilled').flatMap(r => r.value).filter(bus => bus.latlng[0] && bus.latlng[1]);
  const failed = results.find(r => r.status === 'rejected');
  let error = '';
  if (failed && !buses.length) error = /등록|SERVICE_KEY|NOT_REGISTERED/.test(failed.reason?.message || '') ? '버스위치정보 API 활용신청이 필요해요' : '위치를 못 불러왔어요';
  return {buses, error};
}

export function liveBusInfo(bus) {
  return `<p class="transit-sub">${esc(bus.dir)} · 차량 ${esc(bus.vehicleno || '')}</p>
    <p class="live-now">지금 <b>${esc(bus.nodenm || '')}</b> 근처 (${esc(bus.nodeord)}번째 정류장)</p>
    <p class="transit-foot">20초마다 위치가 갱신돼요</p>`;
}
