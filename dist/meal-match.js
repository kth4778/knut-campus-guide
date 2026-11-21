// 혼밥 친구 매칭: 누티 챗봇 안에서 같이 밥 먹을 학우를 찾아 줘요.
// 1) 규칙으로 후보 거르기: 요일·시간·먹을 곳이 하나라도 겹치는 학우만 남겨요.
// 2) 특징 목록 만들기: 나와 후보의 취향을 글로 정리하고, 나와 겹치는 점도 적어요.
// 3) LLM이 고르기: 후보 기호(A, B, …)만 고를 수 있는 JSON 형식으로 받아서 목록에 없는 사람을 지어내지 못하게 해요.
//    LLM에 연결하지 못하면 겹치는 점 점수로 대신 골라요.
// Firebase(meal-store.js)가 연결되면 실제 학우들이 올린 밥친구 카드에서 고르고, 신청·수락·채팅도 실제로 오가요.
// 연결 설정이 없으면 예시 학우로 동작하는 데모예요 (신청은 이 브라우저(localStorage)에만 남아요).

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PROFILE = 'knut-campus-guide:meal-profile';
const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };

export const MATCH_RE = /혼밥|밥\s*친구|밥\s*메이트|같이\s*(밥|먹을|먹자)|meal\s*(buddy|mate|friend)|eat\s+(together|with)|lunch\s*buddy|饭友|一起吃|ご飯友|一緒に(食べ|ご飯)/i;

const DAYS = ['월', '화', '수', '목', '금'];
const TIMES = ['점심', '저녁', '야식'];
const FOODS = ['한식', '분식', '중식', '일식', '양식', '고기', '치킨', '카페'];
const AREAS = ['교내', '학교 앞', '시내'];
const MOODS = ['조용히 밥만', '가볍게 대화', '수다 환영'];
const PAYS = ['각자 계산', '상관없음'];
const DEFAULT_PROFILE = {nick:'', dept:'', year:0, visible:true, days:['월', '화', '수', '목', '금'], times:['점심'], foods:['한식', '분식'], areas:['교내', '학교 앞'], mood:'가볍게 대화', pay:'각자 계산', intro:''};

