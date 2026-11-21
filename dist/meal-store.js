// 혼밥 친구 매칭의 공용 저장소 (Firebase 익명 로그인 + Firestore)
// firebase-config.js 에 window.KNUT_FIREBASE 가 있으면 실제 학우끼리 매칭하고, 없으면 null 을 돌려줘서 데모로 동작해요.
// Firestore 구조 (보안 규칙: firestore.rules)
//   mealProfiles/{uid}            내 밥친구 카드: nick, dept, year, days, times, foods, areas, mood, pay, intro, visible, updatedAt
//   mealRequests/{id}             같이 먹자 신청: from, to, users[from,to], fromNick, toNick, place, status(pending·accepted·declined), createdAt
//   mealRequests/{id}/messages/*  수락한 두 사람의 채팅: uid, nick, text, at

const SDK = 'https://www.gstatic.com/firebasejs/11.0.2/';
const FRESH_DAYS = 30;
let ready = null;

function loadConfig() {
  if (window.KNUT_FIREBASE !== undefined) return Promise.resolve();
  return new Promise(resolve => {
    const script = document.createElement('script');
    script.src = 'firebase-config.js';
    script.onload = script.onerror = resolve;
    document.head.append(script);
  });
}

export function mealStore() {
  if (!ready) ready = connect().catch(error => { console.warn('혼밥 매칭 저장소에 연결하지 못했어요:', error.message); return null; });
  return ready;
}

async function connect() {
  await loadConfig();
  const config = window.KNUT_FIREBASE;
  if (!config?.apiKey || !config?.projectId) return null;
  const [{initializeApp}, auth, fs] = await Promise.all([
    import(SDK + 'firebase-app.js'), import(SDK + 'firebase-auth.js'), import(SDK + 'firebase-firestore.js'),
  ]);
  const app = initializeApp(config);
  const authApi = auth.getAuth(app);
  const {user} = authApi.currentUser ? {user:authApi.currentUser} : await auth.signInAnonymously(authApi);
  const uid = user.uid;
  const db = fs.getFirestore(app);
  const {doc, collection, setDoc, getDoc, getDocs, addDoc, updateDoc, query, where, limit, onSnapshot, serverTimestamp} = fs;
  const time = value => value?.toMillis?.() ?? 0;

  return {
    uid,
    async myProfile() {
      const snap = await getDoc(doc(db, 'mealProfiles', uid));
      return snap.exists() ? snap.data() : null;
    },
    saveProfile(p) {
      return setDoc(doc(db, 'mealProfiles', uid), {
        nick:p.nick, dept:p.dept, year:p.year, days:p.days, times:p.times, foods:p.foods, areas:p.areas,
        mood:p.mood, pay:p.pay, intro:p.intro, visible:!!p.visible, updatedAt:serverTimestamp(),
      });
    },
    // 최근 30일 안에 카드를 올린 다른 학우들
    async listProfiles() {
      const snap = await getDocs(query(collection(db, 'mealProfiles'), where('visible', '==', true), limit(200)));
      const since = Date.now() - FRESH_DAYS * 864e5;
      return snap.docs.filter(d => d.id !== uid && time(d.data().updatedAt) > since).map(d => ({id:d.id, ...d.data()}));
    },
    sendRequest(to, {myNick, toNick, place}) {
      return addDoc(collection(db, 'mealRequests'), {
        from:uid, to, users:[uid, to], fromNick:myNick, toNick, place:place ?? null, status:'pending', createdAt:serverTimestamp(),
      });
    },
    respond(id, status) { return updateDoc(doc(db, 'mealRequests', id), {status}); },
    // 내가 보낸·받은 신청을 실시간으로 받아요 (최신 순)
    watchRequests(callback) {
      return onSnapshot(query(collection(db, 'mealRequests'), where('users', 'array-contains', uid)), snap => {
        callback(snap.docs.map(d => ({id:d.id, ...d.data(), at:time(d.data().createdAt) || Date.now()})).sort((a, b) => b.at - a.at));
      }, error => console.warn('밥 신청함을 불러오지 못했어요:', error.message));
    },
    sendMessage(roomId, nick, text) {
      return addDoc(collection(db, 'mealRequests', roomId, 'messages'), {uid, nick, text, at:serverTimestamp()});
    },
    watchMessages(roomId, callback, onError) {
      return onSnapshot(collection(db, 'mealRequests', roomId, 'messages'), snap => {
        callback(snap.docs.map(d => ({id:d.id, ...d.data(), at:time(d.data().at) || Date.now()})).sort((a, b) => a.at - b.at));
      }, onError);
    },
    async room(roomId) {
      const snap = await getDoc(doc(db, 'mealRequests', roomId));
      return snap.exists() ? {id:snap.id, ...snap.data()} : null;
    },
  };
}
