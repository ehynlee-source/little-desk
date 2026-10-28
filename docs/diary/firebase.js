import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';
import { initializeAuth, browserSessionPersistence, browserPopupRedirectResolver, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';
import { initializeFirestore, memoryLocalCache, collection, doc, getDocsFromServer, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, { persistence: browserSessionPersistence, popupRedirectResolver: browserPopupRedirectResolver });
// Memory only: diary content must not remain in IndexedDB on shared computers.
const db = initializeFirestore(app, { localCache: memoryLocalCache() }, 'default');
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });
let user = null;
let unsubscribe = () => {};
export const errorMessage = error => ({
  'auth/popup-blocked': '브라우저에서 로그인 팝업을 허용해 주세요.',
  'auth/popup-closed-by-user': '로그인 창을 닫았습니다. 다시 로그인할 수 있어요.',
  'auth/unauthorized-domain': '현재 사이트가 로그인 허용 도메인에 등록되어 있지 않습니다.',
  'auth/network-request-failed': '네트워크 연결을 확인해 주세요.',
  'permission-denied': '접근 권한이 없습니다. 로그인 상태를 확인해 주세요.',
  'unavailable': '서버에 연결할 수 없습니다. 인터넷 연결 후 다시 시도해 주세요.'
}[error.code] || '요청을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.');
export function currentUser() { return user; }
function requireUser() { if (!user) throw new Error('먼저 Google 계정으로 로그인해 주세요.'); return user; }
function entriesRef(uid) { return collection(db, 'users', uid, 'entries'); }
function normalize(snapshot) {
  return snapshot.docs.map(d => {
    const e = d.data();
    return { ...e, id: d.id, date: e.date.toDate().toISOString().slice(0,10), created_at: e.createdAt?.toDate().toISOString() || '', updated_at: e.updatedAt?.toDate().toISOString() || '' };
  }).sort((a,b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id));
}
export function observeSession(onSession, onEntries, onError) {
  return onAuthStateChanged(auth, next => {
    unsubscribe(); user = next;
    onEntries([]); onSession(user);
    if (!user) return;
    const uid = user.uid;
    // Realtime is required so multiple signed-in devices see edits and deletions.
    unsubscribe = onSnapshot(entriesRef(uid), snapshot => {
      if (user?.uid === uid) onEntries(normalize(snapshot));
    }, error => { if (user?.uid === uid) { onEntries([]); onError(error); } });
  }, onError);
}
export async function login() { return signInWithPopup(auth, provider); }
export async function logout() { return signOut(auth); }
export async function api(url, options = {}) {
  const uid = requireUser().uid;
  const method = options.method || 'GET';
  if (method === 'GET') {
    const snapshot = await getDocsFromServer(entriesRef(uid));
    if (user?.uid !== uid) throw new Error('로그인 계정이 변경되었습니다.');
    return normalize(snapshot);
  }
  const id = url.split('/')[3];
  if (id && !/^[A-Za-z0-9]{20}$/.test(id)) throw new Error('올바르지 않은 기록 ID입니다.');
  if (method === 'DELETE' && id) return deleteDoc(doc(db, 'users', uid, 'entries', id));
  const e = JSON.parse(options.body);
  const parsed = new Date(`${e.date}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10) !== e.date || e.date < '1900-01-01' || e.date >= '2200-01-01') throw new Error('1900~2199년의 올바른 날짜를 선택해 주세요.');
  if (typeof e.title !== 'string' || !e.title.trim() || e.title.length > 100) throw new Error('제목은 1~100자로 입력해 주세요.');
  if (typeof e.content !== 'string' || !e.content.trim() || e.content.length > 30000) throw new Error('내용은 1~30,000자로 입력해 주세요.');
  if (!['happy','calm','normal','sad','tired'].includes(e.mood)) throw new Error('기분을 선택해 주세요.');
  const data = { title: e.title.trim(), content: e.content.trim(), mood: e.mood, date: Timestamp.fromDate(parsed), updatedAt: serverTimestamp() };
  if (method === 'POST') return addDoc(entriesRef(uid), { ...data, createdAt: serverTimestamp() });
  if (method === 'PUT' && id) return updateDoc(doc(db, 'users', uid, 'entries', id), data);
  throw new Error('지원하지 않는 요청입니다.');
}