// 예시 학우 (데모)
const BUDDIES = [
  {id:'b1', nick:'국밥러버', face:'🐻', dept:'기계공학과', year:3, days:['월','화','수'], times:['점심','저녁'], foods:['한식','고기'], areas:['학교 앞'], mood:'가볍게 대화', pay:'각자 계산', intro:'실험 끝나고 든든한 국밥 한 그릇 같이 해요'},
  {id:'b2', nick:'떡볶이요정', face:'🐰', dept:'산업디자인학과', year:2, days:['화','목'], times:['점심','야식'], foods:['분식','카페'], areas:['학교 앞','교내'], mood:'수다 환영', pay:'상관없음', intro:'과제 얘기, 덕질 얘기 다 좋아요! 떡볶이는 무조건 매운맛'},
  {id:'b3', nick:'조용한숟가락', face:'🐱', dept:'컴퓨터공학과', year:4, days:['월','수','금'], times:['점심'], foods:['한식','일식'], areas:['교내'], mood:'조용히 밥만', pay:'각자 계산', intro:'말 없이 밥만 먹어도 괜찮은 분 구해요. 학식 자주 가요'},
  {id:'b4', nick:'마라탕중독', face:'🐼', dept:'화공생물공학과', year:2, days:['수','목','금'], times:['저녁'], foods:['중식','양식'], areas:['학교 앞','시내'], mood:'가볍게 대화', pay:'각자 계산', intro:'마라탕 2단계 이상 가능하신 분 환영'},
  {id:'b5', nick:'새내기밥친구', face:'🐧', dept:'경영학과', year:1, days:['월','화','수','목','금'], times:['점심'], foods:['한식','분식','양식'], areas:['교내','학교 앞'], mood:'수다 환영', pay:'각자 계산', intro:'아직 친구가 별로 없어요ㅠ 학교 앞 맛집 같이 뚫어요'},
  {id:'b6', nick:'돈까스장인', face:'🦊', dept:'전자공학과', year:3, days:['화','목'], times:['점심','저녁'], foods:['일식','양식'], areas:['학교 앞'], mood:'가볍게 대화', pay:'상관없음', intro:'돈까스·덮밥 맛집 리스트 공유해요'},
  {id:'b7', nick:'야식킹', face:'🐯', dept:'건축학부', year:4, days:['월','화','수','목'], times:['야식'], foods:['치킨','고기','분식'], areas:['학교 앞'], mood:'수다 환영', pay:'상관없음', intro:'설계 밤샘 전에 치킨 반반 나눠 먹을 분'},
  {id:'b8', nick:'학식탐험가', face:'🐶', dept:'행정학과', year:2, days:['월','수','금'], times:['점심','저녁'], foods:['한식','중식'], areas:['교내'], mood:'가볍게 대화', pay:'각자 계산', intro:'오늘 학식 메뉴 뭔지 같이 확인하고 가요'},
  {id:'b9', nick:'카페순례자', face:'🐰', dept:'영어영문학과', year:3, days:['화','수','목'], times:['점심'], foods:['카페','양식'], areas:['학교 앞','시내'], mood:'수다 환영', pay:'각자 계산', intro:'브런치·베이글 좋아해요. 공강에 카페도 같이 가요'},
  {id:'b10', nick:'고기앞으로', face:'🐻', dept:'스포츠산업학과', year:3, days:['목','금'], times:['저녁'], foods:['고기','한식'], areas:['시내','학교 앞'], mood:'수다 환영', pay:'각자 계산', intro:'운동 끝나고 고기 먹을 사람! 2인분부터 시켜요'},
  {id:'b11', nick:'혼밥탈출', face:'🐱', dept:'안전공학과', year:1, days:['월','화','목'], times:['점심','저녁'], foods:['분식','중식','치킨'], areas:['교내','학교 앞'], mood:'가볍게 대화', pay:'각자 계산', intro:'기숙사생이라 저녁 같이 먹을 분 찾아요'},
  {id:'b12', nick:'초밥한접시', face:'🐧', dept:'음악학과', year:2, days:['수','금'], times:['저녁'], foods:['일식','카페'], areas:['시내'], mood:'조용히 밥만', pay:'각자 계산', intro:'연습 끝나고 시내에서 초밥·우동 먹어요'},
];

const DAY_ALL = '평일 아무 때나';
const listText = arr => arr.length === 5 && arr.every(d => DAYS.includes(d)) ? DAY_ALL : arr.join('·');
const overlap = (a = [], b = []) => a.filter(x => b.includes(x));

export const loadProfile = () => ({...DEFAULT_PROFILE, nick:read('knut-campus-guide:nick', '') || '', ...read(PROFILE, {})});
export const saveLocalProfile = p => write(PROFILE, p);

// 실제 학우 카드(Firestore)를 예시 학우와 같은 모양으로
const FACES = ['🐻', '🦊', '🐰', '🐱', '🐶', '🐼', '🐧', '🐯'];
export const toBuddy = p => ({id:p.id, nick:p.nick, face:FACES[[...p.id].reduce((n, c) => n + c.charCodeAt(0), 0) % FACES.length],
  dept:p.dept || '학과 비공개', year:p.year || 0, days:p.days ?? [], times:p.times ?? [], foods:p.foods ?? [], areas:p.areas ?? [],
  mood:p.mood ?? '', pay:p.pay ?? '', intro:p.intro || '(소개 없음)'});
const yearText = y => y ? `${y}학년` : '';

// ── 화면 ──
const chipGroup = (name, options, picked, type = 'checkbox') => `<div class="mm-chips">${options.map(o =>
  `<label><input type="${type}" name="${name}" value="${esc(o)}" ${picked.includes(o) ? 'checked' : ''}><span>${esc(o)}</span></label>`).join('')}</div>`;

