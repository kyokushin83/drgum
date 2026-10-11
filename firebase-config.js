// Public Firebase web configuration; authorization is enforced by firestore.rules.
import { initializeApp, getApp, getApps } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
export const firebaseConfig = {apiKey:"AIzaSyBs7UxrWEREhCOwW23z5SIFALEwHEMplBo",authDomain:"dr-quarantine-consultations.firebaseapp.com",projectId:"dr-quarantine-consultations",storageBucket:"dr-quarantine-consultations.firebasestorage.app",messagingSenderId:"347267262846",appId:"1:347267262846:web:9e9fd391e6822fbec42b2f"};
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const adminEmails = ["kyokushin83@naver.com","vetjin79@gmail.com","dion5280@naver.com"];
// Set true ONLY after publishing and testing firestore.rules in this Firebase project.
export const travelPassEnabled = true;
