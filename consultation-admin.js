import { app } from "./firebase-config.js?v=20261012-1";
import { login as adminLogin, logout as adminLogout } from "./firebase-store.js?v=20261012-7";
import{getFirestore,collection,query,orderBy,onSnapshot,updateDoc,doc}from"https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import{getAuth,onAuthStateChanged,signOut}from"https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
const db=getFirestore(app),auth=getAuth(app),allow=["kyokushin83@naver.com","vetjin79@gmail.com","dion5280@naver.com"];
const esc=v=>String(v??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]));
document.head.insertAdjacentHTML("beforeend",`<style>#consult-admin{margin:20px auto;max-width:1100px;padding:20px;border:1px solid #dbe3f0;border-radius:16px;background:#fff;font-family:Arial,sans-serif}#consult-admin h2{margin:0;color:#0b1f4a}.consult-head{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}.consult-btn{width:auto;height:auto;margin:0;padding:10px 14px;border:0;border-radius:9px;background:#2563eb;color:#fff;font-weight:700;cursor:pointer}#consult-list{overflow-x:auto}.consult-table{width:100%;border-collapse:collapse;margin-top:15px;font-size:13px}.consult-table th,.consult-table td{padding:10px;border-bottom:1px solid #e5e7eb;text-align:left}.consult-table th{color:#64748b}.done{background:#15803d}.empty{padding:24px 0;color:#64748b}@media(max-width:650px){.consult-table{font-size:11px}.consult-table th,.consult-table td{padding:7px 4px}}</style>`);
document.head.insertAdjacentHTML("beforeend",`<style>
#consult-admin .consult-btn{white-space:nowrap;word-break:keep-all;line-height:1.3;min-height:40px}
@media(max-width:650px){
 #consult-admin{margin:12px 8px;padding:14px 12px;border-radius:14px}
 #consult-admin .consult-head{flex-wrap:nowrap;align-items:center}
 #consult-admin h2{font-size:22px}
 #consult-status{display:block;max-width:240px;overflow-wrap:anywhere;font-size:11px;line-height:1.4;margin-top:4px}
 #consult-admin #consult-logout,#consult-admin #consult-login{font-size:12px;padding:8px 10px}
 #consult-list{overflow:visible}
 #consult-admin .consult-table{display:block;margin-top:12px;font-size:13px}
 #consult-admin .consult-table thead{display:none}
 #consult-admin .consult-table tbody{display:grid;gap:8px}
 #consult-admin .consult-table tr{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:5px 12px;padding:10px 12px;border:1px solid #e2e8f0;border-radius:12px;background:#f8faff;align-items:center}
 #consult-admin .consult-table td{display:block;padding:0;border:0;min-width:0;line-height:1.4;word-break:keep-all;overflow-wrap:anywhere}
 #consult-admin .consult-table td:nth-child(1){grid-column:1/-1;grid-row:4;font-size:10px;color:#64748b}
 #consult-admin .consult-table td:nth-child(1)::before{content:'접수 ';color:#94a3b8}
 #consult-admin .consult-table td:nth-child(2){grid-column:1;grid-row:1;font-size:16px;font-weight:800;white-space:nowrap}
 #consult-admin .consult-table td:nth-child(2) a{color:#0b1f4a;text-decoration:none}
 #consult-admin .consult-table td:nth-child(3){grid-column:1;grid-row:3;font-size:12px;color:#475569}
 #consult-admin .consult-table td:nth-child(3)::before{content:'거주 ';color:#64748b}
 #consult-admin .consult-table td:nth-child(4){grid-column:1/-1;grid-row:2;font-size:12px;color:#334155}
 #consult-admin .consult-table td:nth-child(4) br{display:none}
 #consult-admin .consult-table td:nth-child(4) br::after{content:' · '}
 #consult-admin .consult-table td:nth-child(5){grid-column:2;grid-row:3;text-align:right;font-size:13px;font-weight:700;color:#0b1f4a;white-space:nowrap}
 #consult-admin .consult-table td:nth-child(6){grid-column:2;grid-row:1;text-align:right}
 #consult-admin .consult-table td:nth-child(6) .consult-btn{font-size:12px;padding:8px 12px;min-height:36px;border-radius:8px}
}
</style>`);
document.body.insertAdjacentHTML("afterbegin",`<section id="consult-admin"><div class="consult-head"><div><h2>상담요청</h2><small id="consult-status">관리자 로그인이 필요합니다.</small></div><div><button class="consult-btn" id="consult-login">Google 로그인</button><button class="consult-btn" id="consult-logout" hidden>로그아웃</button></div></div><div id="consult-list" class="empty">로그인 후 상담 요청을 확인할 수 있습니다.</div></section>`);
const status=document.querySelector("#consult-status"),list=document.querySelector("#consult-list"),login=document.querySelector("#consult-login"),logout=document.querySelector("#consult-logout");
login.onclick=()=>adminLogin().catch(e=>alert("로그인에 실패했습니다. 허용된 Google 계정으로 다시 시도해주세요."));logout.onclick=()=>adminLogout();
let unsubscribe;

onAuthStateChanged(auth,u=>{if(unsubscribe){unsubscribe();unsubscribe=null;}if(!u){status.textContent="관리자 로그인이 필요합니다.";login.hidden=false;logout.hidden=true;list.className="empty";list.textContent="로그인 후 상담 요청을 확인할 수 있습니다.";return}if(!u.emailVerified||!allow.includes(u.email)||!u.providerData.some(p=>p.providerId==="google.com")){alert("권한이 없는 계정입니다.");signOut(auth);return}status.textContent=u.email+" · 상담 요청 목록";login.hidden=true;logout.hidden=false;unsubscribe=onSnapshot(query(collection(db,"consultations"),orderBy("createdAt","desc")),s=>{if(s.empty){list.className="empty";list.textContent="아직 상담 요청이 없습니다.";return}list.className="";list.innerHTML=`<table class="consult-table"><thead><tr><th>접수</th><th>전화번호</th><th>거주지역</th><th>출국 정보</th><th>예상금액</th><th>상태</th></tr></thead><tbody>`+s.docs.map(x=>{const d=x.data(),t=d.createdAt?.toDate?.().toLocaleString("ko-KR")||"방금 접수";return `<tr><td>${t}</td><td><a href="tel:${esc(d.phone)}">${esc(d.phone)}</a></td><td>${esc(d.region || "미입력")}</td><td>${esc(d.pet)} · ${esc(d.country)}<br> ${esc(d.departureDate)}</td><td>${esc(d.total)}</td><td><button class="consult-btn ${d.called?"done":""}" data-id="${x.id}" data-called="${!!d.called}">${d.called?"통화완료":"미연락"}</button></td></tr>`}).join("")+"</tbody></table>";list.querySelectorAll("button[data-id]").forEach(b=>{b.onclick=()=>updateDoc(doc(db,"consultations",b.dataset.id),{called:b.dataset.called!=="true",status:b.dataset.called==="true"?"미연락":"통화완료"}).catch(()=>alert("상담 상태 저장에 실패했습니다."));});},()=>{list.textContent="상담 요청 조회 권한 또는 연결을 확인해 주세요.";});});
