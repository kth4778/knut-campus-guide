// MOA: 배달 같이 시키기 · 픽업해서 같이 먹기 · 택시 같이 타기. 누팁스(KNUTIPS) 앱의 기능을 옮겨 왔어요.
// 모집글은 이 브라우저(localStorage)에만 저장돼요. 다른 사람에게는 보이지 않아요.

import {chatListHtml, isMember, noteJoined, orderTotal, feeShare} from './moa-chat.js';
import {ICON, avatar, artImg} from './ui-icons.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const won = n => (+n || 0).toLocaleString('ko-KR') + '원';
const r10 = x => Math.ceil(x / 10) * 10;
const STORE = 'knut-campus-guide:moa';
const NICK = 'knut-campus-guide:nick';
const ACCOUNT = 'knut-campus-guide:account'; // 모집자가 등록한 송금 계좌 (다음 모집 때 다시 채워 줌)
const ME = 'me';
const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
export const myNick = () => read(NICK, '');

// 모일 곳 · 갈 곳 좌표 (누팁스 펀딩과 같은 곳)
export const SPOT_LL = {
  예성생활관:[36.973951, 127.872104], 중원생활관:[36.973466, 127.871798], 대원생활관:[36.973553, 127.874215],
  국원생활관:[36.966883, 127.873312], 정문:[36.966753, 127.871604], 중앙도서관:[36.967936, 127.869727],
  학생회관:[36.968928, 127.872873], 교통대정류소:[36.963086, 127.869625],
  충주터미널:[36.982041, 127.914885], 충주역:[36.975994, 127.909175], 충주시청:[36.991049, 127.925961],
  연수동:[36.986725, 127.934131], 이마트:[36.97218, 127.923801],
};
export const SPOTS = Object.keys(SPOT_LL);
export const spot = label => ({label, lat:SPOT_LL[label][0], lng:SPOT_LL[label][1]});

// 처음 열었을 때 보여 줄 예시 모집글
function seed() {
  const now = Date.now(), m = 60000;
  const people = n => Array.from({length:n}, (_, i) => ({uid:'demo' + i, nick:'학우' + (i + 1)}));
  const make = (id, type, title, place, extra, n, mins) => {
    const participants = people(n);
    return {id, type, title, place:spot(place), status:'open', deadline:now + mins * m, demo:true, participants, participantUids:participants.map(p => p.uid),
      host:{nick:'학우1'}, account:{bank:'예시은행', number:'000-0000-0000', holder:'학우1 (예시)'}, ...extra};
  };
  return [
    make('s1', 'delivery', 'BHC 치킨 같이 시켜요', '예성생활관', {fee:4000, minOrder:20000, maxPeople:20}, 2, 18),
    make('s2', 'taxi', '충주터미널 가실 분', '정문', {dest:spot('충주터미널'), fare:9800, maxPeople:4}, 3, 7),
    make('s3', 'delivery', '마라탕 최소주문 채워요', '중앙도서관', {fee:3000, minOrder:15000, maxPeople:20}, 1, 35),
    make('s4', 'taxi', '충주역 KTX 시간 맞춰 가요', '대원생활관', {dest:spot('충주역'), fare:11000, maxPeople:4}, 1, 52),
    make('s5', 'delivery', '파파프라이데이 피자 같이 먹어요', '예성생활관', {mode:'pickup', shop:'파파존스 충주점', foodTotal:32000, fee:6000, pickerFree:true, minOrder:0, maxPeople:4, host:{nick:'피자러버'}}, 2, 40),
  ];
}

let funds = read(STORE, null);
if (!Array.isArray(funds) || !funds.length || funds.every(f => f.deadline < Date.now() - 3600e3)) {
  funds = seed();
  write(STORE, funds);
}
export const saveFunds = () => write(STORE, funds);
export const addFund = fund => { funds.unshift(fund); saveFunds(); };
export const fundById = id => funds.find(f => f.id === id);
let filter = 'all';
let tab = 'funds'; // 'funds' 모집 · 'chat' 채팅방
const hashRoute = (page, params = {}) => { const q = new URLSearchParams(params).toString(); return `#/${page}${q ? '?' + q : ''}`; };
const tabsHtml = () => `<nav class="moa-tabs" aria-label="MOA 메뉴">
    <a href="${hashRoute('moa')}" ${tab === 'funds' ? 'aria-current="page"' : ''}>${ICON.users}모집</a>
    <a href="${hashRoute('moa', {tab:'chat'})}" ${tab === 'chat' ? 'aria-current="page"' : ''}>${ICON.chat}채팅방</a>
  </nav>`;
