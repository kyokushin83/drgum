import {initializeApp} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {getFirestore,collection,addDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
const db=getFirestore(initializeApp({apiKey:"AIzaSyBs7UxrWEREhCOwW23z5SIFALEwHEMplBo",authDomain:"dr-quarantine-consultations.firebaseapp.com",projectId:"dr-quarantine-consultations",storageBucket:"dr-quarantine-consultations.firebasestorage.app",messagingSenderId:"347267262846",appId:"1:347267262846:web:9e9fd391e6822fbec42b2f"}));
document.head.insertAdjacentHTML("beforeend",`<style>#booking-modal{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:20px;background:rgba(11,31,74,.45)}#booking-modal .box{width:min(100%,390px);padding:24px;border-radius:18px;background:#fff;box-shadow:0 18px 50px rgba(0,0,0,.2)}#booking-modal p{margin:0 0 16px;color:#0b1f4a;font-size:17px;font-weight:800;line-height:1.5}#booking-modal input{width:100%;height:48px;padding:0 12px;border:1px solid #d7dce5;border-radius:10px;font-size:16px}#booking-modal button{width:100%;height:48px;margin-top:10px;border:0;border-radius:10px;background:#0b1f4a;color:#fff;font-weight:800;font-size:16px}</style>`);
const originalShowQuote=window.showQuote;
window.showQuote=function(){
 originalShowQuote();
 const c=document.querySelector(".cta");
 if(!c||c.dataset.booking)return;c.dataset.booking="1";
 c.innerHTML='<button id="booking" type="button" style="margin:0;background:#0b1f4a">예약 상담 남기기</button><a class="call-center" style="margin-top:10px" href="tel:01064957571">📞 24시간 콜센터</a>';
 document.getElementById("booking").onclick=()=>{
  if(document.getElementById("booking-modal"))return;
  const modal=document.createElement("div");modal.id="booking-modal";
  modal.innerHTML='<div class="box"><p>연락처를 남기시면 12시간 이내로 회신 드립니다</p><input id="booking-phone" inputmode="tel" placeholder="전화번호"><button id="booking-submit" type="button">상담 요청 보내기</button></div>';
  document.body.append(modal);
  modal.onclick=e=>{if(e.target===modal)modal.remove()};
  document.getElementById("booking-submit").onclick=async()=>{
   const phone=document.getElementById("booking-phone").value.trim();
   if(!/^[0-9+() -]{9,20}$/.test(phone)){alert("전화번호를 정확히 입력해주세요.");return;}
   try{await addDoc(collection(db,"consultations"),{phone,country:document.getElementById("country").value,departureDate:document.getElementById("date").value,pet:document.getElementById("pet").value,registered:document.getElementById("registered").value==="yes"?"등록":"미등록",total:document.getElementById("totalPrice").textContent,firstVisit:document.getElementById("firstVisit").textContent,status:"미연락",called:false,createdAt:serverTimestamp()});modal.remove();alert("상담 요청이 접수되었습니다.");}catch(e){console.error(e);alert("저장에 실패했습니다. 콜센터로 연락해주세요.");}
  };
 };
};
