import { app } from './firebase-config.js?v=20261012-1';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
const db = getFirestore(app);
export async function getShared(token) {
  if (!/^[a-f0-9]{64}$/.test(token || '')) throw new Error('고객 링크를 확인해 주세요.');
  const snapshot = await getDoc(doc(db, 'travelShares', token));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  if (!data.active || !data.expiresAt?.toMillis || data.expiresAt.toMillis() <= Date.now()) return null;
  return data;
}