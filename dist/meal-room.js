// 밥약속 채팅방: 혼밥 친구 매칭에서 신청을 수락한 두 학우만 들어와 만날 시간·장소를 정해요 (Firestore 실시간)
// 주소: #/meal-room?id=<신청 ID>

import {mealStore} from './meal-store.js';
import {loadProfile} from './meal-match.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clock = at => new Date(at).toLocaleTimeString('ko-KR', {hour:'numeric', minute:'2-digit'});
let stop = null;

export function mealRoomPage(header) {
  return `${header}
    <main class="chat-page meal-room">
      <div class="mm-room-head" id="mm-room-head"><p class="mm-sub">채팅방을 여는 중…</p></div>
      <div class="chat-log" id="mm-room-log" aria-live="polite"></div>
      <form class="chat-form" id="mm-room-form" hidden>
        <input name="text" aria-label="메시지" placeholder="만날 시간·장소를 정해 보세요" autocomplete="off" maxlength="300" required>
        <button type="submit" class="primary">보내기</button>
      </form>
    </main>`;
}

export async function mountMealRoom(root, id) {
  stop?.(); stop = null;
  const head = root.querySelector('#mm-room-head'), log = root.querySelector('#mm-room-log'), form = root.querySelector('#mm-room-form');
  const fail = text => { if (head.isConnected) head.innerHTML = `<p class="mm-sub">${esc(text)}</p>`; };
  const store = await mealStore();
  if (!store) return fail('혼밥 매칭 서버가 아직 연결되지 않았어요.');
  let room;
  try { room = id && await store.room(id); } catch { room = null; }
  if (!head.isConnected) return;
  if (!room) return fail('이 채팅방을 찾을 수 없거나 들어갈 수 없어요.');
  const other = room.from === store.uid ? room.toNick : room.fromNick;
  head.innerHTML = `<p class="mm-title">🍚 ${esc(other)}님과 밥약속</p>
    ${room.place ? `<a class="chip mm-place" href="#/place?id=${esc(room.place.id)}">🍽️ 추천 식당 · ${esc(room.place.name)}</a>` : ''}
    ${room.status === 'accepted' ? '' : '<p class="mm-sub">상대가 아직 신청을 수락하지 않았어요. 수락하면 채팅할 수 있어요.</p>'}
    <p class="mm-sub">처음 만나는 학우예요. 연락처·계좌 같은 개인정보는 보내지 말고, 사람 많은 곳에서 만나요.</p>`;
  form.hidden = room.status !== 'accepted';
  stop = store.watchMessages(id, list => {
    if (!log.isConnected) { stop?.(); stop = null; return; }
    log.innerHTML = list.map(m => {
      const mine = m.uid === store.uid;
      return `<div class="chat-msg ${mine ? 'me' : 'bot'}">${mine ? '' : `<small class="mm-nick">${esc(m.nick)}</small>`}<p>${esc(m.text)}</p><small class="mm-time">${clock(m.at)}</small></div>`;
    }).join('') || '<p class="mm-sub mm-empty">첫 인사를 남겨 보세요 👋</p>';
    log.scrollTop = log.scrollHeight;
  }, () => fail('채팅을 불러오지 못했어요.'));
  form.onsubmit = async event => {
    event.preventDefault();
    const input = form.elements.text, text = input.value.trim();
    if (!text) return;
    input.value = '';
    try { await store.sendMessage(id, loadProfile().nick || '학우', text.slice(0, 300)); }
    catch { input.value = text; }
  };
}

// 다른 화면으로 가면 실시간 연결을 끊어요
window.addEventListener('hashchange', () => { if (!location.hash.startsWith('#/meal-room')) { stop?.(); stop = null; } });
