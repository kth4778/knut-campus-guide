// MOA 채팅방 (데모): 모집글마다 하나씩 있고, 그 모집에 참여한 사람(모집자 포함)만 들어갈 수 있어요.
// 주문·만날 곳·송금 같은 이야기를 참여자끼리 나누고, 배달은 각자 먹을 메뉴와 가격을 올려 주문을 모아요.
// 데모라서 대화는 이 브라우저(localStorage)에만 저장되고, 같이 참여한 학우의 말은 예시로 자동 답장해요.
// 나중에 Firebase 같은 서버를 붙이면 load/save 부분만 바꾸면 돼요.

import {stickerImg, stickerButton, stickerPanel, STICKERS} from './stickers.js';
import {ICON, avatar, artImg} from './ui-icons.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const STORE = 'knut-campus-guide:moa-chats';
const NICK = 'knut-campus-guide:nick';
const ME = 'me';
const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };

// 같이 참여한 학우의 자동 답장 (데모)
const REPLIES = {
  taxi:['좋아요! 정문 앞에서 봬요 🙌', '저 2분 정도 늦을 수도 있어요', '택시는 제가 카카오T로 부를게요', '도착하면 1/N로 송금할게요'],
  food:['좋아요! 저도 콜 🙌', '최소주문 채우려면 하나 더 시켜도 돼요', '받는 곳 앞에서 기다릴게요', '주문하시면 금액 알려주세요, 바로 보낼게요',
    '도착하면 채팅 남겨 주세요', '저는 아무거나 좋아요 ㅎㅎ'],
};