let mineOnly = false;

// 픽업: 한 사람(모집자)이 사 오고 음식값은 N빵, 교통비는 '픽업자 면제' 또는 '같이 부담'
export const isPickup = f => f?.type === 'delivery' && f.mode === 'pickup';
export function pickSplit(f, count) {
  const n = Math.max(1, count), food = r10((+f.foodTotal || 0) / n), fee = +f.fee || 0;
  const feeEach = f.pickerFree ? (n > 1 ? r10(fee / (n - 1)) : 0) : r10(fee / n);
  return {n, food, feeEach, other:food + feeEach, picker:food + (f.pickerFree ? 0 : feeEach)};
}
function numbers(f) {
  const uids = f.participantUids || [], people = f.participants || [];
  const n = uids.length;
  const max = f.type === 'taxi' || isPickup(f) ? (+f.maxPeople || 4) : 20; // 배달은 인원 제한 없음
  const sum = f.type === 'delivery' && !isPickup(f) ? orderTotal(f) : 0; // 배달: 채팅방에 올라온 메뉴 가격 합계
  return {people, me:uids.includes(ME), host:f.hostUid === ME, n, max, sum, full:n >= max};
}
function timeLeft(f) {
  if (f.status === 'closed') return {end:true, text:'마감됨'};
  const left = f.deadline - Date.now(), mins = Math.round(left / 60000);
  if (left <= 0) return {end:true, text:f.type === 'taxi' ? '출발 시각 지남' : isPickup(f) ? '픽업 시각 지남' : '주문 시각 지남'};
  const at = new Date(f.deadline), clock = `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`;
  return {end:false, text:`${clock} · ` + (mins >= 60 ? Math.floor(mins / 60) + '시간 ' : '') + (mins % 60) + '분 남음', hot:mins <= 10};
}
const placeLabel = p => p?.label || p || '';
const kindOf = f => isPickup(f) ? 'pickup' : f.type;

function avatars(f, people) {
  return people.slice(0, 6).map((p, k) => `<i title="${esc(p.nick)}"><img src="${avatar(k * 3 + f.id.length)}" alt=""></i>`).join('');
}
// 채팅방 버튼은 참여한 사람(모집자 포함)에게만 보여요
const chatButton = f => isMember(f) ? `<button type="button" class="moa-btn chat" data-moa="chat" aria-label="참여자 채팅방">${ICON.chat}</button>` : '';
function joinButton(f, state, v) {
  if (state.end) return '<span class="moa-btn ended">마감</span>';
  if (v.host) return '<button type="button" class="moa-btn joined" data-moa="close">내 모집 · 마감하기</button>';
  return `<button type="button" class="moa-btn ${v.me ? 'joined' : v.full ? '' : 'go'}" data-moa="join" ${!v.me && v.full ? 'disabled' : ''}>${v.me ? '참여 중 ✓' : v.full ? '정원 찼어요' : '참여하기'}</button>`;
}

const TYPE_LABEL = {delivery:'배달', pickup:'픽업', taxi:'택시'};
// 카드 머리: 그림 아이콘 + 분류 + 제목 + 남은 시간
const cardHead = (f, kind, state) => `<div class="moa-top">
    <span class="moa-ico ${kind}">${artImg(kind)}</span>
    <div class="moa-head"><span class="moa-type ${kind}">${TYPE_LABEL[kind]}</span><strong>${esc(f.title)}</strong></div>
    <span class="moa-time${state.hot ? ' hot' : ''}">${ICON.clock}${state.text}</span></div>`;

