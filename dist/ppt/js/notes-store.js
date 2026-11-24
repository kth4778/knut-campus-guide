// 팀 공유 대본 저장소. 발표 화면의 「대본」 패널과 발표자 창이 같이 쓴다.
//   실제 사이트(GitHub Pages): 앱과 같은 Firebase(익명 로그인 + Firestore)의 deckNotes/{장 이름} 문서
//   claude.ai 링크: 그 페이지의 공유 저장소(db)
//   둘 다 없으면(내 컴퓨터에서 열 때): 이 브라우저(localStorage)에만
// 문서 모양: {text, by(이름), at(ISO 시각)}

const SDK = 'https://www.gstatic.com/firebasejs/11.0.2/';
const LOCAL = 'knutips-notes';
const readLocal = () => { try { return JSON.parse(localStorage.getItem(LOCAL) || '{}'); } catch { return {}; } };
const writeLocal = v => { try { localStorage.setItem(LOCAL, JSON.stringify(v)); } catch {} };

function loadScript(src) {
  return new Promise(resolve => { const s = document.createElement('script'); s.src = src; s.onload = s.onerror = resolve; document.head.append(s); });
}

async function firebaseStore() {
  if (!/^https?:$/.test(location.protocol) || /^(localhost|127\.)/.test(location.hostname)) return null;
  if (window.KNUT_FIREBASE === undefined) await loadScript('../firebase-config.js');
  const config = window.KNUT_FIREBASE;
  if (!config?.apiKey || !config?.projectId) return null;
  const [{ initializeApp }, auth, fs] = await Promise.all([import(SDK + 'firebase-app.js'), import(SDK + 'firebase-auth.js'), import(SDK + 'firebase-firestore.js')]);
  const app = initializeApp(config, 'knutips-deck');
  const a = auth.getAuth(app);
  if (!a.currentUser) await auth.signInAnonymously(a);
  const db = fs.getFirestore(app), col = fs.collection(db, 'deckNotes');
  return {
    kind: 'firebase',
    watch(cb, err) { return fs.onSnapshot(col, snap => { const m = {}; snap.forEach(d => { m[d.id] = d.data(); }); cb(m); }, err); },
    save: (k, text, by) => fs.setDoc(fs.doc(db, 'deckNotes', k), { text, by: by || '', at: new Date().toISOString() }),
    remove: k => fs.deleteDoc(fs.doc(db, 'deckNotes', k)),
  };
}

async function artifactStore() {
  if (typeof window.claude?.use !== 'function') return null;
  const [db, user] = await Promise.all([claude.use('db'), claude.use('user')]);
  if (!db) return null;
  let me = '';
  try { me = (await user?.id?.()) || ''; } catch {}
  return {
    kind: 'artifact', user,
    watch(cb, err) { return db.collection('notes').onSnapshot(snap => { const m = {}; snap.docs.forEach(d => { if (d.exists) m[d.id] = d.data(); }); cb(m); }, err); },
    save: (k, text) => db.doc('notes/' + k).set({ text, by: me, at: new Date().toISOString() }),
    remove: k => db.doc('notes/' + k).delete(),
  };
}

function localStore() {
  const subs = new Set();
  const fire = () => { const m = readLocal(); subs.forEach(f => f(m)); };
  return {
    kind: 'local',
    watch(cb) { subs.add(cb); setTimeout(() => cb(readLocal()), 0); return () => subs.delete(cb); },
    async save(k, text, by) { const m = readLocal(); m[k] = { text, by: by || '', at: new Date().toISOString() }; writeLocal(m); fire(); },
    async remove(k) { const m = readLocal(); delete m[k]; writeLocal(m); fire(); },
  };
}

let ready = null;
export function notesStore() {
  if (!ready) ready = (async () => {
    try { const s = (await artifactStore()) || (await firebaseStore()); if (s) return s; } catch (e) { console.warn('공유 대본 저장소에 연결하지 못했어요:', e?.message); }
    return localStore();
  })();
  return ready;
}

// 다른 곳(카톡·문서)에서 붙여 넣은 글 정리: 줄바꿈 통일, 보이지 않는 글자 제거, 빈 줄 2개까지, 앞의 [이름 · 초] 꼬리표 제거
export const tidy = t => String(t ?? '').replace(/\r\n?/g, '\n').replace(/[​-‍﻿]/g, '').replace(/ /g, ' ')
  .replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').replace(/^\s*\[[^\]\n]{1,30}·[^\]\n]{1,20}\]\s*/, '').trim();

// 고친 사람 이름(실제 사이트에는 계정이 없어서 이 브라우저에 한 번 골라 둔다)
const WHO = 'knutips-notes-who';
export const myName = () => { try { return localStorage.getItem(WHO) || ''; } catch { return ''; } };
export const setMyName = n => { try { localStorage.setItem(WHO, n); } catch {} };
