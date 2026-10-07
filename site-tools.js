(()=>{
  const BLOG='https://blog.naver.com/pet-travel';
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const style=document.createElement('style');
  style.textContent='header .wrap{display:flex;align-items:center;justify-content:space-between;gap:16px}.dq-tools{display:flex;align-items:center;justify-content:flex-end;gap:8px}.intro-panel .eyebrow{display:inline-flex!important;align-items:center!important;height:34px!important;box-sizing:border-box!important;vertical-align:top!important;margin:0!important}.intro-panel .dq-tools{display:inline-flex!important;align-items:center!important;vertical-align:top!important;margin:0 0 0 8px!important;height:34px!important}.intro-panel .dq-blog,.intro-panel .dq-lang{margin:0!important;flex:0 0 56px!important}.dq-blog,.dq-lang{display:inline-flex;align-items:center;justify-content:center;width:56px;height:34px;border-radius:10px;padding:0;border:1px solid #c9d8f2;background:#fff;color:#0b1f4a;font-size:12px;font-weight:900;text-decoration:none;cursor:pointer}.dq-blog{background:#03c75a;border-color:#03c75a;color:#fff}@media(max-width:640px){header .wrap{align-items:flex-start}.dq-tools{gap:5px}.dq-blog,.dq-lang{width:50px;height:32px}.brand{font-size:14px}.brand small{font-size:9px}}';
  document.head.append(style);
  const anchor=$('.eyebrow'); if(!anchor) return;
  const tools=document.createElement('div'); tools.className='dq-tools';
  tools.innerHTML='<a class="dq-blog" href="'+BLOG+'" target="_blank" rel="noopener">블로그</a><button class="dq-lang" type="button" aria-label="언어 변경">EN</button>';
  anchor.insertAdjacentElement('afterend',tools);
  const countryEN={
    '러시아':'Russia','유럽':'Europe','미국':'United States','일본':'Japan','중국':'China','태국':'Thailand','필리핀':'Philippines','베트남':'Vietnam','싱가포르':'Singapore','말레이시아':'Malaysia','인도네시아':'Indonesia','대만':'Taiwan','홍콩':'Hong Kong','호주':'Australia','뉴질랜드':'New Zealand','캐나다':'Canada','영국':'United Kingdom','프랑스':'France','독일':'Germany','네덜란드':'Netherlands','벨기에':'Belgium','스위스':'Switzerland','이탈리아':'Italy','스페인':'Spain','포르투갈':'Portugal','덴마크':'Denmark','스웨덴':'Sweden','노르웨이':'Norway','핀란드':'Finland','아일랜드':'Ireland','아랍에미리트':'United Arab Emirates','사우디아라비아':'Saudi Arabia','카타르':'Qatar','터키':'Türkiye','기타':'Other'
  };
  const ko={blog:'블로그',eye:'반려동물 해외출국 전문',h1:'어디로 가시나요?<br>바로 준비해드릴게요.',lead:'목적지와 출국일만 입력하면 필요한 준비사항과 예상 견적을 바로 확인할 수 있습니다.',points:['수의사 직접 진행','수의사 직접 상담','해외 응급콜','빠른 출국 준비'],card:'해외출국 준비 확인',sub:'4가지만 입력해주세요.',labels:['출국 나라','동물등록(내장형) 여부','반려동물','출국 예정일'],button:'일정 및 금액 확인',call:'24시간 콜센터',address:'주소',addressText:'부산시 수영구 수영로 576 지하상가 E존 <span>(수영역에서 1분)</span>',countryLoading:'국가 불러오는 중...',countryChoose:'국가 선택',registered:'등록',unregistered:'미등록',dog:'강아지',cat:'고양이',store:'닥터검역 부산해외동물검역센터 실제 매장',interior:['닥터검역 1 · 상담실 내부','닥터검역 2 · 진료·검역 준비 공간']};
  const en={blog:'Blog',eye:'PET OVERSEAS TRAVEL SPECIALIST',h1:'Where are you going?<br>We will prepare it for you.',lead:'Enter your destination and departure date to check the required steps and estimated cost.',points:['Veterinarian-led service','Veterinarian consultation','Overseas emergency call','Fast departure preparation'],card:'Overseas Travel Check',sub:'Please enter these 4 details.',labels:['Destination','Microchip registration','Pet','Departure date'],button:'Check schedule & estimate',call:'24-hour call center',address:'Address',addressText:'E-zone underground arcade, 576 Suyeong-ro, Suyeong-gu, Busan <span>(1 min from Suyeong Station)</span>',countryLoading:'Loading countries...',countryChoose:'Select a country',registered:'Registered',unregistered:'Not registered',dog:'Dog',cat:'Cat',store:'Dr. Quarantine Pet Travel Center',interior:['Dr. Quarantine 1 · Consultation room','Dr. Quarantine 2 · Examination & preparation room']};
  let lang='ko';
  function localizeOptions(d){
    const country=$('#country'), registered=$('#registered'), pet=$('#pet'), date=$('#date');
    if(country) [...country.options].forEach(o=>{const k=o.dataset.ko||(o.dataset.ko=o.textContent.trim());if(!k)return;o.textContent=lang==='en'?(k==='국가 불러오는 중...'?d.countryLoading:k==='국가 선택'?d.countryChoose:(countryEN[k]||k)):k;});
    if(registered){registered.options[0].textContent=d.registered;registered.options[1].textContent=d.unregistered;}
    if(pet){pet.options[0].textContent=d.dog;pet.options[1].textContent=d.cat;}
    if(date){date.lang=lang==='en'?'en-US':'ko-KR';date.setAttribute('aria-label',d.labels[3]);}
  }
  function apply(next){
    lang=next; const d=lang==='en'?en:ko; document.documentElement.lang=lang;
    $('.dq-blog').textContent=d.blog; $('.dq-lang').textContent=lang==='ko'?'EN':'KO';
    $('.eyebrow').textContent=d.eye; $('.intro-panel h1').innerHTML=d.h1; $('.lead').textContent=d.lead;
    $$('.point span').forEach((el,i)=>el.textContent=d.points[i]); $('.card h2').textContent=d.card; $('.card .sub').textContent=d.sub;
    $$('.form-grid label').forEach((el,i)=>el.textContent=d.labels[i]); $('.card>button').textContent=d.button;
    const info=$('.center-info'); if(info) info.innerHTML='<div><b>'+d.call+'</b> : <a href="tel:01064957571">010-6495-7571</a></div><div><b>'+d.address+'</b> : '+d.addressText+'</div>';
    const caption=$('.store-photo-caption'); if(caption) caption.textContent=d.store;
    $$('.interior-photo span').forEach((el,i)=>el.textContent=d.interior[i]);
    localizeOptions(d);
  }
  $('.dq-lang').addEventListener('click',()=>apply(lang==='ko'?'en':'ko'));
  const country=$('#country'); if(country) new MutationObserver(()=>localizeOptions(lang==='en'?en:ko)).observe(country,{childList:true});
  apply('ko');
})();
