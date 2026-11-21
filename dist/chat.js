// 챗봇 누티(Nuti): 내 컴퓨터에서 돌아가는 LLM(Ollama)에 질문하고, places.json에서 찾은 장소를 근거로 답해요.
// 이모티콘(stickers.js)을 주고받을 수 있고, 처음 들어오면 누티가 이모티콘과 함께 자기가 할 수 있는 일을 소개해요.
// 대화 기록과 연결 설정은 이 브라우저(localStorage)에만 저장돼요.

import {stickerImg, stickerButton, stickerPanel, stickerLabel, stickerSrc, isSticker} from './stickers.js';
import {MATCH_RE, matchFormCard, matchResultCard, readProfile, profileSummary, runMatch, findPick, inboxCard, toBuddy, loadProfile} from './meal-match.js';
import {mealStore} from './meal-store.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm = value => String(value ?? '').normalize('NFKC').toLowerCase();
const LOG = 'knut-campus-guide:chat';
const CFG = 'knut-campus-guide:chat-config';
const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
const APPLIED = 'knut-campus-guide:meal-applied';

const DEFAULT = {endpoint:'http://localhost:11434', model:'exaone3.5:2.4b'};
const config = () => ({...DEFAULT, ...read(CFG, {})});
const SUGGEST = ['학교 앞 싼 밥집 추천해줘', '프린트는 어디서 해?', '공강에 쉬기 좋은 곳', '시내 나가는 버스 알려줘'];
const STOP = new Set(['어디','어디서','어디야','추천','추천해줘','알려줘','있어','있나요','좋은','곳','뭐','뭐가','하는','하고','싶어','근처','학교']);

let messages = read(LOG, []);
let busy = false;
let getPlaces = () => [];
// 혼밥 매칭 공용 저장소 (Firebase). 연결 설정이 없으면 null 이라 데모로 동작해요
let store = null;
let requests = null;
const STATUS = {pending:'신청 보냄', accepted:'수락됨', declined:'거절됨'};
const sentTo = () => store
  ? Object.fromEntries((requests ?? []).filter(r => r.from === store.uid).map(r => [r.to, STATUS[r.status]]))
  : Object.fromEntries(read(APPLIED, []).map(id => [id, STATUS.pending]));
const inboxCount = () => (requests ?? []).filter(r => store && r.to === store.uid && r.status === 'pending').length;
const inboxChip = () => `<button type="button" class="chip chat-match-chip mm-inbox-chip" data-chat="match-inbox" ${store ? '' : 'hidden'}>📬 밥 신청함${inboxCount() ? ` <b>${inboxCount()}</b>` : ''}</button>`;

