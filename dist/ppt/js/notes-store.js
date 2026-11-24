// 팀 공유 대본 저장소. 발표 화면의 「대본」 패널과 발표자 창이 같이 쓴다.
// 여러 명이 같은 장을 동시에 고쳐도 글이 사라지지 않게, 장마다 대본을 Yjs 문서(글자 단위로 합쳐지는 자료형)로 두고
// 고친 내용(변경분)만 차곡차곡 쌓는다. 쌓인 변경분은 지우거나 덮어쓰지 않는다 — 누가 언제 무엇을 고쳤든 전부 남는다.
//   실제 사이트(GitHub Pages): 발표 대본 전용 Firebase(없으면 앱과 같은 Firebase) — 익명 로그인 + Firestore deckEdits 컬렉션, 문서 하나 = 변경분 하나
//   내 컴퓨터(localhost·파일): 이 브라우저의 localStorage + 같은 브라우저의 다른 탭과 BroadcastChannel
// 변경분 모양: {slide(장 이름), u(Yjs 변경분 base64), by(고친 사람 이름), at(ISO 시각)}

const SDK = 'https://www.gstatic.com/firebasejs/11.0.2/';
const YJS = 'https://cdn.jsdelivr.net/npm/yjs@13.6.20/+esm';
const LOG = 'knutips-notes-log', PENDING = 'knutips-notes-pending';
const read = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const b64 = u => { let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
// 원래 대본(기본 글)을 넣는 첫 변경분은 누가 만들어도 똑같아야 두 번 들어가지 않는다 → 글 내용으로 만든 고정 번호를 쓴다
const seedId = t => { let h = 2166136261; for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619); return (h >>> 0) || 1; };

function loadScript(src) {
  return new Promise(resolve => { const s = document.createElement('script'); s.src = src; s.onload = s.onerror = resolve; document.head.append(s); });
}

// ---- 변경분을 주고받는 통로 두 가지: {kind, subscribe(onAdd, onErr), append(entry)} ----
async function firebaseLog() {
  if (!/^https?:$/.test(location.protocol) || /^(localhost|127\.)/.test(location.hostname)) return null;
  // 발표 대본 전용 프로젝트(deck-firebase-config.js)가 있으면 그것, 없으면 앱과 같은 프로젝트
  if (window.KNUT_DECK_FIREBASE === undefined) await loadScript('deck-firebase-config.js');
  if (!window.KNUT_DECK_FIREBASE && window.KNUT_FIREBASE === undefined) await loadScript('../firebase-config.js');
  const config = window.KNUT_DECK_FIREBASE || window.KNUT_FIREBASE;
  if (!config?.apiKey || !config?.projectId) return null;
  const [{ initializeApp }, auth, fs] = await Promise.all([import(SDK + 'firebase-app.js'), import(SDK + 'firebase-auth.js'), import(SDK + 'firebase-firestore.js')]);
  const app = initializeApp(config, 'knutips-deck');
  const a = auth.getAuth(app);
  if (!a.currentUser) await auth.signInAnonymously(a);
  const db = fs.getFirestore(app), col = fs.collection(db, 'deckEdits');
  return {
    kind: 'firebase',
    subscribe(onAdd, onErr) {
      return fs.onSnapshot(col, snap => onAdd(snap.docChanges().filter(c => c.type === 'added').map(c => c.doc.data())), onErr);
    },
    append: e => fs.addDoc(col, e),
  };
}

function localLog() {
  // 변경분마다 localStorage 키를 따로 둔다(두 탭이 동시에 저장해도 서로 덮어쓰지 않게)
  const ch = 'BroadcastChannel' in window ? new BroadcastChannel('knutips-notes') : null;
  const all = () => { const out = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith(LOG + ':')) out.push(read(k)); } } catch {} return out.filter(Boolean); };
  return {
    kind: 'local',
    subscribe(onAdd) {
      setTimeout(() => onAdd(all()), 0);
      if (ch) ch.onmessage = ({ data }) => data && onAdd([data]);
    },
    async append(e) { write(`${LOG}:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`, e); ch?.postMessage(e); },
  };
}