// {[fundId]: {messages:[], orders:[{uid, nick, menu, price, at}]}}
const chats = read(STORE, {});
const won = n => (+n || 0).toLocaleString('ko-KR') + '원';
const isDelivery = fund => fund?.type === 'delivery' && fund.mode !== 'pickup';
// 예시 모집글의 다른 참여자가 미리 담아 둔 메뉴 (데모)
const SAMPLE_ORDERS = [['뿌링클 반마리', 9500], ['마라탕 (중)', 8500], ['치즈볼', 4000], ['꿔바로우 (소)', 9000], ['양념치킨 반마리', 9000]];
const save = () => write(STORE, chats);
const clock = at => { const d = new Date(at); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const timeAgo = at => {
  const mins = Math.max(0, Math.round((Date.now() - at) / 60000));
  return mins < 1 ? '방금' : mins < 60 ? `${mins}분 전` : mins < 1440 ? `${Math.floor(mins / 60)}시간 전` : `${Math.floor(mins / 1440)}일 전`;
};

export const isMember = fund => (fund?.participantUids || []).includes(ME) || fund?.hostUid === ME;
const others = fund => (fund.participants || []).filter(p => p.uid !== ME);
const face = (fund, nick) => {
  const k = Math.max(0, others(fund).findIndex(p => p.nick === nick));
  return avatar(k * 3 + fund.id.length);
};

function chatOf(fund) {
  if (!chats[fund.id]) {
    const orders = fund.demo && isDelivery(fund)
      ? others(fund).map((p, k) => ({uid:p.uid, nick:p.nick, menu:SAMPLE_ORDERS[k % SAMPLE_ORDERS.length][0], price:SAMPLE_ORDERS[k % SAMPLE_ORDERS.length][1], at:Date.now()}))
      : [];
    chats[fund.id] = {orders, messages:[{system:true, text:`'${fund.title}' 참여자 채팅방이에요. ${isDelivery(fund) ? '각자 먹을 메뉴와 가격을 올려 주세요.' : '만날 곳과 시간을 정해 보세요.'}`, at:Date.now()}]};
    save();
  }
  chats[fund.id].orders ??= [];
  return chats[fund.id];
}

// 채팅방에 올라온 메뉴 가격 합계 (모집 카드의 최소주문 막대에 써요)
export const orderTotal = fund => chatOf(fund).orders.reduce((sum, o) => sum + (+o.price || 0), 0);

// 모집자 계좌 (참여자에게만 보여요)
function accountHtml(fund) {
  const a = fund.account;
  if (!a?.number) return fund.hostUid === ME ? '<p class="room-account none">계좌를 등록하지 않았어요. 모집글을 새로 올릴 때 등록할 수 있어요.</p>' : '';
  return `<div class="room-account"><span>${ICON.card}${esc(fund.host?.nick || '모집자')}님 계좌</span><b>${esc(a.bank)} ${esc(a.number)}</b><small>예금주 ${esc(a.holder || '-')}</small>
    <button type="button" class="pill" data-copy-account="${esc(`${a.bank} ${a.number}`)}">복사</button></div>`;
}

// 배달: 모집자가 정한 배달비(고정)를 참여자 모두에게 자동으로 똑같이 나누고, 사람별 메뉴 합계에 더해 보낼 돈을 보여줘요.
export function feeShare(fund) {
  const count = Math.max(1, (fund.participantUids || []).length);
  return {count, each:Math.ceil((+fund.fee || 0) / count / 10) * 10};
}
function ordersHtml(fund, chat) {
  const total = orderTotal(fund), min = +fund.minOrder || 0, fee = +fund.fee || 0;
  const {count, each} = feeShare(fund);
  const hostUid = fund.hostUid ?? (fund.participants || [])[0]?.uid;
  const rows = (fund.participants || []).map(p => {
    const items = chat.orders.filter(o => o.uid === p.uid);
    const sum = items.reduce((t, o) => t + (+o.price || 0), 0);
    const host = p.uid === hostUid;
    const name = p.uid === ME ? '나' : p.nick || '학우';
    return `<li class="${host ? 'host' : ''}"><span class="who">${esc(name)}${host ? '<small>모집자</small>' : ''}</span>
      <span class="items">${items.length ? items.map(o => `${esc(o.menu)} ${won(o.price)}${p.uid === ME ? ` <button type="button" class="order-del" data-order-del="${o.at}" aria-label="${esc(o.menu)} 빼기">✕</button>` : ''}`).join('<br>') : '<em>아직 메뉴를 안 올렸어요</em>'}
        <br><small>+ 배달비 ${won(each)}</small></span>
      <b>${won(sum + each)}<small>${host ? '모집자 부담분' : '보낼 돈'}</small></b></li>`;
  }).join('');
  return `<details class="room-orders" open><summary>${ICON.receipt}주문 모음 · ${won(total)}${min ? ` / 최소주문 ${won(min)}` : ''}</summary>
      ${min ? `<div class="moa-bar"><i style="width:${Math.min(100, total / min * 100)}%"></i></div><p class="order-note">${total >= min ? '최소주문을 채웠어요!' : `최소주문까지 ${won(min - total)} 남았어요`}</p>` : ''}
      <p class="order-fee">배달비 <b>${won(fee)}</b> 고정 → 참여자 ${count}명이 <b>${won(each)}</b>씩 자동 분배</p>
      <ul class="order-list">${rows}</ul>
      <p class="order-note">사람이 들어오거나 나가면 배달비 몫이 자동으로 다시 계산돼요. 보낼 돈은 모집자 계좌로 보내 주세요.</p>
      <form class="order-form" id="order-form"><input name="menu" placeholder="내 메뉴 (예: 후라이드 반마리)" maxlength="30" required><input name="price" type="number" inputmode="numeric" min="100" step="100" placeholder="가격" required><button type="submit" class="primary">담기</button></form>
    </details>`;
}

// MOA '채팅방' 탭: 내가 참여한 모집의 채팅방만
export function chatListHtml(myFunds, route) {
  const rows = myFunds.map(fund => ({fund, chat:chatOf(fund)}))
    .sort((a, b) => (b.chat.messages.at(-1)?.at ?? 0) - (a.chat.messages.at(-1)?.at ?? 0));
  const typeIcon = fund => artImg(fund.type === 'taxi' ? 'taxi' : fund.mode === 'pickup' ? 'pickup' : 'delivery');
  return `<div class="moa-hero chat-hero"><div><b>참여자끼리<br>이야기해요</b><small>모집에 참여하면 그 모집의<br>채팅방이 열려요</small><p><strong>${rows.length}</strong><small>개 내 채팅방</small></p></div>${artImg('chatEmpty', 'moa-hero-art')}</div>
    ${rows.length ? `<div class="room-list">${rows.map(({fund, chat}) => {
      const last = chat.messages.at(-1);
      const preview = last ? (last.system ? last.text : `${last.mine ? '나' : last.who}: ${last.sticker ? '(이모티콘)' : last.text}`) : '';
      return `<a class="room-row" href="${route('moa-chat', {id:fund.id})}">
        <span class="room-topic">${typeIcon(fund)}</span>
        <span class="room-text"><strong>${esc(fund.title)}</strong><small>${esc(preview)}</small></span>
        <span class="room-meta"><small>${last ? timeAgo(last.at) : ''}</small><small class="room-count">${ICON.users}${(fund.participantUids || []).length}</small></span>
      </a>`;
    }).join('')}</div>`
    : `<div class="empty moa-empty"><img src="assets/nuti/curious.webp" alt="" aria-hidden="true"><strong>아직 채팅방이 없어요</strong><p>모집에 참여하거나 직접 모집하면<br>참여자끼리 쓰는 채팅방이 생겨요.</p><a class="primary" href="${route('moa')}">모집 보러 가기</a></div>`}
    <p class="moa-note">데모 채팅방이에요. 대화는 이 브라우저에만 저장되고, 다른 참여자의 답장은 예시로 자동 생성돼요.</p>`;
}

function bubble(fund, m) {
  if (m.system) return `<p class="chat-system">${esc(m.text)}</p>`;
  const body = m.sticker ? stickerImg(m.sticker) : `<p>${esc(m.text)}</p>`;
  if (m.mine) return `<div class="room-msg me${m.sticker ? ' sticker-msg' : ''}">${body}<time>${clock(m.at)}</time></div>`;
  return `<div class="room-msg${m.sticker ? ' sticker-msg' : ''}"><i><img src="${face(fund, m.who)}" alt=""></i><div><small>${esc(m.who)}</small>${body}</div><time>${clock(m.at)}</time></div>`;
}

// 채팅방 화면. header(title) 는 app.js 의 위쪽 막대를 만들어 줘요
export function moaChatPage(fund, header, route) {
  if (!fund) return `${header('채팅방')}<main class="scroll empty">모집을 찾을 수 없어요.</main>`;
  if (!isMember(fund)) {
    return `${header(fund.title)}<main class="scroll empty room-locked">${artImg('chatEmpty')}
      <strong>참여한 사람만 들어올 수 있어요</strong><p>이 모집에 참여하면 참여자끼리 쓰는 채팅방이 열려요.</p>
      <a class="primary" href="${route('moa')}">모집 보러 가기</a></main>`;
  }
  const chat = chatOf(fund);
  const names = ['나', ...others(fund).map(p => p.nick)].join(', ');
  return `${header(fund.title)}
    <main class="room-page" data-fund="${esc(fund.id)}">
      <p class="room-members">${ICON.users}참여자 ${(fund.participantUids || []).length}명 · ${esc(names)}</p>
      <div class="room-panels">${accountHtml(fund)}${isDelivery(fund) ? ordersHtml(fund, chat) : ''}</div>
      <div class="room-log" id="room-log">${chat.messages.map(m => bubble(fund, m)).join('')}</div>
      ${stickerPanel()}
      <form class="room-form" id="room-form">${stickerButton()}<input name="text" placeholder="${fund.type === 'taxi' ? '만날 시간·장소를 이야기해 보세요' : '주문·받을 곳을 이야기해 보세요'}" autocomplete="off" maxlength="300" required><button type="submit" class="primary">보내기</button></form>
    </main>`;
}

function scrollDown() {
  const log = document.getElementById('room-log');
  if (log) log.scrollTop = log.scrollHeight;
}
function repaint(fund) {
  const page = document.querySelector(`.room-page[data-fund="${CSS.escape(fund.id)}"]`);
  if (!page) return;
  const chat = chatOf(fund);
  page.querySelector('#room-log').innerHTML = chat.messages.map(m => bubble(fund, m)).join('');
  const panels = page.querySelector('.room-panels');
  if (panels && isDelivery(fund)) {
    const open = panels.querySelector('.room-orders')?.open ?? true;
    panels.innerHTML = accountHtml(fund) + ordersHtml(fund, chat);
    panels.querySelector('.room-orders').open = open;
  }
  scrollDown();
}

// sticker: 누티 이모티콘 id (글 대신 이모티콘을 보낼 때)
function send(fund, text, sticker) {
  const chat = chatOf(fund);
  chat.messages.push({mine:true, text:text || '', ...(sticker ? {sticker} : {}), at:Date.now()});
  save();
  repaint(fund);
  // 같이 참여한 학우가 있으면 그중 한 명이 예시로 답장 (데모)
  const mates = others(fund);
  if (!mates.length) return;
  const mate = mates[Math.floor(Math.random() * mates.length)];
  const lines = REPLIES[fund.type === 'taxi' ? 'taxi' : 'food'];
  setTimeout(() => {
    // 이모티콘을 받으면 예시 학우도 가끔 이모티콘으로 답해요
    const reply = sticker && Math.random() < 0.6 ? {sticker:STICKERS[Math.floor(Math.random() * STICKERS.length)][0], text:''}
      : {text:lines[Math.floor(Math.random() * lines.length)]};
    chat.messages.push({who:mate.nick || '학우', ...reply, at:Date.now()});
    save();
    repaint(fund);
  }, 1200 + Math.random() * 1200);
}

// 참여·모집할 때 moa.js 가 불러요: 채팅방에 들어왔다는 안내
export function noteJoined(fund, nick, host = false) {
  chatOf(fund).messages.push({system:true, text:host ? `${nick || '모집자'}님이 모집을 열었어요.` : `${nick || '나'}님이 참여했어요.`, at:Date.now()});
  save();
}

// app.js 에서 한 번 불러요. fundById: 모집 id → 모집글
export function initMoaChat(root, {fundById, toast, onChange}) {
  const fundOf = el => fundById(el.closest('.room-page')?.dataset.fund);
  root.addEventListener('click', event => {
    const sticker = event.target.closest('.room-page [data-sticker]');
    if (sticker) {
      const fund = fundOf(sticker);
      if (fund && isMember(fund)) send(fund, '', sticker.dataset.sticker);
      return;
    }
    const copy = event.target.closest('[data-copy-account]');
    if (copy) {
      navigator.clipboard?.writeText(copy.dataset.copyAccount).then(() => toast('계좌번호를 복사했어요.'), () => toast('복사하지 못했어요.'));
      return;
    }
    const del = event.target.closest('[data-order-del]');
    const fund = del && fundOf(del);
    if (!fund || !isMember(fund)) return;
    const chat = chatOf(fund);
    const item = chat.orders.find(o => o.uid === ME && String(o.at) === del.dataset.orderDel);
    if (!item) return;
    chat.orders = chat.orders.filter(o => o !== item);
    chat.messages.push({system:true, text:`나님이 ${item.menu}을(를) 뺐어요.`, at:Date.now()});
    save();
    repaint(fund);
    onChange?.();
  });
  root.addEventListener('submit', event => {
    if (event.target.id === 'order-form') {
      event.preventDefault();
      const fund = fundOf(event.target);
      const menu = event.target.elements.menu.value.trim().slice(0, 30);
      const price = Math.round(+event.target.elements.price.value || 0);
      if (!fund || !isMember(fund)) return;
      if (!menu || price < 100) { toast('메뉴와 가격을 적어 주세요.'); return; }
      const chat = chatOf(fund);
      const me = (fund.participants || []).find(p => p.uid === ME);
      chat.orders.push({uid:ME, nick:me?.nick || '나', menu, price, at:Date.now()});
      save();
      send(fund, `${menu} ${won(price)} 담았어요`);
      onChange?.();
      return;
    }
    if (event.target.id !== 'room-form') return;
    event.preventDefault();
    const fund = fundOf(event.target);
    const input = event.target.elements.text;
    const text = input.value.trim();
    if (!text || !fund || !isMember(fund)) return;
    input.value = '';
    send(fund, text);
  });
  window.addEventListener('hashchange', () => setTimeout(scrollDown, 0));
}
