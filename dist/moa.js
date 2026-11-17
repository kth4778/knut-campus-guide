// MOA: 배달 같이 시키기 · 픽업해서 같이 먹기 · 택시 같이 타기. 누팁스(KNUTIPS) 앱의 기능을 옮겨 왔어요.
// 모집글은 이 브라우저(localStorage)에만 저장돼요. 다른 사람에게는 보이지 않아요.

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const won = n => (+n || 0).toLocaleString('ko-KR') + '원';
const r10 = x => Math.ceil(x / 10) * 10;
const STORE = 'knut-campus-guide:moa';
const NICK = 'knut-campus-guide:nick';
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
const NICKS = ['🐻', '🦊', '🐰', '🐱', '🐶', '🐼', '🐧', '🐯'];
const COLORS = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'];

// 처음 열었을 때 보여 줄 예시 모집글
function seed() {
  const now = Date.now(), m = 60000;
  const people = (n, pay) => Array.from({length:n}, (_, i) => ({uid:'demo' + i, nick:'학우' + (i + 1), amount:pay}));
  const make = (id, type, title, place, extra, n, mins, pay = 0) => {
    const participants = people(n, pay);
    return {id, type, title, place:spot(place), status:'open', deadline:now + mins * m, demo:true, participants, participantUids:participants.map(p => p.uid), ...extra};
  };
  return [
    make('s1', 'delivery', 'BHC 치킨 같이 시켜요', '예성생활관', {fee:4000, minOrder:20000, maxPeople:20}, 2, 18, 6500),
    make('s2', 'taxi', '충주터미널 가실 분', '정문', {dest:spot('충주터미널'), fare:9800, maxPeople:4}, 3, 7),
    make('s3', 'delivery', '마라탕 최소주문 채워요', '중앙도서관', {fee:3000, minOrder:15000, maxPeople:20}, 1, 35, 6500),
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
let filter = 'all';
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
  const sum = people.reduce((total, p) => total + (+p.amount || 0), 0);
  return {people, me:uids.includes(ME), host:f.hostUid === ME, n, max, sum, full:n >= max};
}
function timeLeft(f) {
  if (f.status === 'closed') return {end:true, text:'마감됨'};
  const left = f.deadline - Date.now(), mins = Math.round(left / 60000);
  if (left <= 0) return {end:true, text:f.type === 'taxi' ? '출발 시각 지남' : isPickup(f) ? '픽업 시각 지남' : '주문 시각 지남'};
  return {end:false, text:(mins >= 60 ? Math.floor(mins / 60) + '시간 ' : '') + (mins % 60) + '분 남음', hot:mins <= 10};
}
const placeLabel = p => p?.label || p || '';
const kindOf = f => isPickup(f) ? 'pickup' : f.type;

function avatars(f, people) {
  return people.slice(0, 6).map((p, k) => `<i style="background:${COLORS[(k + f.id.length) % 8]}" title="${esc(p.nick)}">${NICKS[(k * 3 + f.id.length) % 8]}</i>`).join('');
}
function joinButton(f, state, v) {
  if (state.end) return '<span class="moa-btn ended">마감</span>';
  if (v.host) return '<button type="button" class="moa-btn joined" data-moa="close">내 모집 · 마감하기</button>';
  return `<button type="button" class="moa-btn ${v.me ? 'joined' : v.full ? '' : 'go'}" data-moa="join" ${!v.me && v.full ? 'disabled' : ''}>${v.me ? '참여 중 ✓' : v.full ? '정원 찼어요' : '참여하기'}</button>`;
}

function pickupCard(f) {
  const state = timeLeft(f), v = numbers(f), split = pickSplit(f, v.n), fee = +f.fee || 0;
  return `<article class="moa-card" data-id="${esc(f.id)}">
    <div class="moa-top"><span class="moa-type pickup">🍕 픽업</span><strong>${esc(f.title)}</strong><span class="moa-time${state.hot ? ' hot' : ''}">${state.text}</span></div>
    <p class="moa-where">🏪 ${esc(f.shop || '가게')} → 📍 나눌 곳 ${esc(placeLabel(f.place))}</p>
    <div class="moa-bar"><i style="width:${v.n / v.max * 100}%;background:linear-gradient(90deg,#f08a3c,#c0562b)"></i></div>
    <p class="moa-nums"><span>음식 ${won(f.foodTotal)} · 교통비 ${won(fee)}</span><span>참여자 1인 <b>${won(split.other)}</b></span></p>
    <p class="moa-split"><span>🍕 음식 ${won(split.food)}${split.feeEach ? ` + 🚕 교통비 ${won(split.feeEach)}` : ''}</span><span class="moa-host">픽업 ${esc(f.host?.nick || '모집자')}: ${won(split.picker)} ${f.pickerFree ? '(교통비 면제)' : '(교통비 같이 부담)'}</span></p>
    <div class="moa-bottom"><span class="moa-people">${avatars(f, v.people)}</span><small>${v.n}/${v.max}명 · 사람이 늘면 1인 금액이 줄어요</small>${joinButton(f, state, v)}</div>
  </article>`;
}

export function fundCard(f) {
  if (isPickup(f)) return pickupCard(f);
  const state = timeLeft(f), v = numbers(f), n = Math.max(1, v.n);
  const fare = +f.fare || 0, fee = +f.fee || 0, min = +f.minOrder || 0, taxi = f.type === 'taxi';
  const share = taxi ? (fare ? won(Math.ceil(fare / n / 100) * 100) : '타고 나서 1/N') : won(Math.ceil(fee / n / 10) * 10);
  const percent = taxi ? v.n / v.max * 100 : min ? Math.min(100, v.sum / min * 100) : v.n / v.max * 100;
  return `<article class="moa-card" data-id="${esc(f.id)}">
    <div class="moa-top"><span class="moa-type ${f.type}">${taxi ? '🚕 택시' : '🛵 배달'}</span><strong>${esc(f.title)}</strong><span class="moa-time${state.hot ? ' hot' : ''}">${state.text}</span></div>
    <p class="moa-where">${taxi ? `📍 ${esc(placeLabel(f.place))} → ${esc(placeLabel(f.dest))}` : `📍 받는 곳 ${esc(placeLabel(f.place))}`}${f.host?.nick ? ` · 모집 ${esc(f.host.nick)}` : ''}</p>
    <div class="moa-bar"><i style="width:${percent}%;${taxi ? 'background:linear-gradient(90deg,#f5c542,#e0a526)' : ''}"></i></div>
    <p class="moa-nums">${taxi ? `<span>${fare ? '택시비 ' + won(fare) : '택시비는 타고 나서'}</span><span>1인 <b>${share}</b></span>`
      : `<span>${min ? `최소주문 ${won(min)} 중 ${won(Math.min(min, v.sum))}` : '최소주문 없음'}</span><span>배달비 1인 <b>${share}</b></span>`}</p>
    <div class="moa-bottom"><span class="moa-people">${avatars(f, v.people)}</span><small>${taxi ? `${v.n}/${v.max}명` : `${v.n}명 참여`}</small>${joinButton(f, state, v)}</div>
  </article>`;
}

function listHtml() {
  const open = funds.filter(f => !timeLeft(f).end);
  const options = [['all', '전체'], ['delivery', '🛵 배달'], ['pickup', '🍕 픽업'], ['taxi', '🚕 택시']];
  const list = funds
    .filter(f => (filter === 'all' || kindOf(f) === filter) && (!mineOnly || numbers(f).me) && f.deadline > Date.now() - 24 * 3600e3)
    .sort((a, b) => timeLeft(a).end - timeLeft(b).end || a.deadline - b.deadline);
  return `<div class="moa-hero"><span>🛵🚕</span><div><b>같이 시키고, 같이 타요</b><small>배달비·최소주문, 택시비를 학우들과 나눠요</small></div><p><strong>${open.length}</strong><small>모집 중</small></p></div>
    <div class="chips">${options.map(([value, label]) => `<button type="button" class="chip" data-moa="filter" data-value="${value}" aria-pressed="${filter === value}">${label} ${value === 'all' ? open.length : open.filter(f => kindOf(f) === value).length}</button>`).join('')}
      <button type="button" class="chip" data-moa="mine" aria-pressed="${mineOnly}">내 참여</button></div>
    <div class="moa-list">${list.length ? list.map(fundCard).join('') : `<div class="empty">${mineOnly ? '참여한 모집이 없어요.' : '지금 모집 중인 글이 없어요.<br>먼저 모집해 보세요!'}</div>`}</div>
    <p class="moa-note">모집글은 이 브라우저에만 저장돼요. 다른 사람에게는 보이지 않아요.</p>`;
}

// header: 화면 위쪽 막대(app.js 가 만들어 줌)
export function moaPage(header) {
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

// 참여: 닉네임(배달이면 내 주문금액)을 받고 참여
function askJoin(f, toast) {
  const pickup = isPickup(f), after = pickup ? pickSplit(f, numbers(f).n + 1) : null, needsAmount = f.type === 'delivery' && !pickup;
  const dialog = sheet(`<div class="sheet-top"><h2>${f.type === 'taxi' ? '🚕 같이 타기' : pickup ? '🍕 같이 먹기' : '🛵 같이 시키기'}</h2></div>
    <form class="moa-form">
      <p class="moa-sub">${esc(f.title)}</p>
      ${pickup ? `<p class="moa-pay">내가 낼 돈 (지금 참여하면)<b>${won(after.other)}</b><small>음식 ${won(after.food)}${after.feeEach ? ` + 교통비 ${won(after.feeEach)}` : ''} · ${after.n}명 기준, 사람이 더 오면 줄어요</small></p>` : ''}
      <label>닉네임<input name="nick" maxlength="12" placeholder="예) 치킨러버" value="${esc(myNick())}" required></label>
      ${needsAmount ? '<label>내 주문금액 (원)<input name="amount" type="number" inputmode="numeric" min="100" step="100" placeholder="예) 9000" required></label>' : ''}
      <div class="moa-actions"><button type="button" class="pill" data-moa="cancel">취소</button><button class="primary" type="submit">참여하기</button></div>
    </form>`);
  dialog.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();
    const fields = new FormData(event.target);
    const nick = String(fields.get('nick')).trim().slice(0, 12);
    const amount = needsAmount ? Math.round(+fields.get('amount') || 0) : 0;
    if (!nick) { toast('닉네임을 적어 주세요.'); return; }
    if (needsAmount && !amount) { toast('내 주문금액을 적어 주세요.'); return; }
    write(NICK, nick);
    f.participants = [...(f.participants || []), {uid:ME, nick, amount, at:Date.now()}];
    f.participantUids = [...(f.participantUids || []), ME];
    saveFunds();
    dialog.close();
    refreshMoa();
    toast('참여했어요! 시간 맞춰 모여요.');
  });
}

// app.js 에서 한 번 불러요. MOA 화면 안의 버튼을 처리해요.
export function initMoa(root, {toast}) {
  root.addEventListener('click', event => {
    const control = event.target.closest('[data-moa]');
    if (!control || !control.closest('.moa-page')) return;
    const f = funds.find(item => item.id === control.closest('.moa-card')?.dataset.id);
    switch (control.dataset.moa) {
      case 'filter': filter = control.dataset.value; refreshMoa(); break;
      case 'mine': mineOnly = !mineOnly; refreshMoa(); break;
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