// ---- 장마다 Yjs 문서 하나 ----
async function makeStore(log, Y) {
  const docs = new Map(), meta = {}, touched = new Set(), queue = {}, subs = new Set(), stateSubs = new Set();
  let ready = false, flushTimer = null, failed = false;
  const pending = read(PENDING) || {};          // 아직 못 보낸 변경분(창을 닫아도 다음에 다시 보낸다)

  const setState = s => stateSubs.forEach(f => f(s));
  const snapshot = () => {
    const m = {};
    for (const [k, d] of docs) if (touched.has(k)) m[k] = { text: d.getText('t').toString(), by: meta[k]?.by || '', at: meta[k]?.at || '' };
    return m;
  };
  let notifyQueued = false;
  const notify = () => { if (notifyQueued) return; notifyQueued = true; queueMicrotask(() => { notifyQueued = false; const m = snapshot(); subs.forEach(f => f(m)); }); };

  function docFor(k) {
    let d = docs.get(k);
    if (d) return d;
    d = new Y.Doc();
    d.on('update', (u, origin) => {
      if (origin !== 'remote') { (queue[k] ||= []).push(u); schedule(); }
      touched.add(k);
      notify();
    });
    docs.set(k, d);
    return d;
  }

  function schedule() { clearTimeout(flushTimer); flushTimer = setTimeout(flush, 400); }
  async function flush() {
    const by = myName(), at = new Date().toISOString();
    for (const k of Object.keys(queue)) {
      if (!queue[k].length) continue;
      const u = b64(Y.mergeUpdates(queue[k]));
      queue[k] = [];
      (pending[k] ||= []).push(u); write(PENDING, pending);
      meta[k] = { by, at };
    }
    setState('saving');
    let ok = true;
    for (const k of Object.keys(pending)) {
      while (pending[k]?.length) {
        try { await log.append({ slide: k, u: pending[k][0], by, at }); pending[k].shift(); write(PENDING, pending); }
        catch (e) { ok = false; failed = /permission|insufficient/i.test(String(e?.code || e?.message)) ? 'denied' : 'offline'; break; }
      }
      if (!pending[k]?.length) delete pending[k];
    }
    write(PENDING, pending);
    if (ok) { failed = false; setState(log.kind === 'local' ? 'saved-local' : 'saved'); }
    else { setState(failed); flushTimer = setTimeout(flush, 8000); }   // 못 보낸 것은 잠시 뒤 다시
    notify();
  }
  addEventListener('pagehide', () => { if (Object.values(queue).some(q => q.length)) flush(); });

  function apply(entries) {
    for (const e of entries) {
      if (!e?.slide || !e.u) continue;
      try { Y.applyUpdate(docFor(e.slide), unb64(e.u), 'remote'); } catch { continue; }
      if (!meta[e.slide]?.at || (e.at || '') >= meta[e.slide].at) meta[e.slide] = { by: e.by || '', at: e.at || '' };
    }
    notify();
  }

  const whenReady = new Promise((resolve, reject) => {
    log.subscribe(entries => {
      apply(entries);
      if (!ready) {
        ready = true;
        // 지난번에 못 보낸 변경분: 내 화면에도 반영하고 다시 보낸다(같은 변경분은 두 번 들어가지 않는다)
        for (const k of Object.keys(pending)) for (const u of pending[k]) Y.applyUpdate(docFor(k), unb64(u), 'remote');
        if (Object.keys(pending).length) flush();
        resolve();
      }
    }, e => { setState(/permission|insufficient/i.test(String(e?.code || e?.message)) ? 'denied' : 'offline'); reject(e); });
  });

  const has = k => touched.has(k);
  return {
    kind: log.kind,
    ready: whenReady,
    watch(cb, err) { subs.add(cb); whenReady.then(() => cb(snapshot()), err); return () => subs.delete(cb); },
    onState(cb) { stateSubs.add(cb); return () => stateSubs.delete(cb); },
    has,
    text: k => docs.get(k)?.getText('t').toString(),
    // 대본을 next 로 바꾼다. 처음 고치는 장이면 원래 대본(base)부터 깔고, 바뀐 부분만 글자 단위로 넣고 뺀다
    edit(k, base, next) {
      if (!ready) return;
      const d = docFor(k), t = d.getText('t');
      if (!has(k) && t.length === 0 && base) {
        const sd = new Y.Doc(); sd.clientID = seedId(base); sd.getText('t').insert(0, base);
        Y.applyUpdate(d, Y.encodeStateAsUpdate(sd), 'seed');
      }
      const cur = t.toString();
      if (cur === next) return;
      let a = 0; while (a < cur.length && a < next.length && cur[a] === next[a]) a++;
      let b = 0; while (b < cur.length - a && b < next.length - a && cur[cur.length - 1 - b] === next[next.length - 1 - b]) b++;
      d.transact(() => {
        if (cur.length - a - b) t.delete(a, cur.length - a - b);
        if (next.length - a - b) t.insert(a, next.slice(a, next.length - b));
      }, 'local');
    },
  };
}

let ready = null;
export function notesStore() {
  if (!ready) ready = (async () => {
    let Y;
    try { Y = await import(YJS); } catch (e) { console.warn('대본 동기화 도구(Yjs)를 불러오지 못했어요:', e?.message); return null; }
    let log = null;
    try { log = await firebaseLog(); } catch (e) { console.warn('공유 대본 저장소에 연결하지 못했어요:', e?.message); }
    return makeStore(log || localLog(), Y);
  })();
  return ready;
}

// 텍스트 칸을 남이 바꾼 글로 갈아 끼울 때, 내 커서가 같은 글자 옆에 남도록 위치를 옮겨 준다
export function shiftCaret(oldText, newText, pos) {
  let a = 0; while (a < oldText.length && a < newText.length && oldText[a] === newText[a]) a++;
  let b = 0; while (b < oldText.length - a && b < newText.length - a && oldText[oldText.length - 1 - b] === newText[newText.length - 1 - b]) b++;
  if (pos <= a) return pos;
  if (pos >= oldText.length - b) return pos + (newText.length - oldText.length);
  return newText.length - b;
}

// 다른 곳(카톡·문서)에서 붙여 넣은 글 정리: 줄바꿈 통일, 보이지 않는 글자 제거, 빈 줄 2개까지, 앞의 [이름 · 초] 꼬리표 제거
export const tidy = t => String(t ?? '').replace(/\r\n?/g, '\n').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\u00A0/g, ' ')
  .replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').replace(/^\s*\[[^\]\n]{1,30}·[^\]\n]{1,20}\]\s*/, '').trim();

// 고친 사람 이름(실제 사이트에는 계정이 없어서 이 브라우저에 한 번 골라 둔다)
const WHO = 'knutips-notes-who';
export const myName = () => { try { return localStorage.getItem(WHO) || ''; } catch { return ''; } };
export const setMyName = n => { try { localStorage.setItem(WHO, n); } catch {} };
