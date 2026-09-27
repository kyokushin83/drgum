import {initializeApp} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {getFirestore,collection,addDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
const db=getFirestore(initializeApp({apiKey:"AIzaSyBs7UxrWEREhCOwW23z5SIFALEwHEMplBo",authDomain:"dr-quarantine-consultations.firebaseapp.com",projectId:"dr-quarantine-consultations",storageBucket:"dr-quarantine-consultations.firebasestorage.app",messagingSenderId:"347267262846",appId:"1:347267262846:web:9e9fd391e6822fbec42b2f"}));
const originalShowQuote=window.showQuote;
window.showQuote=function(){
 originalShowQuote();
 const c=document.querySelector(".cta");
 if(!c||c.dataset.booking)return;c.dataset.booking="1";
 c.innerHTML='<a class="call-center" href="tel:01064957571">📞 24시간 콜센터</a><button id="booking" type="button" style="margin-top:10px;background:#0b1f4a">예약 상담 남기기</button>';
 document.getElementById("booking").onclick=async()=>{
  const phone=prompt("전화번호를 입력해주세요.\n확인 후 연락드리겠습니다.");
  if(!phone)return;
  if(!/^[0-9+() -]{9,20}$/.test(phone)){alert("전화번호를 정확히 입력해주세요.");return;}
  try{
   await addDoc(collection(db,"consultations"),{phone,country:document.getElementById("country").value,departureDate:document.getElementById("date").value,pet:document.getElementById("pet").value,registered:document.getElementById("registered").value==="yes"?"등록":"미등록",total:document.getElementById("totalPrice").textContent,firstVisit:document.getElementById("firstVisit").textContent,status:"미연락",called:false,createdAt:serverTimestamp()});
   alert("상담 요청이 접수되었습니다.");
  }catch(e){console.error(e);alert("저장에 실패했습니다. 콜센터로 연락해주세요.");}
 };
};