function pickupCard(f) {
  const state = timeLeft(f), v = numbers(f), split = pickSplit(f, v.n), fee = +f.fee || 0;
  return `<article class="moa-card k-pickup" data-id="${esc(f.id)}">
    ${cardHead(f, 'pickup', state)}
    <p class="moa-where">${ICON.store}${esc(f.shop || '가게')} ${ICON.arrow} 나눌 곳 ${esc(placeLabel(f.place))}</p>
    <div class="moa-bar"><i style="width:${v.n / v.max * 100}%"></i></div>
    <p class="moa-nums"><span>음식 ${won(f.foodTotal)} · 교통비 ${won(fee)}</span><span>참여자 1인 <b>${won(split.other)}</b></span></p>
    <p class="moa-split"><span>음식 ${won(split.food)}${split.feeEach ? ` + 교통비 ${won(split.feeEach)}` : ''}</span><span class="moa-host">픽업 ${esc(f.host?.nick || '모집자')}: ${won(split.picker)} ${f.pickerFree ? '(교통비 면제)' : '(교통비 같이 부담)'}</span></p>
    <div class="moa-bottom"><span class="moa-people">${avatars(f, v.people)}</span><small>${v.n}/${v.max}명 · 사람이 늘면 1인 금액이 줄어요</small>${chatButton(f)}${joinButton(f, state, v)}</div>
  </article>`;
}

export function fundCard(f) {
  if (isPickup(f)) return pickupCard(f);
  const state = timeLeft(f), v = numbers(f), n = Math.max(1, v.n);
  const fare = +f.fare || 0, fee = +f.fee || 0, min = +f.minOrder || 0, taxi = f.type === 'taxi';
  const share = taxi ? (fare ? won(Math.ceil(fare / n / 100) * 100) : '타고 나서 1/N') : won(feeShare(f).each);
  const percent = taxi ? v.n / v.max * 100 : min ? Math.min(100, v.sum / min * 100) : v.n / v.max * 100;
  return `<article class="moa-card k-${f.type}" data-id="${esc(f.id)}">
    ${cardHead(f, f.type, state)}
    <p class="moa-where">${ICON.pin}${taxi ? `${esc(placeLabel(f.place))} ${ICON.arrow} ${esc(placeLabel(f.dest))}` : `받는 곳 ${esc(placeLabel(f.place))}`}${f.host?.nick ? `<span class="moa-by">모집 ${esc(f.host.nick)}</span>` : ''}</p>
    <div class="moa-bar"><i style="width:${percent}%"></i></div>
    <p class="moa-nums">${taxi ? `<span>${fare ? '택시비 ' + won(fare) : '택시비는 타고 나서'}</span><span>1인 <b>${share}</b></span>`
      : `<span>${min ? `최소주문 ${won(min)} 중 ${won(Math.min(min, v.sum))}` : '최소주문 없음'}</span><span>배달비 1인 <b>${share}</b></span>`}</p>
    <div class="moa-bottom"><span class="moa-people">${avatars(f, v.people)}</span><small>${taxi ? `${v.n}/${v.max}명` : `${v.n}명 참여`}</small>${chatButton(f)}${joinButton(f, state, v)}</div>
  </article>`;
}

function listHtml() {
  if (tab === 'chat') return tabsHtml() + chatListHtml(funds.filter(isMember), hashRoute);
  const open = funds.filter(f => !timeLeft(f).end);
  const options = [['all', '전체'], ['delivery', '배달'], ['pickup', '픽업'], ['taxi', '택시']];
  const list = funds
    .filter(f => (filter === 'all' || kindOf(f) === filter) && (!mineOnly || numbers(f).me) && f.deadline > Date.now() - 24 * 3600e3)
    .sort((a, b) => timeLeft(a).end - timeLeft(b).end || a.deadline - b.deadline);
  return `${tabsHtml()}<div class="moa-hero"><div><b>같이 시키고,<br>같이 타요</b><small>배달비·최소주문, 택시비를<br>학우들과 나눠요</small><p><strong>${open.length}</strong><small>개 모집 중</small></p></div>${artImg('hero', 'moa-hero-art')}</div>
    <div class="chips moa-chips">${options.map(([value, label]) => `<button type="button" class="chip" data-moa="filter" data-value="${value}" aria-pressed="${filter === value}">${value === 'all' ? '' : artImg(value, 'chip-art')}${label} <b>${value === 'all' ? open.length : open.filter(f => kindOf(f) === value).length}</b></button>`).join('')}
      <button type="button" class="chip" data-moa="mine" aria-pressed="${mineOnly}">내 참여</button></div>
    <button type="button" class="moa-new-btn" data-moa="new">${ICON.plus}모집하기</button>
    <div class="moa-list">${list.length ? list.map(fundCard).join('') : `<div class="empty">${mineOnly ? '참여한 모집이 없어요.' : '지금 모집 중인 글이 없어요.<br>먼저 모집해 보세요!'}</div>`}</div>
    <p class="moa-note">모집글은 이 브라우저에만 저장돼요. 다른 사람에게는 보이지 않아요.</p>`;
}

