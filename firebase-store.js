import './data-store.js?v=20261011-1';
import { app, adminEmails, travelPassEnabled } from './firebase-config.js?v=20261012-1';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, setPersistence, browserSessionPersistence } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import { getFirestore, collection, doc, getDoc, getDocs, query, orderBy, runTransaction, deleteDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

export const auth = getAuth(app);
const db = getFirestore(app);
const customers = collection(db, 'travelCustomers');
const model = window.TravelPassModel;
export const steps = model.steps;
export function isAdmin(user) { return !!user && user.emailVerified && adminEmails.includes(user.email) && user.providerData.some(p => p.providerId === 'google.com'); }
export async function login() {
  await setPersistence(auth, browserSessionPersistence);
  return signInWithPopup(auth, new GoogleAuthProvider());
}
export function logout() { return signOut(auth); }
export function observeAuth(callback) { return onAuthStateChanged(auth, callback); }
function requireEnabled() { if (!travelPassEnabled) throw new Error('Firebase 보안 규칙 적용 후 firebase-config.js의 travelPassEnabled를 true로 변경해 주세요.'); }
function requireAdmin() { requireEnabled(); if (!isAdmin(auth.currentUser)) throw new Error('허용된 관리자 Google 계정으로 로그인해 주세요.'); }
function reference(id) {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(id || '')) throw new Error('고객 주소를 확인해 주세요.');
  return doc(customers, id);
}
export function createBlank() {
  return model.normalize({id:crypto.randomUUID(),guardianName:'',petName:'',country:'',departureDate:'',nextVisitDate:'',nextAction:'',currentStepId:steps[0].id,completedStepIds:[],memo:'',customerUid:''});
}
export async function list() {
  requireAdmin();
  const snapshot = await getDocs(query(customers, orderBy('updatedAt','desc')));
  return snapshot.docs.map(d => ({...d.data(),id:d.id}));
}
export async function get(id) {
  requireEnabled();
  if (!auth.currentUser) throw new Error('Google 로그인이 필요합니다.');
  const snapshot = await getDoc(reference(id));
  return snapshot.exists() ? {...snapshot.data(),id:snapshot.id} : null;
}
export async function save(customer, createOnly = false) {
  requireAdmin();
  const user = auth.currentUser;
  const next = model.normalize(customer);
  const fields = ['guardianName','petName','country','departureDate','nextVisitDate','nextAction','currentStepId','memo','customerUid'];
  const data = Object.fromEntries(fields.map(k => [k,String(next[k] || '').trim()]));
  data.steps = next.steps;
  data.completedStepIds = next.completedStepIds;
  data.schemaVersion = 1;
  if (!data.guardianName || !data.petName || !data.country || !data.departureDate) throw new Error('필수 고객 정보를 입력해 주세요.');
  await runTransaction(db, async tx => {
    const ref = reference(next.id);
    const previous = await tx.get(ref);
    if (createOnly && previous.exists()) throw new Error('이미 등록된 고객 ID입니다: ' + next.id);
    tx.set(ref, {...data, createdAt:previous.exists() ? previous.data().createdAt : serverTimestamp(),
      createdBy:previous.exists() ? previous.data().createdBy : user.uid,
      updatedAt:serverTimestamp(),updatedBy:user.uid});
  });
  return {...data,id:next.id};
}
export async function remove(id) { requireAdmin(); await deleteDoc(reference(id)); }
export async function importLegacy() {
  requireAdmin();
  const value = JSON.parse(localStorage.getItem('drQuarantine.travelPass.customers.v1') || '[]');
  if (!Array.isArray(value)) throw new Error('기존 고객 데이터 형식이 올바르지 않습니다.');
  let imported = 0;
  for (const customer of value) {
    if (customer.id === 'A7K29X' && customer.guardianName === '김하늘' && customer.petName === '몽이') continue;
    // Idempotent: never overwrite a record already in Firestore. Original local data stays intact.
    if (await get(customer.id)) continue;
    await save({...customer,customerUid:''}, true);
    imported++;
  }
  return imported;
}
