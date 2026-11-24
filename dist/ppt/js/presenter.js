// 발표자 화면: 지금 청중 화면(실시간) · 다음 장 · 대본 · 타이머. 키보드·리모컨으로 넘기면 청중 창이 따라온다.
const chan = new BroadcastChannel('knutips-deck');
const DECK = await fetch('data/deck-order.json').then(r => r.json());
const N = DECK.length;
let cur = Math.max(0, (+(location.hash.match(/#\/(\d+)/) || [])[1] || 1) - 1);
let black = false, aud = null;
// 대본: 팀 공유 대본(js/notes-store.js — 실제 사이트는 Firestore, 내 컴퓨터는 이 브라우저)이 있으면 그것, 없으면 원래 대본
// 여러 명이 동시에 고쳐도 글자 단위로 합쳐진다(Yjs). 고칠 때마다 바로 반영, 다른 사람 글이 들어오면 내 커서는 그대로
import { notesStore, tidy, shiftCaret } from './notes-store.js?v=1795497608';
const key = i => DECK[i].kind === 'static' ? 's' + DECK[i].n : DECK[i].id;
const body = i => DECK[i].notes.replace(/^\[[^\]]+\]\s*/, '');
let SHARED = {}, store = null, saving = '';
const noteOf = i => SHARED[key(i)]?.text ?? body(i);
function showStatus() {
  const d = SHARED[key(cur)], el = document.getElementById('saved');
  if (saving === 'denied') return (el.textContent = '저장 권한이 아직 없어요(저장소 규칙 게시 필요) · 고친 글은 이 브라우저에 보관 중');
  if (saving === 'offline') return (el.textContent = '연결이 끊겨 잠시 뒤 다시 보내요 · 고친 글은 이 브라우저에 보관 중');
  const where = store?.kind === 'local' ? ' · 이 브라우저에만 저장' : '';
  el.textContent = d ? `팀 대본 — ${d.by || '팀원'} 고침${d.at ? ' · ' + new Date(d.at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}${where}` : '원래 대본' + where;
}
const $ = id => document.getElementById(id);
$('live').src = `index.html?preview&live#/${cur + 1}`;

function setNotes(next) {
  const ta = $('notes');
  if (ta.value === next) return;
  if (document.activeElement === ta) {
    const [a, b] = [ta.selectionStart, ta.selectionEnd], old = ta.value;
    ta.value = next; ta.setSelectionRange(shiftCaret(old, next, a), shiftCaret(old, next, b));
  } else ta.value = next;
}
function render() {
  $('num').textContent = `${cur + 1} / ${N}`;
  const it = DECK[cur];
  $('speaker').textContent = it.speaker;
  const m = it.notes.match(/^\[([^\]]+)\]\s*/);
  $('who').textContent = m ? m[1] : '';
  setNotes(noteOf(cur));
  showStatus();
  $('nextF').src = cur + 1 < N ? `index.html?preview&i=${cur + 1}` : 'about:blank';
  history.replaceState(null, '', '#/' + (cur + 1));
}
function go(i, send = true) {
  i = Math.max(0, Math.min(N - 1, i));
  cur = i;
  if (send) chan.postMessage({ type: 'go', i, role: 'presenter' });
  render();
}
chan.onmessage = ({ data }) => {
  if (!data) return;
  if (data.type === 'hello') chan.postMessage({ type: 'go', i: cur, role: 'presenter' });
  if (data.role !== 'aud') return;          // 청중 창에서 넘긴 것만 따라간다
  if (data.type === 'go' && data.i !== cur) go(data.i, false);
  if (data.type === 'black') { black = data.on; $('black').classList.toggle('on', black); }
};
function setBlack(on) { black = on; $('black').classList.toggle('on', on); chan.postMessage({ type: 'black', on, role: 'presenter' }); }

addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.target.isContentEditable || e.target.tagName === 'TEXTAREA') { if (e.key === 'Escape') e.target.blur(); return; }   // 대본을 고치는 중에는 장을 넘기지 않는다
  const k = e.key;
  if (['ArrowRight', 'PageDown', ' ', 'Enter', 'ArrowDown'].includes(k)) { e.preventDefault(); go(cur + 1); }
  else if (['ArrowLeft', 'PageUp', 'ArrowUp', 'Backspace'].includes(k)) { e.preventDefault(); go(cur - 1); }
  else if (k === 'Home') go(0);
  else if (k === 'End') go(N - 1);
  else if (k === 'b' || k === 'B' || k === '.') setBlack(!black);
});
$('prev').onclick = () => go(cur - 1);
$('next').onclick = () => go(cur + 1);
$('black').onclick = () => setBlack(!black);

// 청중 화면: 화면이 둘이면 바깥 화면(프로젝터)에 바로 띄운다(크롬이 「창 관리」 권한을 물어볼 수 있다)
$('openAud').onclick = async () => {
  const url = `index.html?aud#/${cur + 1}`;
  let feat = 'popup,width=1280,height=720';
  try {
    if ('getScreenDetails' in window) {
      const sd = await window.getScreenDetails();
      const other = sd.screens.find(s => s !== sd.currentScreen) || null;
      if (other) feat = `popup,left=${other.availLeft},top=${other.availTop},width=${other.availWidth},height=${other.availHeight}`;
    }
  } catch {}
  aud = window.open(url, 'knutips-aud', feat);
};

render();
chan.postMessage({ type: 'go', i: cur, role: 'presenter' });
notesStore().then(s => {
  if (!s) { $('saved').textContent = '대본 동기화 도구를 불러오지 못했어요(인터넷 연결 확인)'; return; }
  store = s;
  s.onState(v => { saving = v; showStatus(); });
  s.watch(m => { SHARED = m; $('notes').readOnly = false; setNotes(noteOf(cur)); showStatus(); },
    () => { $('saved').textContent = '공유 대본을 읽을 권한이 아직 없어요(저장소 규칙 게시 필요)'; });
});

$('notes').addEventListener('input', () => store?.edit(key(cur), body(cur), $('notes').value));
// 붙여 넣을 때 서식은 빼고 글자만(카톡·문서에서 가져온 글 정리)
$('notes').addEventListener('paste', e => { e.preventDefault(); document.execCommand('insertText', false, tidy(e.clipboardData.getData('text/plain'))); });
$('resetNote').onclick = () => store?.edit(key(cur), body(cur), body(cur));   // 이 장을 원래 대본으로(고친 기록은 남는다)
// 고친 대본을 파일로: deck-order.json 모양 그대로(이 파일로 data/deck-order.json을 바꾸면 다른 컴퓨터에서도 같은 대본)
$('saveFile').onclick = () => {
  const out = DECK.map((it, i) => { const m = it.notes.match(/^\[[^\]]+\]\s*/); return { ...it, notes: (m ? m[0] : '') + noteOf(i) }; });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 1)], { type: 'application/json' }));
  a.download = 'deck-order.json'; a.click();
};
