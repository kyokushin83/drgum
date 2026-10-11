import './data-store.js?v=20261011-1';
import { app, adminEmails, travelPassEnabled } from './firebase-config.js?v=20261012-1';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, setPersistence, browserSessionPersistence } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import { getFirestore, collection, doc, getDoc, getDocs, query, orderBy, runTransaction, serverTimestamp, Timestamp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

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
function requireAdmin() {
  if (!travelPassEnabled) throw new Error('Firebase 설정을 확인해 주세요.');
  if (!isAdmin(auth.currentUser)) throw new Error('관리자 Google 계정으로 로그인해 주세요.');
}
function reference(id) {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(id || '')) throw new Error('고객 주소를 확인해 주세요.');
  return doc(customers, id);
}
function linkRef(id) { reference(id); return doc(db, 'travelShareLinks', id); }
function shareRef(token) {
  if (!/^[a-f0-9]{64}$/.test(token || '')) throw new Error('고객 링크를 확인해 주세요.');
  return doc(db, 'travelShares', token);
}
function newToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2,'0')).join('');
}
export function createBlank() {
  return model.normalize({id:crypto.randomUUID(),guardianName:'',petName:'',country:'',departureDate:'',nextVisitDate:'',nextAction:'',currentStepId:steps[0].id,completedStepIds:[],memo:'',customerUid:'',shareEnabled:true});
}
export async function list() {
  requireAdmin();
  const snapshot = await getDocs(query(customers, orderBy('updatedAt','desc')));
  return snapshot.docs.map(d => ({...d.data(),id:d.id}));
}
export async function get(id) {
  requireAdmin();
  const snapshot = await getDoc(reference(id));
  if (!snapshot.exists()) return null;
  const customer = {...snapshot.data(),id:snapshot.id};
  try {
    const link = await getDoc(linkRef(id));
    return {...customer,shareToken:link.exists() ? link.data().token : '',shareEnabled:link.exists() ? link.data().enabled : true};
  } catch(error) {
    return {...customer,shareToken:'',shareEnabled:true,shareError:true};
  }
}
export async function getShared(token) {
  const snapshot = await getDoc(shareRef(token));
  return snapshot.exists() ? snapshot.data() : null;
}
async function publishShare(customer, enabled) {
  requireAdmin();
  const candidate = newToken();
  const projectionKeys = ['petName','country','departureDate','nextVisitDate','nextAction','currentStepId','completedStepIds','steps','memo'];
  let token;
  await runTransaction(db, async tx => {
    const privateRef = reference(customer.id);
    const mappingRef = linkRef(customer.id);
    // Read current persisted data rather than a stale editor snapshot.
    const privateSnapshot = await tx.get(privateRef);
    const mapping = await tx.get(mappingRef);
    if (!privateSnapshot.exists()) throw new Error('고객이 삭제되어 링크를 생성할 수 없습니다.');
    token = mapping.exists() ? mapping.data().token : candidate;
    const publicRef = shareRef(token);
    if (enabled) {
      const data = privateSnapshot.data();
      const projection = Object.fromEntries(projectionKeys.map(k => [k,data[k]]));
      tx.set(publicRef, {...projection,active:true,expiresAt:Timestamp.fromMillis(Date.now()+180*86400000),updatedAt:serverTimestamp()});
    } else {
      tx.delete(publicRef);
    }
    tx.set(mappingRef, {token,enabled,updatedAt:serverTimestamp()});
  });
  return token;
}
export async function save(customer, createOnly = false) {
  requireAdmin();
  const user = auth.currentUser;
  const next = model.normalize(customer);
  const fields = ['guardianName','petName','country','departureDate','nextVisitDate','nextAction','currentStepId','memo','customerUid'];
  const data = Object.fromEntries(fields.map(k => [k,String(next[k] || '').trim()]));
  data.customerUid = ''; // Private records are administrator-only; customers use a separate projection.
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
  const saved = {...data,id:next.id,shareEnabled:customer.shareEnabled !== false};
  try {
    return {...saved,shareToken:await publishShare(saved, saved.shareEnabled)};
  } catch(error) {
    return {...saved,shareToken:'',shareError:true};
  }
}
export async function remove(id) {
  requireAdmin();
  await runTransaction(db, async tx => {
    const mapping = await tx.get(linkRef(id));
    if (mapping.exists()) tx.delete(shareRef(mapping.data().token));
    tx.delete(linkRef(id));
    tx.delete(reference(id));
  });
}
export async function importLegacy() {
  requireAdmin();
  const value = JSON.parse(localStorage.getItem('drQuarantine.travelPass.customers.v1') || '[]');
  if (!Array.isArray(value)) throw new Error('기존 고객 데이터 형식이 올바르지 않습니다.');
  let imported = 0;
  for (const customer of value) {
    if (customer.id === 'A7K29X' && customer.guardianName === '김하늘' && customer.petName === '몽이') continue;
    if (await get(customer.id)) continue;
    await save({...customer,customerUid:'',shareEnabled:true}, true);
    imported++;
  }
  return imported;
}