export function chatPage(header) {
  if (chatOptions) connectStore(chatOptions);
  const c = config();
  return `${header}
    <main class="chat-page">
      <div class="chat-log" id="chat-log" aria-live="polite">${intro() + messages.map(bubble).join('')}</div>
      ${stickerPanel()}
      <div class="chat-suggest"><button type="button" class="chip chat-match-chip" data-chat="match">🍚 혼밥 친구 찾기</button>${inboxChip()}${SUGGEST.map(q => `<button type="button" class="chip" data-chat="ask" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>
      <form class="chat-form" id="chat-form">
        ${stickerButton()}
        <input name="q" aria-label="누티에게 질문" placeholder="학교생활 무엇이든 물어보세요" autocomplete="off" maxlength="300" required>
        <button type="submit" class="primary" ${busy?'disabled':''}>보내기</button>
      </form>
      <details class="chat-config">
        <summary>LLM 연결 · ${esc(c.model)}</summary>
        <label>주소<input name="endpoint" value="${esc(c.endpoint)}"></label>
        <label>모델<input name="model" value="${esc(c.model)}"></label>
        <div class="chat-config-actions"><button type="button" class="pill" data-chat="save-config">저장</button><button type="button" class="pill" data-chat="clear">대화 지우기</button></div>
        <p>내 컴퓨터에서 Ollama가 켜져 있어야 해요. 배포된 사이트에서 쓰려면 Ollama를 <code>OLLAMA_ORIGINS=${esc(location.origin)}</code>로 실행해 주세요.</p>
      </details>
    </main>`;
}

// 누티의 첫 인사: 이모티콘을 보내며 할 수 있는 일을 소개해요
const NUTI_FACE = `<img class="nuti-face" src="${stickerSrc('hello')}" alt="" width="32" height="32">`;
function intro() {
  const count = getPlaces().length;
  const lines = [
    {sticker:'hello'},
    {text:`안녕하세요! 저는 한국교통대학교 친구 누티(Nuti)예요 🍎`},
    {text:`이런 걸 도와드릴 수 있어요\n🍚 학교 앞 맛집·카페 추천\n🖨️ 프린트·복사 같은 생활꿀팁\n📚 공부하기 좋은 곳, 쉬기 좋은 곳\n🚌 버스 정류장·교통 정보\n🤝 혼밥러를 위한 밥친구 매칭\n${count ? `충주캠퍼스 장소·꿀팁 ${count}개를 보고 답해 드려요.` : ''}`},
    {sticker:'together'},
    {text:'궁금한 걸 물어보거나, 아래 이모티콘 버튼으로 저한테 이모티콘을 보내 보세요!'},
  ];
  return lines.map(line => `<div class="chat-msg bot chat-intro${line.sticker ? ' sticker-msg' : ''}">${NUTI_FACE}${line.sticker ? stickerImg(line.sticker) : `<p>${esc(line.text).replace(/\n/g, '<br>')}</p>`}</div>`).join('');
}

function bubble(m) {
  if (m.kind === 'match-form') return matchFormCard(!!store);
  if (m.kind === 'match-result') return matchResultCard(m, sentTo());
  if (m.kind === 'match-inbox') return inboxCard(requests, store?.uid);
  const bot = m.role !== 'user';
  if (m.sticker) return `<div class="chat-msg ${bot ? 'bot' : 'me'} sticker-msg">${bot ? NUTI_FACE : ''}${stickerImg(m.sticker)}</div>`;
  const refs = (m.refs ?? []).map(r => `<a class="chip" href="#/place?id=${esc(r.id)}">${esc(r.name)}</a>`).join('');
  return `<div class="chat-msg ${bot ? 'bot' : 'me'}${m.error ? ' error' : ''}">${bot ? NUTI_FACE : ''}<p>${esc(m.content).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>${refs ? `<div class="chat-refs">${refs}</div>` : ''}</div>`;
}

// 이모티콘을 보내면 누티도 이모티콘으로 답해요 (LLM 없이 바로)
const REACT = {hello:'hello', yay:'yay', love:'shy', curious:'curious', sad:'together', sleepy:'goodjob', yum:'yum', study:'levelup',
  cafe:'cafe', go:'go', shy:'love', levelup:'yay', together:'together', goodjob:'love'};
function sendSticker(root, id) {
  if (!isSticker(id)) return;
  messages.push({role:'user', sticker:id, content:`(이모티콘: ${stickerLabel(id)})`});
  paint(root);
  setTimeout(() => {
    messages.push({role:'assistant', sticker:REACT[id] || 'hello', content:`(이모티콘: ${stickerLabel(REACT[id] || 'hello')})`});
    messages = messages.slice(-40);
    write(LOG, messages);
    paint(root);
  }, 700);
}

// 질문 낱말이 이름·분류·지역·건물·메뉴·학생 의견에 얼마나 들어 있는지로 장소를 골라요
// 영어·중국어·일본어 질문도 장소를 찾을 수 있게, 질문 속 낱말을 자료의 한국어 낱말로 바꿔 함께 찾아요
const FOREIGN = [
  [/print|打印|印刷|プリント/, '프린트 프린터 인쇄'], [/cop(y|ies)|复印|コピー/, '복사'], [/bind|装订|製本/, '제본'],
  [/restaurant|\beat\b|food|meal|lunch|dinner|吃|饭|餐|美食|食事|ご飯|ごはん|グルメ|ランチ/, '맛집 식당 밥'], [/cheap|budget|便宜|安い/, '저렴 가성비 착한'],
  [/cafeteria|dining hall|食堂|学食|学生食堂/, '학생식당 식당'], [/caf[eé]|coffee|咖啡|カフェ|コーヒー/, '카페 커피'], [/dessert|甜品|デザート/, '디저트'],
  [/bar|pub|drink|beer|alcohol|酒|居酒屋|飲み/, '술집 주점 술'], [/chicken|鸡|チキン/, '치킨'], [/burrito/, '부리또'], [/pizza|披萨|ピザ/, '피자'],
  [/study|reading room|自习|学习|阅览|勉強|自習/, '열람실 공부 독서실'], [/library|图书馆|図書館/, '도서관'],
  [/\brest\b|relax|break|\bnap\b|休息|休憩|休み/, '휴식 쉬기 쉼터 공강'], [/walk|stroll|散步|散歩/, '산책 둘레길'], [/photo|picture|拍照|写真/, '사진'],
  [/bus|公交|巴士|バス/, '버스 정류장'], [/express|高速/, '고속버스'], [/taxi|出租车|タクシー/, '택시'], [/train|station|火车|车站|電車|駅/, '충주역 기차 역'],
  [/downtown|city|市区|市内/, '시내'], [/terminal|客运站|ターミナル/, '터미널'],
  [/dorm|dormitory|宿舍|寮/, '생활관 기숙사'], [/room|rent|apartment|租房|部屋|一人暮らし/, '원룸 자취'],
  [/gym|workout|exercise|fitness|健身|运动|ジム|運動/, '헬스 피트니스 운동'], [/convenience|便利店|コンビニ/, '편의점'],
  [/bank|atm|银行|銀行/, '은행 ATM'], [/post office|mail|parcel|邮局|郵便/, '우체국'], [/hospital|clinic|medicine|医院|药|病院|薬/, '보건 병원 약'],
  [/counsel|心理|相談/, '상담'], [/scholarship|奖学金|奨学金/, '장학금'], [/course|registration|class|选课|履修/, '수강신청'],
  [/club|社团|サークル/, '동아리'], [/wifi|wi-fi|无线|ワイファイ/, '와이파이'], [/certificate|证明|証明書/, '증명서'],
  [/delivery|外卖|配達/, '배달'], [/karaoke|唱歌|カラオケ/, '노래방 코인노래'], [/movie|cinema|电影|映画/, '영화 CGV'], [/laundry|洗衣|洗濯/, '세탁'],
];
function foreignWords(question) {
  const q = norm(question);
  return FOREIGN.filter(([re]) => re.test(q)).flatMap(([, ko]) => ko.split(' ').map(norm));
}

function findPlaces(question, limit = 6) {
  const words = norm(question).replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/)
    .map(w => w.replace(/(은|는|이|가|을|를|에서|에|으로|로|도|만|좀|해줘|해|야|요)$/u, ''))
    .filter(w => w.length >= 2 && !STOP.has(w))
    .concat(foreignWords(question));
  if (!words.length) return [];
  return getPlaces().map(p => {
    const name = norm(p.name), meta = norm([p.category, p.area, p.location?.building].join(' '));
    const body = norm([...(p.reasons ?? []), ...(p.menus ?? []).map(m => m.name)].join(' '));
    let score = 0;
    for (const w of words) score += (name.includes(w) ? 5 : 0) + (meta.includes(w) ? 2 : 0) + (body.includes(w) ? 1 : 0);
    return {p, score: score + Math.min(p.rec ?? 0, 10) * 0.05};
  }).filter(x => x.score >= 1).sort((a, b) => b.score - a.score).slice(0, limit).map(x => x.p);
}

function describe(p) {
  const menus = (p.menus ?? []).filter(m => m.name).slice(0, 4).map(m => m.name + (m.min ? ` ${m.min.toLocaleString('ko-KR')}원` : '')).join(', ');
  const hours = (p.hours ?? []).map(h => h.raw).filter(Boolean).slice(0, 2).join(' / ');
  return [`- ${p.name} (${p.category} · ${p.area})`, p.address && `주소: ${p.address}`, menus && `메뉴: ${menus}`, hours && `영업: ${hours}`,
    p.rec && `학생 추천 ${p.rec}명`, (p.reasons ?? []).length && `학생 의견: ${p.reasons.slice(0, 3).join(' / ')}`].filter(Boolean).join('\n  ');
}

// 다국어 모드(i18n.js)에서 고른 언어로 답하게 해요
function answerLanguage() {
  const name = {en:'English', zh:'简体中文', ja:'日本語'}[window.knutLang?.()];
  return name ? `
답변은 반드시 ${name}로 쓴다. 장소 이름은 자료의 한국어 그대로 쓴다.` : '';
}

function systemPrompt(found) {
  return `너는 KNUTIPS 앱의 캠퍼스 친구 챗봇 누티(Nuti)이다. 사과 모자를 쓴 수달 캐릭터이고, 국립한국교통대학교 충주캠퍼스 학생을 돕는다. 이름을 물으면 누티(Nuti)라고 답한다. 한국어 존댓말로 3~5문장 안에 짧고 다정하게 답한다.
아래 [자료]는 학생들이 직접 모은 장소·꿀팁이다. 자료에 있는 내용만 근거로 답하고, 장소 이름은 자료에 적힌 그대로 쓴다.
자료에 없는 내용은 지어내지 말고 "가이드 자료에는 없어요"라고 말한 뒤 학교 홈페이지나 에브리타임 확인을 권한다.${answerLanguage()}
[자료]
${found.length ? found.map(describe).join('\n') : '(질문과 맞는 자료 없음)'}`;
}

function paint(root) {
  const log = root.querySelector('#chat-log');
  if (!log) return;
  log.innerHTML = intro() + messages.map(bubble).join('');
  log.scrollTop = log.scrollHeight;
  const send = root.querySelector('#chat-form button');
  if (send) send.disabled = busy;
}

// 채팅 목록 안에서만 그 카드가 맨 위에 오게 내려요 (scrollIntoView 는 폰 화면 전체를 밀어 위 머리글이 사라짐)
function showInLog(root, selector) {
  const log = root.querySelector('#chat-log'), card = log?.querySelector(selector);
  if (card) log.scrollTop = card.getBoundingClientRect().top - log.getBoundingClientRect().top + log.scrollTop - 8;
}

// 혼밥 친구 매칭 (meal-match.js): 취향 카드를 띄우고, 고르면 LLM이 밥친구를 골라요
function openMatch(root, said) {
  if (busy) return;
  messages = messages.filter(m => m.kind !== 'match-form');
  if (said) messages.push({role:'user', content:said});
  messages.push({role:'assistant', kind:'match-form', content:'(혼밥 친구 찾기 카드)'});
  write(LOG, messages);
  paint(root);
  showInLog(root, '.match-box:has(.match-form)');
}

async function findBuddies(root, form) {
  if (busy) return;
  const {profile, error} = readProfile(form, !!store);
  const showError = text => { form.querySelector('.mm-error').textContent = text; };
  if (error) { showError(error); return; }
  let buddies;
  if (store) {
    busy = true;
    try {
      await store.saveProfile(profile);
      buddies = (await store.listProfiles()).map(toBuddy);
    } catch (err) {
      showError(`밥친구 카드를 저장하지 못했어요. 인터넷 연결을 확인해 주세요. (${err.code || err.message})`);
      return;
    } finally { busy = false; }
  }
  messages = messages.filter(m => m.kind !== 'match-form');
  messages.push({role:'user', content:profileSummary(profile)});
  const result = {role:'assistant', kind:'match-result', content:'누티가 밥친구를 찾는 중…', picks:[]};
  messages.push(result);
  busy = true;
  paint(root);
  try {
    Object.assign(result, await runMatch(profile, {...config(), places:getPlaces(), ...(buddies ? {buddies} : {})}));
  } finally {
    busy = false;
    messages = messages.slice(-40);
    write(LOG, messages);
    paint(root);
  }
}

function botSay(root, text) {
  messages.push({role:'assistant', sticker:'together', content:'(이모티콘: 같이하자!)'});
  messages.push({role:'assistant', content:text});
  messages = messages.slice(-40);
  write(LOG, messages);
  paint(root);
}

async function applyBuddy(root, button, options) {
  const id = button.dataset.buddy;
  const pick = findPick(messages, id);
  if (!id || !pick || sentTo()[id]) return;
  if (!store) {
    write(APPLIED, [...read(APPLIED, []), id]);
    paint(root);
    setTimeout(() => botSay(root, `${pick.buddy.nick}님에게 같이 먹자고 신청했어요! 수락하면 만날 시간과 장소를 정하면 돼요. (지금은 데모라 실제 학우에게 전달되지는 않아요)`), 600);
    return;
  }
  button.disabled = true;
  try {
    await store.sendRequest(id, {myNick:loadProfile().nick, toNick:pick.buddy.nick, place:pick.place});
    botSay(root, `${pick.buddy.nick}님에게 같이 먹자고 신청했어요! 수락하면 「📬 밥 신청함」에서 채팅을 열어 만날 시간과 장소를 정할 수 있어요.`);
  } catch (err) {
    button.disabled = false;
    options.toast(`신청을 보내지 못했어요. (${err.code || err.message})`);
  }
}

function openInbox(root) {
  messages = messages.filter(m => m.kind !== 'match-inbox');
  messages.push({role:'assistant', kind:'match-inbox', content:'(밥 신청함)'});
  write(LOG, messages);
  paint(root);
  showInLog(root, '.mm-inbox');
}

async function respond(button, status, options) {
  button.disabled = true;
  try {
    await store.respond(button.dataset.req, status);
    options.toast(status === 'accepted' ? '수락했어요! 채팅을 열어 약속을 잡아 보세요.' : '거절했어요.');
  } catch (err) {
    button.disabled = false;
    options.toast(`처리하지 못했어요. (${err.code || err.message})`);
  }
}

// 신청함을 실시간으로 받아서, 새 신청이 오면 알려 주고 화면을 고쳐 그려요
let chatOptions = null, connecting = false;
function connectStore(options) {
  if (connecting) return;
  connecting = true;
  mealStore().then(s => {
    if (!s) return;
    store = s;
    let known = null;
    s.watchRequests(list => {
      const fresh = list.filter(r => r.to === s.uid && r.status === 'pending' && known && !known.has(r.id));
      const acceptedNow = list.filter(r => r.from === s.uid && r.status === 'accepted' && known && known.get(r.id) === 'pending');
      known = new Map(list.map(r => [r.id, r.status]));
      requests = list;
      if (fresh.length) options.toast(`🍚 ${fresh[0].fromNick}님이 같이 밥 먹자고 신청했어요!`);
      if (acceptedNow.length) options.toast(`🎉 ${acceptedNow[0].toNick}님이 밥 신청을 수락했어요!`);
      const root = document.querySelector('.chat-page')?.parentElement;
      if (!root) return;
      root.querySelector('.mm-inbox-chip')?.replaceWith(Object.assign(document.createElement('template'), {innerHTML:inboxChip()}).content);
      if (messages.some(m => m.kind)) paint(root);
    });
    const chip = document.querySelector('.mm-inbox-chip');
    if (chip) chip.hidden = false;
  });
}

async function ask(root, question) {
  if (busy || !question.trim()) return;
  if (MATCH_RE.test(question)) { openMatch(root, question.trim()); return; }
  const found = findPlaces(question);
  const history = messages.filter(m => !m.error && !m.sticker && !m.kind).slice(-6).map(({role, content}) => ({role, content}));
  messages.push({role:'user', content:question.trim()});
  const answer = {role:'assistant', content:'생각하는 중…', refs:found.slice(0, 3).map(p => ({id:p.id, name:p.name}))};
  messages.push(answer);
  busy = true;
  paint(root);
  const {endpoint, model} = config();
  try {
    const response = await fetch(endpoint.replace(/\/$/, '') + '/api/chat', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model, stream:true, options:{temperature:0.3},
        messages:[{role:'system', content:systemPrompt(found)}, ...history, {role:'user', content:question.trim()}]}),
    });
    if (!response.ok) throw new Error(response.status === 404 ? `모델 '${model}'을(를) 찾지 못했어요. 연결 설정에서 모델 이름을 확인해 주세요.` : `LLM 서버 응답 오류 (${response.status})`);
    const reader = response.body.getReader(), decoder = new TextDecoder();
    let buffer = '', text = '';
    for (;;) {
      const {done, value} = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, {stream:true});
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.trim()) continue;
        const chunk = JSON.parse(line);
        if (chunk.error) throw new Error(chunk.error);
        text += chunk.message?.content ?? '';
        answer.content = text || '생각하는 중…';
        paint(root);
      }
    }
    if (!text.trim()) answer.content = '답을 만들지 못했어요. 다시 물어봐 주세요.';
  } catch (error) {
    answer.error = true;
    answer.refs = [];
    answer.content = error instanceof TypeError
      ? `LLM에 연결하지 못했어요. 내 컴퓨터에서 Ollama가 켜져 있는지, 아래 'LLM 연결'의 주소(${endpoint})가 맞는지 확인해 주세요.`
      : error.message;
  } finally {
    busy = false;
    messages = messages.slice(-40);
    write(LOG, messages);
    paint(root);
  }
}

export function initChat(root, options) {
  getPlaces = options.getPlaces;
  chatOptions = options;
  // 밥친구 카드를 올린 적이 있으면 앱을 열 때부터 신청함을 받아요. 아니면 누티 화면을 처음 열 때 연결해요
  if (read('knut-campus-guide:meal-profile', null)) connectStore(options);
  root.addEventListener('submit', event => {
    if (event.target.matches('.match-form')) { event.preventDefault(); findBuddies(root, event.target); return; }
    if (event.target.id !== 'chat-form') return;
    event.preventDefault();
    const input = event.target.elements.q;
    const q = input.value;
    input.value = '';
    ask(root, q);
  });
  root.addEventListener('click', event => {
    const sticker = event.target.closest('.chat-page [data-sticker]');
    if (sticker) { sendSticker(root, sticker.dataset.sticker); return; }
    const control = event.target.closest('[data-chat]');
    if (!control) return;
    if (control.dataset.chat === 'ask') ask(root, control.dataset.q);
    if (control.dataset.chat === 'match') openMatch(root);
    if (control.dataset.chat === 'match-apply') applyBuddy(root, control, options);
    if (control.dataset.chat === 'match-inbox') openInbox(root);
    if (control.dataset.chat === 'match-accept') respond(control, 'accepted', options);
    if (control.dataset.chat === 'match-decline') respond(control, 'declined', options);
    if (control.dataset.chat === 'clear') { messages = []; write(LOG, messages); write(APPLIED, []); paint(root); options.toast('대화를 지웠어요.'); }
    if (control.dataset.chat === 'save-config') {
      const box = control.closest('.chat-config');
      write(CFG, {endpoint:box.querySelector('[name=endpoint]').value.trim() || DEFAULT.endpoint, model:box.querySelector('[name=model]').value.trim() || DEFAULT.model});
      box.querySelector('summary').textContent = 'LLM 연결 · ' + config().model;
      options.toast('연결 설정을 저장했어요.');
    }
  });
}

export function scrollChat(root) { paint(root); }
