// 발표 화면의 「대본」 패널: 장마다 대본을 고치면 팀 공유 저장소(js/notes-store.js)에 쌓이고, 열어 둔 모든 사람에게 바로 보인다.
// 여러 명이 같은 장을 동시에 고쳐도 글자 단위로 합쳐져 서로의 글이 지워지지 않는다.
// 고친 적 없는 장은 원래 대본(data/deck-order.json). 「이 장 원래대로」는 그 장을 원래 대본으로 다시 고친다(고친 기록은 남는다).
import { notesStore, tidy, myName, setMyName, shiftCaret } from './notes-store.js?v=1795498706';

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
    <label class="np-label" for="npText">대본 — 팀원이 동시에 고쳐도 서로의 글이 합쳐져 남아요. 다른 곳에서 써 온 글을 붙여 넣어도 돼요</label>
    <textarea id="npText" spellcheck="false" readonly></textarea>
    <div class="np-foot"><span class="np-status" role="status"></span><button type="button" class="np-reset">이 장 원래대로</button></div>
    <div class="np-me"><span>고치는 사람</span>${TEAM.map(n => `<button type="button" data-me="${n}">${n}</button>`).join('')}</div>`;
  document.body.appendChild(panel);
  const ta = panel.querySelector('textarea'), st = panel.querySelector('.np-status');
  const setStatus = t => { st.textContent = t; };
  let cur = 0, shared = {}, store = null, saving = '';

  const paintMe = () => panel.querySelectorAll('[data-me]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.me === myName())));
  panel.querySelector('.np-me').addEventListener('click', e => { const b = e.target.closest('[data-me]'); if (b) { setMyName(b.dataset.me); paintMe(); } });
  paintMe();

  function toggle(on = !document.body.classList.contains('notes-open')) { document.body.classList.toggle('notes-open', on); refit(); }
  addEventListener('knutips:notes', () => toggle());
  panel.querySelector('.np-close').onclick = () => toggle(false);
  addEventListener('resize', refit);

  const textOf = it => shared[key(it)]?.text ?? base(it);
  function status() {
    if (!store) return;
    if (saving === 'denied') return setStatus('저장 권한이 아직 없어요(저장소 규칙 게시 필요). 고친 글은 이 브라우저에 보관했다가 권한이 생기면 보내요.');
    if (saving === 'offline') return setStatus('연결이 끊겨 잠시 뒤 다시 보내요. 고친 글은 이 브라우저에 보관 중');
    if (saving === 'saving') return setStatus('저장 중…');
    const doc = shared[key(DECK[cur])];
    if (!doc) return setStatus(store.kind === 'local' ? '이 브라우저에만 저장돼요(공유 저장소 없음)' : '원래 대본 · 고치면 바로 팀 전체에 저장');
    setStatus(`${doc.by || '팀원'} 고침 · ${doc.at ? ago(doc.at) : '방금'}${saving === 'saved' ? ' · 팀원 모두에게 저장됨' : ''}`);
  }
  function render() {
    const it = DECK[cur];
    panel.querySelector('.np-num').textContent = `${cur + 1} / ${DECK.length}`;
    panel.querySelector('.np-who').textContent = head(it);
    const next = textOf(it);
    if (ta.value !== next) {
      if (document.activeElement === ta) {
        // 내가 쓰는 중에 다른 팀원 글이 들어오면, 내 커서는 같은 글자 옆에 그대로
        const [s0, s1] = [ta.selectionStart, ta.selectionEnd], old = ta.value;
        ta.value = next;
        ta.setSelectionRange(shiftCaret(old, next, s0), shiftCaret(old, next, s1));
      } else ta.value = next;
    }
    status();
  }

  ta.addEventListener('input', () => { if (store) store.edit(key(DECK[cur]), base(DECK[cur]), ta.value); });
  ta.addEventListener('paste', e => {
    e.preventDefault();
    document.execCommand('insertText', false, tidy(e.clipboardData.getData('text/plain')));
  });
  panel.querySelector('.np-reset').onclick = () => { if (store) store.edit(key(DECK[cur]), base(DECK[cur]), base(DECK[cur])); };
  addEventListener('knutips:slide', e => { cur = e.detail.i; render(); });

  setStatus('공유 대본을 불러오는 중…');
  render();
  notesStore().then(s => {
    if (!s) { setStatus('대본 동기화 도구를 불러오지 못했어요(인터넷 연결 확인). 지금은 원래 대본만 보여요.'); return; }
    store = s;
    const slow = setTimeout(() => setStatus('공유 대본에 아직 연결하지 못했어요. 잠시 기다려 주세요.'), 10000);
    s.onState(v => { saving = v; status(); });
    s.watch(m => { clearTimeout(slow); shared = m; ta.readOnly = false; render(); },
      () => { clearTimeout(slow); setStatus('공유 대본을 읽을 권한이 아직 없어요(저장소 규칙 게시 필요).'); });
  });
  if (open) toggle(true);
}
