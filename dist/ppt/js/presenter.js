// 발표자 화면: 지금 청중 화면(실시간) · 다음 장 · 대본 · 타이머. 키보드·리모컨으로 넘기면 청중 창이 따라온다.
const chan = new BroadcastChannel('knutips-deck');
const DECK = await fetch('data/deck-order.json').then(r => r.json());
const N = DECK.length;
let cur = Math.max(0, (+(location.hash.match(/#\/(\d+)/) || [])[1] || 1) - 1);
let black = false, aud = null;
// 대본: 팀 공유 대본(js/notes-store.js — 실제 사이트는 Firestore, 내 컴퓨터는 이 브라우저)이 있으면 그것, 없으면 원래 대본
import { notesStore, tidy, myName } from './notes-store.js?v=1795489195';
const key = i => DECK[i].kind === 'static' ? 's' + DECK[i].n : DECK[i].id;
const body = i => DECK[i].notes.replace(/^\[[^\]]+\]\s*/, '');
let SHARED = {}, store = null;
const noteOf = i => SHARED[key(i)]?.text ?? body(i);
async function saveEdit() {
  if (!store) return;
  const t = tidy(document.getElementById('notes').innerText), k = key(cur);
  if (t === tidy(noteOf(cur))) return;
  try {
    if (t === tidy(body(cur))) await store.remove(k); else await store.save(k, t, myName());
    document.getElementById('saved').textContent = store.kind === 'local' ? '이 브라우저에 저장했어요' : '팀원 모두에게 저장됨';
  } catch { document.getElementById('saved').textContent = '저장하지 못했어요(저장 권한 확인 필요)'; }
}
function showStatus() {
  const d = SHARED[key(cur)], el = document.getElementById('saved');
  const where = store?.kind === 'local' ? ' · 이 브라우저에만 저장' : '';
  el.textContent = d ? `팀 대본 — ${d.by || '팀원'} 고침${d.at ? ' · ' + new Date(d.at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}${where}` : '원래 대본' + where;
}
const $ = id => document.getElementById(id);
$('live').src = `index.html?preview&live#/${cur + 1}`;

function render() {
  $('num').textContent = `${cur + 1} / ${N}`;
  const it = DECK[cur];
  $('speaker').textContent = it.speaker;
  const m = it.notes.match(/^\[([^\]]+)\]\s*/);
  $('who').textContent = m ? m[1] : '';
  $('notes').textContent = noteOf(cur);
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
  if (e.target.isContentEditable) { if (e.key === 'Escape') e.target.blur(); return; }   // 대본을 고치는 중에는 장을 넘기지 않는다
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
notesStore().then(s => { store = s; s.watch(m => { SHARED = m; if (document.activeElement !== document.getElementById('notes')) render(); else showStatus(); }); });

$('notes').addEventListener('input', () => { clearTimeout(window.__st); window.__st = setTimeout(saveEdit, 400); });
$('notes').addEventListener('blur', saveEdit);
// 붙여 넣을 때 서식(글꼴·색·표)은 빼고 글자만
$('notes').addEventListener('paste', e => { e.preventDefault(); document.execCommand('insertText', false, tidy(e.clipboardData.getData('text/plain'))); });
$('resetNote').onclick = () => { store?.remove(key(cur)); };   // 이 장의 공유 대본을 지우고 원래 대본으로
// 고친 대본을 파일로: deck-order.json 모양 그대로(이 파일로 data/deck-order.json을 바꾸면 다른 컴퓨터에서도 같은 대본)
$('saveFile').onclick = () => {
  const out = DECK.map((it, i) => { const m = it.notes.match(/^\[[^\]]+\]\s*/); return { ...it, notes: (m ? m[0] : '') + noteOf(i) }; });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 1)], { type: 'application/json' }));
  a.download = 'deck-order.json'; a.click();
};