// header: 화면 위쪽 막대(app.js 가 만들어 줌)
export function moaPage(header, params) {
  tab = params?.get('tab') === 'chat' ? 'chat' : 'funds';
  return `${header}<main class="scroll moa-page" aria-label="MOA">${listHtml()}</main>`;
}
export function refreshMoa() {
  const page = document.querySelector('.moa-page');
  if (!page) return;
  const top = page.scrollTop;
  page.innerHTML = listHtml();
  page.scrollTop = top;
}

function sheet(html) {
  const dialog = document.createElement('dialog');
  dialog.className = 'comment-sheet moa-sheet';
  dialog.innerHTML = html;
  document.getElementById('app').append(dialog);
  dialog.addEventListener('close', () => dialog.remove());
  dialog.addEventListener('click', event => { if (event.target === dialog || event.target.closest('[data-moa="cancel"]')) dialog.close(); });
  dialog.showModal();
  return dialog;
}

// 참여: 닉네임만 받고 참여 (배달 메뉴·가격은 채팅방에서 올려요)
function askJoin(f, toast) {
  const pickup = isPickup(f), after = pickup ? pickSplit(f, numbers(f).n + 1) : null;
  const dialog = sheet(`<div class="sheet-top"><h2 class="moa-sheet-title">${artImg(f.type === 'taxi' ? 'taxi' : pickup ? 'pickup' : 'delivery')}${f.type === 'taxi' ? '같이 타기' : pickup ? '같이 먹기' : '같이 시키기'}</h2></div>
    <form class="moa-form">
      <p class="moa-sub">${esc(f.title)}</p>
      ${pickup ? `<p class="moa-pay">내가 낼 돈 (지금 참여하면)<b>${won(after.other)}</b><small>음식 ${won(after.food)}${after.feeEach ? ` + 교통비 ${won(after.feeEach)}` : ''} · ${after.n}명 기준, 사람이 더 오면 줄어요</small></p>` : ''}
      <label>닉네임<input name="nick" maxlength="12" placeholder="예) 치킨러버" value="${esc(myNick())}" required></label>
      ${f.type === 'delivery' && !pickup ? '<p class="moa-help">참여한 뒤 참여자 채팅방에서 먹을 메뉴와 가격을 올리면 주문이 모여요.</p>' : ''}
      <div class="moa-actions"><button type="button" class="pill" data-moa="cancel">취소</button><button class="primary" type="submit">참여하기</button></div>
    </form>`);
  dialog.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();
    const fields = new FormData(event.target);
    const nick = String(fields.get('nick')).trim().slice(0, 12);
    if (!nick) { toast('닉네임을 적어 주세요.'); return; }
    write(NICK, nick);
    f.participants = [...(f.participants || []), {uid:ME, nick, at:Date.now()}];
    f.participantUids = [...(f.participantUids || []), ME];
    saveFunds();
    noteJoined(f, nick);
    dialog.close();
    refreshMoa();
    toast('참여했어요! 참여자 채팅방이 열렸어요.');
  });
}

// app.js 에서 한 번 불러요. MOA 화면 안의 버튼을 처리해요.
export function initMoa(root, {toast}) {
  root.addEventListener('click', event => {
    const control = event.target.closest('[data-moa]');
    if (control?.dataset.moa === 'new') { openNewFund(toast); return; }
    if (!control || !control.closest('.moa-page')) return;
    const f = funds.find(item => item.id === control.closest('.moa-card')?.dataset.id);
    switch (control.dataset.moa) {
      case 'filter': filter = control.dataset.value; refreshMoa(); break;
      case 'mine': mineOnly = !mineOnly; refreshMoa(); break;
      case 'chat': if (f) location.hash = hashRoute('moa-chat', {id:f.id}); break;
      case 'join':
        if (!f) break;
        if (!numbers(f).me) { askJoin(f, toast); break; }
        if (!confirm('참여를 취소할까요?')) break;
        f.participants = f.participants.filter(p => p.uid !== ME);
        f.participantUids = f.participantUids.filter(uid => uid !== ME);
        saveFunds();
        refreshMoa();
        toast('참여를 취소했어요.');
        break;
      case 'close':
        if (!f || !confirm('모집을 마감할까요? 더 이상 참여할 수 없어요.')) break;
        f.status = 'closed';
        saveFunds();
        refreshMoa();
        break;
    }
  });
  setInterval(() => { if (!document.hidden) refreshMoa(); }, 30000);
}

