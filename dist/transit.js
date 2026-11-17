// 버스 · 고속버스 (국토교통부 TAGO 공공데이터). 누팁스(KNUTIPS) 앱의 기능을 옮겨 왔어요.
// API 키는 config.js 의 window.KNUT_CONFIG.BUS_API_KEY 에서 읽어요. 없으면 위치와 지도 링크만 보여요.

// 학교 주변 시내버스 정류장 (위치 © OpenStreetMap 기여자, no = 정류장 번호)
export const BUS_STOPS = [
  {id:"bus8069151342", name:"검단리", no:"", latlng:[36.9670611, 127.8755407]},
  {id:"bus7883538065", name:"교통대(철도뒷길.시내방향)", no:"", latlng:[36.9620796, 127.871188]},
  {id:"bus7883538064", name:"교통대(철도뒷편.대소원방향)", no:"", latlng:[36.9621826, 127.8708181]},
  {id:"bus7883538058", name:"상검단", no:"", latlng:[36.9638845, 127.8637894]},
  {id:"bus7899541878", name:"상검단(상검단교)", no:"64070", latlng:[36.9678433, 127.8658047]},
  {id:"bus7899541877", name:"상검단(상검단교건너편)", no:"43028", latlng:[36.9679595, 127.8658358]},
  {id:"bus7945418661", name:"하검단리(하검단교)", no:"", latlng:[36.9723034, 127.8781254]},
  {id:"bus7945418662", name:"하검단리(하검단교건너편)", no:"", latlng:[36.972371, 127.8780343]},
  {id:"bus7258635086", name:"한국교통대 (대학본부)", no:"43069", latlng:[36.9707078, 127.8719474]},
  {id:"bus7258635087", name:"한국교통대 (대학본부건너편)", no:"43077", latlng:[36.970621, 127.8718724]},
  {id:"bus12299733741", name:"한국교통대 (스마트ICT관)", no:"64643", latlng:[36.9705303, 127.8746056]},
  {id:"bus12684305967", name:"한국교통대 (정문)", no:"43075", latlng:[36.9667185, 127.8721183]},
  {id:"bus7258635085", name:"한국교통대 (체육관)", no:"43076", latlng:[36.967993, 127.8715393]},
  {id:"bus7258635084", name:"한국교통대 (체육관건너편)", no:"43071", latlng:[36.9680665, 127.8718082]},
  {id:"bus7881714883", name:"한국교통대 (회차지)", no:"43078", latlng:[36.9727647, 127.8707643]},
  {id:"bus7883538059", name:"한국교통대(농협)", no:"43070", latlng:[36.9630457, 127.8700693]},
  {id:"bus4654355183", name:"한국교통대(농협.건너편)", no:"43072", latlng:[36.9625221, 127.8715314]},
  {id:"bus8059307234", name:"한국교통대(시내방향)", no:"43073", latlng:[36.9652493, 127.8711099]},
  {id:"bus8059307233", name:"한국교통대(요거프레소앞)", no:"", latlng:[36.9645239, 127.8709608]},
  {id:"bus8059307235", name:"한국교통대(정문방향)", no:"43074", latlng:[36.9652033, 127.8714065]},
];

const BUS_API = 'https://apis.data.go.kr/1613000';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad = n => String(n).padStart(2, '0');
const clock = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const busKey = () => String(window.KNUT_CONFIG?.BUS_API_KEY ?? '').trim();

// 개발계정은 초당 요청 수 제한이 있어서, 요청을 줄 세워 간격을 두고 보내요.
const queue = {busy:0, wait:[], last:0};
function apiFetch(url) {
  return new Promise((ok, no) => { queue.wait.push([url, ok, no]); pump(); });
}
function pump() {
  if (queue.busy >= 2 || !queue.wait.length) return;
  const gap = 150 - (Date.now() - queue.last);
  if (gap > 0) { setTimeout(pump, gap); return; }
  const [url, ok, no] = queue.wait.shift();
  queue.busy++;
  queue.last = Date.now();
  fetch(url).then(ok, no).finally(() => { queue.busy--; pump(); });
  pump();
}

async function tago(path, params, retry = 1) {
  const query = new URLSearchParams({numOfRows:100, pageNo:1, _type:'json', ...params});
  // 인코딩된 키를 그대로 붙여야 해요 (URLSearchParams 로 넣으면 한 번 더 인코딩돼요)
  const response = await apiFetch(`${BUS_API}/${path}?serviceKey=${busKey()}&${query}`);
  let data;
  try { data = await response.json(); }
  catch { throw new Error(response.status === 403 ? '키가 등록되지 않았어요' : '응답 오류 ' + response.status); }
  const errMsg = data.OpenAPI_ServiceResponse?.cmmMsgHeader?.errMsg || '';
  if (/PER_SECOND/.test(errMsg) && retry) {
    await new Promise(wait => setTimeout(wait, 1100));
    return tago(path, params, retry - 1);
  }
  const head = data.response?.header;
  if (!head) throw new Error(errMsg || '응답 오류 ' + response.status);
  if (head.resultCode !== '00') throw new Error(head.resultMsg || 'API 오류');
  const items = data.response?.body?.items?.item;
  return items ? [].concat(items) : [];
}

// ---------- 시내버스 정류장: 실시간 도착 ----------
const stopNodes = {};
async function arrivals(stop) {
  if (!stopNodes[stop.id]) {
    const [lat, lng] = stop.latlng;
    const near = await tago('BusSttnInfoInqireService/getCrdntPrxmtSttnList', {gpsLati:lat, gpsLong:lng, numOfRows:30});
    if (!near.length) throw new Error('정류장을 찾지 못했어요');
    const dist = node => Math.hypot(node.gpslati - lat, node.gpslong - lng);
    stopNodes[stop.id] = near.find(node => stop.no && String(node.nodeno) === stop.no) || near.sort((a, b) => dist(a) - dist(b))[0];
  }
  const node = stopNodes[stop.id];
  const list = await tago('ArvlInfoInqireService/getSttnAcctoArvlPrearngeInfoList', {cityCode:node.citycode, nodeId:node.nodeid, numOfRows:50});
  return list.sort((a, b) => a.arrtime - b.arrtime);
}

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
  const load = () => arrivals(stop).then(list => {
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
      + `<p class="transit-foot">${clock()} 기준 · 30초마다 갱신 <button type="button" data-refresh>새로고침</button></p>`;
  }).catch(error => {
    const box = alive && body.querySelector('.transit-live');
    if (box) box.innerHTML = `<p class="transit-note">도착 정보를 못 불러왔어요 (${esc(error.message)})</p>`;
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
