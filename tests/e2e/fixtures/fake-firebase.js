// 테스트용 가짜 Firebase SDK (firebase-app·auth·firestore 세 모듈 모두 이 파일로 대신한다)
// 진짜 서버 없이 브라우저 메모리에서 문서를 저장하고 onSnapshot 을 알려 준다.
// 처음 데이터는 window.__FAKE_FB = { uid, docs: { 'mealProfiles/u2': {...}, ... } } 로 넣는다 (updatedAt·createdAt 은 숫자 ms).
const state = window.__FAKE_FB_STATE ??= (() => {
  const seed = window.__FAKE_FB ?? {};
  const docs = new Map();
  const stamp = value => typeof value === 'number' ? { toMillis: () => value } : value;
  for (const [path, data] of Object.entries(seed.docs ?? {})) {
    docs.set(path, Object.fromEntries(Object.entries(data).map(([k, v]) => [k, /At$/.test(k) ? stamp(v) : v])));
  }
  return { uid: seed.uid ?? 'me', docs, listeners: new Set(), seq: 0 };
})();

const SERVER_TIME = Symbol('serverTimestamp');
const resolve = data => Object.fromEntries(Object.entries(data).map(([k, v]) => {
  if (v === SERVER_TIME) { const now = Date.now(); return [k, { toMillis: () => now }]; }
  return [k, v];
}));
const notify = () => queueMicrotask(() => state.listeners.forEach(fn => fn()));
const snapDoc = (path, data) => ({ id: path.split('/').pop(), exists: () => !!data, data: () => data });

// firebase-app
export const initializeApp = config => ({ config });
// firebase-auth
export const getAuth = () => ({ currentUser: null });
export const signInAnonymously = async () => ({ user: { uid: state.uid } });
// firebase-firestore
export const getFirestore = () => ({});
export const serverTimestamp = () => SERVER_TIME;
export const doc = (db, ...parts) => ({ path: parts.join('/') });
export const collection = (db, ...parts) => ({ path: parts.join('/'), filters: [] });
export const where = (field, op, value) => ({ field, op, value });
export const limit = () => null;
export const query = (col, ...constraints) => ({ path: col.path, filters: constraints.filter(Boolean) });

function list(q) {
  const depth = q.path.split('/').length + 1;
  return [...state.docs].filter(([path, data]) => path.startsWith(q.path + '/') && path.split('/').length === depth
    && q.filters.every(f => f.op === '==' ? data[f.field] === f.value : f.op === 'array-contains' ? (data[f.field] ?? []).includes(f.value) : true))
    .map(([path, data]) => snapDoc(path, data));
}

export const getDoc = async ref => snapDoc(ref.path, state.docs.get(ref.path));
export const getDocs = async q => ({ docs: list(q) });
export const setDoc = async (ref, data) => { state.docs.set(ref.path, resolve(data)); notify(); };
export const updateDoc = async (ref, data) => { state.docs.set(ref.path, { ...state.docs.get(ref.path), ...resolve(data) }); notify(); };
export const addDoc = async (col, data) => {
  const path = `${col.path}/auto${++state.seq}`;
  state.docs.set(path, resolve(data));
  notify();
  return { id: path.split('/').pop() };
};
export function onSnapshot(q, next) {
  const fire = () => next({ docs: list({ path: q.path, filters: q.filters ?? [] }) });
  state.listeners.add(fire);
  queueMicrotask(fire);
  return () => state.listeners.delete(fire);
}