export function matchFormCard(online) {
  const p = loadProfile();
  return `<div class="match-box">
    <form class="match-form">
      <p class="mm-title">🍚 혼밥 친구 찾기</p>
      <p class="mm-sub">${online ? '언제, 무엇을, 어디서 먹고 싶은지 골라 주세요. 밥친구 카드를 올린 학우들 중에서 누티가 잘 맞는 사람을 찾아 드려요.'
        : '언제, 무엇을, 어디서 먹고 싶은지 골라 주세요. 누티가 잘 맞는 학우를 찾아 드려요. (지금은 예시 학우로 보여 주는 데모예요)'}</p>
      ${online ? `<div class="mm-me">
        <label class="mm-intro"><span>닉네임</span><input name="nick" maxlength="12" required value="${esc(p.nick)}" placeholder="예) 학식러"></label>
        <label class="mm-intro"><span>학과</span><input name="dept" maxlength="20" value="${esc(p.dept)}" placeholder="예) 컴퓨터공학과"></label>
        <label class="mm-intro"><span>학년</span><select name="year">${[0, 1, 2, 3, 4].map(y => `<option value="${y}" ${+p.year === y ? 'selected' : ''}>${y ? y + '학년' : '비공개'}</option>`).join('')}</select></label>
      </div>` : ''}
      <fieldset><legend>요일</legend>${chipGroup('days', DAYS, p.days)}</fieldset>
      <fieldset><legend>시간</legend>${chipGroup('times', TIMES, p.times)}</fieldset>
      <fieldset><legend>먹고 싶은 것</legend>${chipGroup('foods', FOODS, p.foods)}</fieldset>
      <fieldset><legend>어디서</legend>${chipGroup('areas', AREAS, p.areas)}</fieldset>
      <fieldset><legend>밥 먹을 때 분위기</legend>${chipGroup('mood', MOODS, [p.mood], 'radio')}</fieldset>
      <fieldset><legend>계산</legend>${chipGroup('pay', PAYS, [p.pay], 'radio')}</fieldset>
      <label class="mm-intro"><span>한 줄 소개 (선택)</span><input name="intro" maxlength="60" value="${esc(p.intro)}" placeholder="예) 학식 자주 먹는 2학년이에요"></label>
      ${online ? `<label class="mm-visible"><input type="checkbox" name="visible" ${p.visible ? 'checked' : ''}><span>내 밥친구 카드를 다른 학우에게 보여 주기<small>닉네임·학과·학년과 위 취향만 보여요. 끄면 나는 찾기만 하고 남에게는 안 보여요.</small></span></label>` : ''}
      <p class="mm-error" role="status"></p>
      <button type="submit" class="primary">밥친구 찾기</button>
    </form></div>`;
}

export function readProfile(form, online) {
  const all = name => [...form.querySelectorAll(`[name="${name}"]:checked`)].map(i => i.value);
  const field = name => form.elements[name]?.value.trim() ?? '';
  const p = {nick:field('nick').slice(0, 12), dept:field('dept').slice(0, 20), year:+field('year') || 0, visible:!!form.elements.visible?.checked,
    days:all('days'), times:all('times'), foods:all('foods'), areas:all('areas'),
    mood:all('mood')[0] || DEFAULT_PROFILE.mood, pay:all('pay')[0] || DEFAULT_PROFILE.pay, intro:form.elements.intro.value.trim().slice(0, 60)};
  const missing = [['days', '요일'], ['times', '시간'], ['foods', '먹고 싶은 것'], ['areas', '어디서']].find(([k]) => !p[k].length);
  if (missing) return {error:`${missing[1]}을(를) 하나 이상 골라 주세요.`};
  if (online && !p.nick) return {error:'닉네임을 적어 주세요.'};
  write(PROFILE, p);
  return {profile:p};
}

export const profileSummary = p => `밥친구 찾아줘: ${listText(p.days)} ${p.times.join('·')} · ${p.foods.join('·')} · ${p.areas.join('·')} · ${p.mood}`;

