// 발표 화면의 「대본」 패널: 장마다 대본을 고치면 팀 공유 저장소(js/notes-store.js)에 저장되고, 열어 둔 모든 사람에게 바로 보인다.
// 고친 적 없는 장은 원래 대본(data/deck-order.json). 「이 장 원래대로」는 그 장의 공유 대본을 지운다.
import { notesStore, tidy, myName, setMyName } from './notes-store.js?v=1795490889';

const key = it => (it.kind === 'static' ? 's' + it.n : it.id);
const head = it => (it.notes.match(/^\[([^\]]+)\]\s*/) || [])[1] || it.speaker || '';
const base = it => it.notes.replace(/^\[[^\]]+\]\s*/, '');
const TEAM = ['김태현', '고다은', '김준석'];

function ago(iso) {
  const s = Math.max(0, (Date.now() - Date.parse(iso)) / 1000);
  if (s < 60) return '방금';
  if (s < 3600) return Math.floor(s / 60) + '분 전';
  if (s < 86400) return Math.floor(s / 3600) + '시간 전';
  return Math.floor(s / 86400) + '일 전';
}

export function initNotes(DECK, refit, { open = innerWidth >= 900 } = {}) {
  const panel = document.createElement('aside');
  panel.id = 'notesPanel';
  panel.innerHTML = `
    <div class="np-top"><b class="np-num"></b><span class="np-who"></span><button type="button" class="np-close" aria-label="대본 닫기">닫기</button></div>
    <label class="np-label" for="npText">대본 — 고치면 팀원 모두에게 저장돼요. 다른 곳에서 써 온 글을 붙여 넣어도 돼요</label>
    <textarea id="npText" spellcheck="false"></textarea>
    <div class="np-foot"><span class="np-status" role="status"></span><button type="button" class="np-reset">이 장 원래대로</button></div>
    <div class="np-me"><span>고치는 사람</span>${TEAM.map(n => `<button type="button" data-me="${n}">${n}</button>`).join('')}</div>`;
  document.body.appendChild(panel);
  const ta = panel.querySelector('textarea'), st = panel.querySelector('.np-status');
  const setStatus = t => { st.textContent = t; };
  let cur = 0, shared = {}, store = null, editing = false, timer = null, chain = Promise.resolve(), readOnly = false;

  const paintMe = () => panel.querySelectorAll('[data-me]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.me === myName())));
  panel.querySelector('.np-me').addEventListener('click', e => { const b = e.target.closest('[data-me]'); if (b) { setMyName(b.dataset.me); paintMe(); } });
  paintMe();

  function toggle(on = !document.body.classList.contains('notes-open')) { document.body.classList.toggle('notes-open', on); refit(); }
  addEventListener('knutips:notes', () => toggle());
  panel.querySelector('.np-close').onclick = () => toggle(false);
  addEventListener('resize', refit);

  async function render() {
    const it = DECK[cur], k = key(it), doc = shared[k];
    panel.querySelector('.np-num').textContent = `${cur + 1} / ${DECK.length}`;
    panel.querySelector('.np-who').textContent = head(it);
    if (!editing) ta.value = doc?.text ?? base(it);
    panel.querySelector('.np-reset').hidden = !doc || readOnly;
    if (!store) return;
    if (!doc) { setStatus(store.kind === 'local' ? '이 브라우저에만 저장돼요(공유 저장소 없음)' : '원래 대본 · 고치면 바로 저장돼요'); return; }
    let name = doc.by || '';
    if (store.kind === 'artifact' && doc.by && store.user?.profiles) { try { name = (await store.user.profiles([doc.by]))[doc.by]?.name || ''; } catch {} }
    if (key(DECK[cur]) === k && !editing) setStatus(`${name || '팀원'} 고침 · ${ago(doc.at)}`);
  }

  // 같은 장에는 한 번에 하나씩만 쓴다
  function save() {
    clearTimeout(timer);
    if (!store || readOnly) return;
    const it = DECK[cur], k = key(it), text = tidy(ta.value);
    if (text === tidy(shared[k]?.text ?? base(it))) return;
    setStatus('저장 중…');
    chain = chain.then(async () => {
      try {
        if (text === tidy(base(it))) await store.remove(k); else await store.save(k, text, myName());
        setStatus(store.kind === 'local' ? '이 브라우저에 저장했어요' : '팀원 모두에게 저장됨');
      } catch (e) {
        const denied = /permission|insufficient|invalid_argument/i.test(String(e?.code || e?.message));
        if (denied) { readOnly = true; ta.readOnly = true; setStatus('저장 권한이 아직 없어요(저장소 규칙을 게시해야 해요).'); }
        else setStatus('저장하지 못했어요. 잠시 뒤 다시 고쳐 주세요.');
      }
    });
  }
  ta.addEventListener('input', () => { editing = true; clearTimeout(timer); timer = setTimeout(save, 900); });
  ta.addEventListener('blur', () => { save(); editing = false; });
  panel.querySelector('.np-reset').onclick = () => {
    const k = key(DECK[cur]); editing = false; ta.value = base(DECK[cur]);
    if (!store || readOnly) return;
    setStatus('되돌리는 중…');
    chain = chain.then(() => store.remove(k).then(() => setStatus('원래 대본으로 돌렸어요'), () => setStatus('되돌리지 못했어요')));
  };
  addEventListener('knutips:slide', e => { if (editing) { save(); editing = false; } cur = e.detail.i; render(); });

  setStatus('공유 대본을 불러오는 중…');
  notesStore().then(s => {
    store = s;
    const slow = setTimeout(() => setStatus('공유 대본에 아직 연결하지 못했어요. 잠시 기다려 주세요.'), 10000);
    s.watch(m => { clearTimeout(slow); shared = m; render(); }, () => { clearTimeout(slow); setStatus('공유 대본을 읽을 권한이 아직 없어요(저장소 규칙을 게시해야 해요).'); });
  });
  if (open) toggle(true);
}
