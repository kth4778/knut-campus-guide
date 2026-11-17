// 챗봇: 내 컴퓨터에서 돌아가는 LLM(Ollama)에 질문하고, places.json에서 찾은 장소를 근거로 답해요.
// 대화 기록과 연결 설정은 이 브라우저(localStorage)에만 저장돼요.

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm = value => String(value ?? '').normalize('NFKC').toLowerCase();
const LOG = 'knut-campus-guide:chat';
const CFG = 'knut-campus-guide:chat-config';
const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };

const DEFAULT = {endpoint:'http://localhost:11434', model:'exaone3.5:2.4b'};
const config = () => ({...DEFAULT, ...read(CFG, {})});
const SUGGEST = ['학교 앞 싼 밥집 추천해줘', '프린트는 어디서 해?', '공강에 쉬기 좋은 곳', '시내 나가는 버스 알려줘'];
const STOP = new Set(['어디','어디서','어디야','추천','추천해줘','알려줘','있어','있나요','좋은','곳','뭐','뭐가','하는','하고','싶어','근처','학교']);

let messages = read(LOG, []);
let busy = false;
let getPlaces = () => [];

export function chatPage(header) {
  const c = config();
  return `${header}
    <main class="chat-page">
      <div class="chat-log" id="chat-log" aria-live="polite">${messages.length ? messages.map(bubble).join('') : intro()}</div>
      <div class="chat-suggest">${SUGGEST.map(q => `<button type="button" class="chip" data-chat="ask" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>
      <form class="chat-form" id="chat-form">
        <input name="q" aria-label="KNUTUIDE에게 질문" placeholder="학교생활 무엇이든 물어보세요" autocomplete="off" maxlength="300" required>
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

function intro() {
  return `<div class="chat-msg bot chat-intro"><p>안녕하세요, KNUTUIDE예요! 충주캠퍼스 맛집·숨은장소·생활꿀팁 ${getPlaces().length || ''}개를 바탕으로 답해 드려요. 무엇이 궁금하세요?</p></div>`;
}

function bubble(m) {
  const refs = (m.refs ?? []).map(r => `<a class="chip" href="#/place?id=${esc(r.id)}">${esc(r.name)}</a>`).join('');
  return `<div class="chat-msg ${m.role === 'user' ? 'me' : 'bot'}${m.error ? ' error' : ''}"><p>${esc(m.content).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>${refs ? `<div class="chat-refs">${refs}</div>` : ''}</div>`;
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
  return `너는 KNUTIPS 앱의 안내 챗봇 KNUTUIDE이다. 국립한국교통대학교 충주캠퍼스 학생을 돕는다. 이름을 물으면 KNUTUIDE라고 답한다. 한국어 존댓말로 3~5문장 안에 짧게 답한다.
아래 [자료]는 학생들이 직접 모은 장소·꿀팁이다. 자료에 있는 내용만 근거로 답하고, 장소 이름은 자료에 적힌 그대로 쓴다.
자료에 없는 내용은 지어내지 말고 "가이드 자료에는 없어요"라고 말한 뒤 학교 홈페이지나 에브리타임 확인을 권한다.${answerLanguage()}
[자료]
${found.length ? found.map(describe).join('\n') : '(질문과 맞는 자료 없음)'}`;
}

function paint(root) {
  const log = root.querySelector('#chat-log');
  if (!log) return;
  log.innerHTML = messages.length ? messages.map(bubble).join('') : intro();
  log.scrollTop = log.scrollHeight;
  const send = root.querySelector('#chat-form button');
  if (send) send.disabled = busy;
}

async function ask(root, question) {
  if (busy || !question.trim()) return;
  const found = findPlaces(question);
  const history = messages.filter(m => !m.error).slice(-6).map(({role, content}) => ({role, content}));
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
  root.addEventListener('submit', event => {
    if (event.target.id !== 'chat-form') return;
    event.preventDefault();
    const input = event.target.elements.q;
    const q = input.value;
    input.value = '';
    ask(root, q);
  });
  root.addEventListener('click', event => {
    const control = event.target.closest('[data-chat]');
    if (!control) return;
    if (control.dataset.chat === 'ask') ask(root, control.dataset.q);
    if (control.dataset.chat === 'clear') { messages = []; write(LOG, messages); paint(root); options.toast('대화를 지웠어요.'); }
    if (control.dataset.chat === 'save-config') {
      const box = control.closest('.chat-config');
      write(CFG, {endpoint:box.querySelector('[name=endpoint]').value.trim() || DEFAULT.endpoint, model:box.querySelector('[name=model]').value.trim() || DEFAULT.model});
      box.querySelector('summary').textContent = 'LLM 연결 · ' + config().model;
      options.toast('연결 설정을 저장했어요.');
    }
  });
}

export function scrollChat(root) { paint(root); }