export function matchResultCard(m, sent) {
  const picks = (m.picks ?? []).map(pick => {
    const b = pick.buddy ?? BUDDIES.find(x => x.id === pick.id);
    if (!b) return '';
    const done = sent[b.id];
    return `<article class="mm-buddy">
      <div class="mm-head"><span class="mm-face" aria-hidden="true">${b.face}</span><div><b>${esc(b.nick)}</b><small>${esc(b.dept)} ${yearText(b.year)}</small></div></div>
      <p class="mm-tags">${[listText(b.days), b.times.join('·'), b.foods.join('·'), b.areas.join('·'), b.mood].map(t => `<span>${esc(t)}</span>`).join('')}</p>
      <p class="mm-quote">“${esc(b.intro)}”</p>
      <p class="mm-reason">💡 ${esc(pick.reason)}</p>
      ${pick.place ? `<a class="chip mm-place" href="#/place?id=${esc(pick.place.id)}">🍽️ 같이 가기 좋은 곳 · ${esc(pick.place.name)}</a>` : ''}
      <button type="button" class="${done ? 'pill' : 'primary'} mm-apply" data-chat="match-apply" data-buddy="${b.id}" ${done ? 'disabled' : ''}>${done ? esc(done) : '같이 먹자 신청'}</button>
    </article>`;
  }).join('');
  return `<div class="match-box mm-result">
    <p class="mm-title">${esc(m.content)}</p>
    ${m.note ? `<p class="mm-sub">${esc(m.note)}</p>` : ''}
    ${picks}
    ${m.picks?.length ? '<button type="button" class="pill mm-again" data-chat="match">조건 바꿔서 다시 찾기</button>' : ''}
  </div>`;
}

export const findPick = (messages, id) => {
  for (const m of [...messages].reverse()) { const pick = m.picks?.find(p => p.id === id); if (pick) return {...pick, buddy:pick.buddy ?? BUDDIES.find(b => b.id === id)}; }
  return null;
};

// 밥 신청함: 받은 신청(수락·거절), 수락된 밥약속(채팅 열기), 보낸 신청(기다리는 중)
const ago = at => { const m = Math.round((Date.now() - at) / 6e4); return m < 1 ? '방금' : m < 60 ? `${m}분 전` : m < 1440 ? `${Math.round(m / 60)}시간 전` : `${Math.round(m / 1440)}일 전`; };
export function inboxCard(requests, uid) {
  if (!requests) return '<div class="match-box"><p class="mm-title">📬 밥 신청함</p><p class="mm-sub">불러오는 중…</p></div>';
  const row = (r, body) => `<article class="mm-req"><div><b>${esc(r.from === uid ? r.toNick : r.fromNick)}</b><small>${ago(r.at)}${r.place ? ' · ' + esc(r.place.name) : ''}</small></div>${body}</article>`;
  const incoming = requests.filter(r => r.to === uid && r.status === 'pending');
  const accepted = requests.filter(r => r.status === 'accepted');
  const waiting = requests.filter(r => r.from === uid && r.status !== 'accepted');
  const section = (title, list, body) => list.length ? `<p class="mm-sec">${title}</p>${list.map(r => row(r, body(r))).join('')}` : '';
  return `<div class="match-box mm-inbox">
    <p class="mm-title">📬 밥 신청함</p>
    ${section('나에게 온 신청', incoming, r => `<div class="mm-req-act"><button type="button" class="primary" data-chat="match-accept" data-req="${esc(r.id)}">수락</button><button type="button" class="pill" data-chat="match-decline" data-req="${esc(r.id)}">거절</button></div>`)}
    ${section('같이 먹기로 한 학우', accepted, r => `<a class="primary mm-room" href="#/meal-room?id=${encodeURIComponent(r.id)}">채팅 열기</a>`)}
    ${section('내가 보낸 신청', waiting, r => `<span class="mm-state">${r.status === 'declined' ? '거절됨' : '기다리는 중'}</span>`)}
    ${incoming.length + accepted.length + waiting.length ? '' : '<p class="mm-sub">아직 주고받은 신청이 없어요. 「혼밥 친구 찾기」로 밥친구를 찾아 보세요.</p>'}
  </div>`;
}