// ---------- 모집하기 ----------
// preset 으로 처음 값을 정할 수 있어요. 예) {type:'taxi', place:'정문', dest:'충주터미널', title:'충주터미널 같이 가요'}
const CAMPUS = [36.969692, 127.872252];
const pad2 = n => String(n).padStart(2, '0');
// 기본 시각: 30분 뒤를 10분 단위로 올림
function defaultTime() {
  const d = new Date(Date.now() + 30 * 60000);
  d.setMinutes(Math.ceil(d.getMinutes() / 10) * 10, 0, 0);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
// 'HH:MM' → 오늘 그 시각 (이미 지났으면 내일)
function deadlineOf(hhmm) {
  const [h, m] = String(hhmm || '').split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
  return d.getTime();
}

export function openNewFund(toast, preset = {}) {
  const saved = read(ACCOUNT, {});
  const st = {type:'delivery', place:'예성생활관', dest:'충주터미널', max:4, fee:5000, pfree:true, here:{}, picked:{}, pick:null, ...preset};
  const dialog = sheet('<div class="sheet-top"><h2>모집하기</h2></div><form class="moa-form moa-new"></form>');
  const form = dialog.querySelector('form');
  let miniMap = null;
  const dropMap = () => { if (miniMap) { miniMap.remove(); miniMap = null; } };
  dialog.addEventListener('close', dropMap);
  const seg = (name, options, current) => `<div class="moa-seg">${options.map(([value, label]) =>
    `<button type="button" class="chip" data-seg="${name}" data-value="${esc(value)}" aria-pressed="${String(value) === String(current)}">${esc(label)}</button>`).join('')}</div>`;
  // 정해진 곳 + 📍 지도에서 고르기 + 🎯 내 위치
  const spotSeg = key => seg(key, [...(key === 'dest' ? SPOTS.slice(7) : SPOTS.slice(0, 8)).map(label => [label, label]),
    ['__map', st.picked[key] ? '지도에서 고른 곳 ✓' : '지도에서 고르기'], ['__me', st.here[key] ? '내 위치 ✓' : '내 위치']], st[key]);
  const mapBox = key => st.pick === key ? `<div class="pick-map"><div id="pick-map"></div><span class="pick-pin" aria-hidden="true">📍</span>
      <button type="button" class="primary pick-ok" data-pick-ok>이 위치로</button></div><p class="moa-help">지도를 움직여 핀을 받을 곳에 맞춰 주세요.</p>` : '';
  const placeOf = key => st[key] === '__me' && st.here[key] ? {label:'내 위치', ...st.here[key]}
    : st[key] === '__map' && st.picked[key] ? {label:'지도에서 고른 곳', ...st.picked[key]} : spot(st[key]);
  const keep = () => Object.fromEntries([...new FormData(form)].map(([k, v]) => [k, v]));
  const draw = (values = {}) => {
    dropMap();
    const taxi = st.type === 'taxi', pickup = st.type === 'pickup';
    form.innerHTML = `
      <label>무엇을 같이 할까요?</label><div class="moa-kinds">${[['delivery', '배달 같이 시키기'], ['pickup', '픽업해서 같이 먹기'], ['taxi', '택시 같이 타기']].map(([value, label]) =>
        `<button type="button" class="moa-kind" data-seg="type" data-value="${value}" aria-pressed="${st.type === value}">${artImg(value)}<span>${label}</span></button>`).join('')}</div>
      ${pickup ? '<p class="moa-help">내가 가게에서 사 와서 나눠요. 음식값은 N빵, 교통비는 아래에서 정해요.</p>' : ''}
      <label>제목<input name="title" maxlength="60" placeholder="${taxi ? '예) 충주역 같이 가요' : pickup ? '예) 파파프라이데이 피자 같이 먹어요' : '예) 치킨 같이 시켜요'}"></label>
      ${pickup ? '<label>가게<input name="shop" maxlength="40" placeholder="예) 파파존스 충주점"></label>' : ''}
      <label>${taxi ? '출발' : pickup ? '나눌 곳 (사 와서 모일 곳)' : '받는 곳'}</label>${spotSeg('place')}${mapBox('place')}
      ${taxi ? `<label>도착</label>${spotSeg('dest')}${mapBox('dest')}
        <label>예상 택시비 (원, 모르면 비워두기)<input name="money" type="number" inputmode="numeric" min="0" placeholder="예) 9800"></label>`
      : pickup ? `<label>음식 총액 (원)<input name="food" type="number" inputmode="numeric" min="0" placeholder="예) 32000"></label>
        <label>교통비</label>${seg('fee', [3000, 4000, 5000, 6000, 7000, 8000].map(n => [n, n / 1000 + '천원']), st.fee)}
        <label>픽업하는 나(모집자)는</label>${seg('pfree', [['1', '교통비 면제'], ['0', '교통비 같이 부담']], st.pfree ? '1' : '0')}
        <div class="moa-preview"></div>`
      : `<label>배달비 (원, 고정 · 참여자끼리 자동으로 나눠요)<input name="money" type="number" inputmode="numeric" min="0" step="100" placeholder="예) 4000" required></label>
        <label>최소주문금액 (원, 없으면 비워두기)<input name="minOrder" type="number" inputmode="numeric" min="0" placeholder="예) 20000"></label>
        <p class="moa-help">각자 먹을 메뉴와 가격은 참여자 채팅방에서 올리면 자동으로 모여요. 인원 제한은 없어요.</p>`}
      ${st.type !== 'delivery' ? `<label>정원 (나 포함)</label>${seg('max', (pickup ? [2, 3, 4, 5, 6, 8] : [2, 3, 4, 5, 6]).map(n => [n, n + '명']), st.max)}` : ''}
      <label>${taxi ? '출발 시각' : pickup ? '픽업 출발 시각' : '주문 시각'}<input name="at" type="time" step="300" required></label>
      <fieldset class="moa-account"><legend>송금 받을 계좌 <small>(선택 · 참여자 채팅방에만 보여요)</small></legend>
        <div class="account-row"><input name="bank" maxlength="12" placeholder="은행"><input name="number" maxlength="24" inputmode="numeric" placeholder="계좌번호"></div>
        <input name="holder" maxlength="12" placeholder="예금주"></fieldset>
      <label>닉네임<input name="nick" maxlength="12" placeholder="예) 치킨러버"></label>
      <p class="moa-help">모집글과 계좌는 이 브라우저에만 저장돼요.</p>
      <div class="moa-actions"><button type="button" class="pill" data-moa="cancel">취소</button><button class="primary" type="submit">올리기</button></div>`;
    const initial = {title:st.title ?? '', nick:myNick(), at:defaultTime(), bank:saved.bank ?? '', number:saved.number ?? '', holder:saved.holder ?? '', ...values};
    for (const [name, value] of Object.entries(initial)) if (form.elements[name]) form.elements[name].value = value;
    preview();
    // 지도에서 고르기: 가운데 핀에 맞춰 지도를 움직여요 (Leaflet + OpenStreetMap)
    if (st.pick && window.L && form.querySelector('#pick-map')) {
      const start = st.picked[st.pick] || (SPOT_LL[st[st.pick]] ? spot(st[st.pick]) : {lat:CAMPUS[0], lng:CAMPUS[1]});
      miniMap = L.map('pick-map', {zoomControl:false, attributionControl:false}).setView([start.lat, start.lng], 17);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:19}).addTo(miniMap);
      const remember = () => { const c = miniMap.getCenter(); st.picked[st.pick] = {lat:+c.lat.toFixed(6), lng:+c.lng.toFixed(6)}; };
      miniMap.on('moveend', remember);
      remember();
      setTimeout(() => miniMap?.invalidateSize(), 60);
    }
  };
  // 픽업: 사람 수별 1인 금액 미리 보기
  const preview = () => {
    const box = form.querySelector('.moa-preview');
    if (!box) return;
    const food = Math.round(+form.elements.food.value || 0);
    const counts = [2, 3, 4, st.max].filter((n, i, all) => n <= st.max && all.indexOf(n) === i);
    const fund = {foodTotal:food, fee:st.fee, pickerFree:st.pfree};
    box.innerHTML = food ? `<b>사람 수별 1인 금액</b><table><tr><th></th>${counts.map(n => `<th>${n}명</th>`).join('')}</tr>
      <tr><td>참여자</td>${counts.map(n => `<td>${won(pickSplit(fund, n).other)}</td>`).join('')}</tr>
      <tr><td>나(픽업)</td>${counts.map(n => `<td>${won(pickSplit(fund, n).picker)}</td>`).join('')}</tr></table>`
      : '<small>음식 총액을 적으면 사람 수별 1인 금액을 보여 드려요.</small>';
  };
  form.addEventListener('input', event => { if (event.target.name === 'food') preview(); });
  form.addEventListener('click', event => {
    if (event.target.closest('[data-pick-ok]')) { st.pick = null; draw(keep()); toast('위치를 정했어요.'); return; }
    const button = event.target.closest('[data-seg]');
    if (!button) return;
    const {seg: key, value} = button.dataset, values = keep();
    if (value === '__me') {
      if (!navigator.geolocation) { toast('위치를 쓸 수 없어요.'); return; }
      navigator.geolocation.getCurrentPosition(pos => {
        st.here[key] = {lat:+pos.coords.latitude.toFixed(6), lng:+pos.coords.longitude.toFixed(6)};
        st[key] = '__me';
        st.pick = null;
        draw(keep());
        toast('내 위치로 정했어요.');
      }, () => toast('위치 권한이 필요해요.'), {enableHighAccuracy:true, timeout:8000});
      return;
    }
    if (value === '__map') {
      if (!window.L) { toast('지도를 불러오지 못했어요.'); return; }
      st[key] = '__map';
      st.pick = key;
      draw(values);
      return;
    }
    if (key === 'pfree') st.pfree = value === '1';
    else st[key] = ['max', 'fee'].includes(key) ? +value : value;
    if (key === 'place' || key === 'dest') st.pick = null;
    draw(values);
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const v = keep();
    const title = String(v.title || '').trim().slice(0, 60), nick = String(v.nick || '').trim().slice(0, 12);
    const money = Math.round(+v.money || 0);
    const shop = String(v.shop || '').trim().slice(0, 40), food = Math.round(+v.food || 0);
    const deadline = deadlineOf(v.at);
    const account = {bank:String(v.bank || '').trim().slice(0, 12), number:String(v.number || '').trim().slice(0, 24), holder:String(v.holder || '').trim().slice(0, 12)};
    if (!title) { toast('제목을 적어 주세요.'); return; }
    if (st.type === 'delivery' && String(v.money ?? '').trim() === '') { toast('배달비를 적어 주세요. 무료면 0을 적어요.'); return; }
    if (st.type === 'pickup' && !shop) { toast('가게 이름을 적어 주세요.'); return; }
    if (st.type === 'pickup' && !food) { toast('음식 총액을 적어 주세요.'); return; }
    if (!deadline) { toast('시각을 정해 주세요.'); return; }
    if (account.number && !account.bank) { toast('은행 이름을 적어 주세요.'); return; }
    if (!nick) { toast('닉네임을 적어 주세요.'); return; }
    write(NICK, nick);
    if (account.number) write(ACCOUNT, account);
    const now = Date.now();
    const fund = {id:'u' + now, type:st.type === 'pickup' ? 'delivery' : st.type, title, status:'open', createdAt:now, deadline,
      place:placeOf('place'), hostUid:ME, host:{nick}, participants:[{uid:ME, nick, at:now, host:true}], participantUids:[ME],
      maxPeople:st.type === 'delivery' ? 20 : st.max, ...(account.number ? {account} : {})};
    if (st.type === 'pickup') Object.assign(fund, {mode:'pickup', shop, foodTotal:food, fee:st.fee, pickerFree:st.pfree, minOrder:0});
    else if (st.type === 'delivery') Object.assign(fund, {minOrder:Math.round(+v.minOrder || 0), fee:money});
    else Object.assign(fund, {dest:placeOf('dest'), fare:money});
    addFund(fund);
    noteJoined(fund, nick, true);
    filter = 'all';
    dialog.close();
    refreshMoa();
    toast('모집글을 올렸어요.');
  });
  draw();
}