// ── 매칭 ──
function shared(me, b) {
  return {days:overlap(me.days, b.days), times:overlap(me.times, b.times), foods:overlap(me.foods, b.foods),
    areas:overlap(me.areas, b.areas), mood:me.mood === b.mood, pay:me.pay === b.pay || me.pay === '상관없음' || b.pay === '상관없음'};
}
function ruleScore(s) {
  return s.days.length + s.times.length * 2 + s.foods.length * 3 + s.areas.length + (s.mood ? 2 : 0) + (s.pay ? 1 : 0);
}
function ruleReason(s) {
  const parts = [s.times.length && `${s.times.join('·')} 시간`, s.foods.length && `${s.foods.join('·')} 취향`, s.mood && '밥 먹을 때 분위기'].filter(Boolean);
  return parts.length ? `나와 같은 점: ${parts.join(' · ')}` : '먹는 시간과 장소가 겹쳐요.';
}

// 둘이 같이 가기 좋은 식당: 둘 다 가는 지역의 맛집 중 둘이 좋아하는 메뉴와 맞는 곳
const FOOD_WORDS = {한식:'국밥 찌개 백반 한식 김치 비빔 감자탕 순대 덮밥 칼국수', 분식:'떡볶이 김밥 분식 라면 튀김', 중식:'짜장 짬뽕 마라 중국 탕수육 꿔바로우 중화',
  일식:'돈까스 돈가스 초밥 스시 라멘 우동 일식 규동 소바', 양식:'파스타 피자 버거 햄버거 스테이크 부리또 샐러드 브런치', 고기:'고기 삼겹 갈비 목살 고깃',
  치킨:'치킨 닭강정 통닭', 카페:'카페 커피 디저트 베이글 케이크 빵'};
const AREA_OF = {'교내':'교내', '학교 앞':'대소원', '시내':'충주 시내'};
function pickPlace(places, me, b, s) {
  const areas = (s.areas.length ? s.areas : me.areas).map(a => AREA_OF[a]);
  const words = (s.foods.length ? s.foods : me.foods).flatMap(f => FOOD_WORDS[f].split(' '));
  let best = null, bestScore = 0;
  for (const p of places) {
    if (p.category !== '맛집' || !areas.includes(p.area)) continue;
    const text = [p.name, ...(p.menus ?? []).map(m => m.name), ...(p.reasons ?? [])].join(' ');
    const hit = words.filter(w => text.includes(w)).length;
    const score = hit ? hit * 3 + Math.min(p.rec ?? 0, 10) * 0.1 : 0;
    if (score > bestScore) { best = p; bestScore = score; }
  }
  return best ? {id:best.id, name:best.name} : null;
}

const fmt = (label, b, s) => [
  `[후보 ${label}] ${b.nick} · ${b.dept} ${yearText(b.year)}`,
  `  요일: ${listText(b.days)} / 시간: ${b.times.join('·')} / 장소: ${b.areas.join('·')}`,
  `  먹고 싶은 것: ${b.foods.join('·')} / 분위기: ${b.mood} / 계산: ${b.pay}`,
  `  소개: ${b.intro}`,
  `  나와 같은 것: ${[...s.times, ...s.foods, ...s.areas, s.mood && b.mood].filter(Boolean).join(', ') || '없음'}`,
].join('\n');

function answerLanguage() {
  const name = {en:'English', zh:'简体中文', ja:'日本語'}[window.knutLang?.()];
  return name ? `reason은 반드시 ${name}로 쓴다.` : 'reason은 한국어 존댓말 한 문장으로 쓴다.';
}

export async function runMatch(me, {endpoint, model, places, buddies = BUDDIES}) {
  // 1) 규칙: 요일·시간·장소가 하나라도 겹치는 학우만
  if (!buddies.length) return {content:'아직 밥친구 카드를 올린 학우가 없어요.', note:'내 카드를 「보여 주기」로 올려 두면, 다른 학우가 찾을 때 내가 추천돼요.', picks:[]};
  let pool = buddies.map(b => ({b, s:shared(me, b)})).filter(x => x.s.days.length && x.s.times.length && x.s.areas.length);
  let note = '';
  if (pool.length < 3) {
    pool = buddies.map(b => ({b, s:shared(me, b)})).filter(x => x.s.days.length && x.s.times.length);
    note = '장소까지 맞는 학우가 적어서 장소 조건은 넓혀서 찾았어요.';
  }
  if (!pool.length) return {content:'지금 조건에 맞는 학우가 없어요.', note:'요일이나 시간을 더 골라서 다시 찾아 주세요.', picks:[]};
  // 점수 높은 8명만 LLM에 보내고, 순서는 섞어서 점수에 끌려가지 않게 해요
  pool = pool.sort((x, y) => ruleScore(y.s) - ruleScore(x.s)).slice(0, 8).sort(() => Math.random() - 0.5);
  const labels = pool.map((_, i) => String.fromCharCode(65 + i));
  const want = Math.min(3, pool.length);

  let picks = [];
  try {
    const mine = `[나] 요일: ${listText(me.days)} / 시간: ${me.times.join('·')} / 장소: ${me.areas.join('·')}\n  먹고 싶은 것: ${me.foods.join('·')} / 분위기: ${me.mood} / 계산: ${me.pay}${me.intro ? `\n  소개: ${me.intro}` : ''}`;
    const response = await fetch(endpoint.replace(/\/$/, '') + '/api/chat', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model, stream:false, options:{temperature:0.2},
        format:{type:'object', required:['picks'], properties:{picks:{type:'array', items:{type:'object', required:['id', 'reason'],
          properties:{id:{type:'string', enum:labels}, reason:{type:'string'}}}}}},
        messages:[
          {role:'system', content:`너는 KNUTIPS 챗봇 누티의 혼밥 친구 매칭 매니저이다. 혼자 밥 먹는 학생에게 같이 밥 먹을 학우를 골라 준다.
판단 기준(중요한 순서): 같이 먹을 수 있는 시간이 겹치는지 > 먹고 싶은 것이 같은지 > 밥 먹을 때 분위기가 맞는지 > 계산 방식 > 소개글.
목록에 적힌 내용만 근거로 쓰고, 같은 후보를 두 번 고르지 않는다. 가장 잘 맞는 ${want}명을 잘 맞는 순서대로 고른다.
reason에는 나와 겹치는 점을 구체적으로 넣는다. ${answerLanguage()}
답은 {"picks":[{"id":"후보 기호","reason":"고른 이유"}]} JSON으로만 한다.`},
          {role:'user', content:`${mine}\n\n${pool.map((x, i) => fmt(labels[i], x.b, x.s)).join('\n\n')}`},
        ]}),
    });
    if (!response.ok) throw new Error(String(response.status));
    const data = await response.json();
    const seen = new Set();
    for (const pick of JSON.parse(data.message?.content ?? '{}').picks ?? []) {
      const i = labels.indexOf(String(pick?.id).trim().toUpperCase());
      if (i < 0 || seen.has(i)) continue;
      seen.add(i);
      let reason = String(pick.reason ?? '').replace(/\s+/g, ' ').trim();
      if (reason.length > 140) reason = reason.slice(0, 140).replace(/[^.!?。]*$/, '') || reason.slice(0, 140) + '…';
      picks.push({x:pool[i], reason:reason || ruleReason(pool[i].s)});
      if (picks.length === want) break;
    }
  } catch {
    note = 'LLM에 연결하지 못해서 겹치는 점이 많은 순서로 골랐어요.' + (note ? ' ' + note : '');
  }
  // LLM이 덜 골랐으면 점수 순으로 채워요
  for (const x of [...pool].sort((a, b) => ruleScore(b.s) - ruleScore(a.s))) {
    if (picks.length >= want) break;
    if (!picks.some(p => p.x === x)) picks.push({x, reason:ruleReason(x.s)});
  }
  return {content:`잘 맞는 밥친구 ${picks.length}명을 찾았어요!`, note,
    picks:picks.map(({x, reason}) => ({id:x.b.id, reason, place:pickPlace(places, me, x.b, x.s), ...(buddies === BUDDIES ? {} : {buddy:x.b})}))};
}
