import * as TravelPassStore from './firebase-store.js';
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const id = new URLSearchParams(location.search).get('id');
  const escapeHtml = value => String(value || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  $('travel-login').onclick = () => TravelPassStore.login().catch(() => { $('travel-auth-status').textContent = '로그인에 실패했습니다. 다시 시도해 주세요.'; });
  $('travel-logout').onclick = () => TravelPassStore.logout();
  let version = 0;
  TravelPassStore.observeAuth(async user => {
    const currentVersion = ++version;
    $('pass').classList.add('hidden');
    $('not-found').classList.add('hidden');
    document.title = '닥터검역 Travel Pass';
    $('travel-login').hidden = !!user;
    $('travel-logout').hidden = !user;
    $('travel-auth-status').textContent = user ? '고객 계정 UID: ' + user.uid + ' · 담당자에게 이 UID를 알려 주세요.' : '담당자에게 등록한 Google 계정으로 로그인해 주세요.';
    if (!user) return;
    try {
      const customer = await TravelPassStore.get(id);
      if (currentVersion !== version) return;
      if (!customer) { $('not-found').classList.remove('hidden'); return; }
      render(customer);
    } catch(error) {
      if (currentVersion !== version) return;
      $('not-found').classList.remove('hidden');
      $('travel-auth-status').textContent = '조회할 수 없습니다. 계정 UID: ' + user.uid + ' · 담당자에게 계정 등록 및 주소 확인을 요청해 주세요.';
    }
  });
  function render(customer) {

  const steps = Array.isArray(customer.steps) && customer.steps.length ? customer.steps : TravelPassStore.steps;
  const completed = new Set(customer.completedStepIds);
  const progress = Math.round((completed.size / steps.length) * 100);
  const current = steps.find(step => step.id === customer.currentStepId) || steps[0];
  const dateText = value => value ? new Intl.DateTimeFormat('ko-KR', { year:'numeric', month:'long', day:'numeric' }).format(new Date(value + 'T00:00:00')) : '일정 확인 중';
  const dDay = value => {
    if (!value) return '미정';
    const today = new Date(); today.setHours(0,0,0,0);
    const target = new Date(value + 'T00:00:00');
    const days = Math.ceil((target - today) / 86400000);
    return days === 0 ? 'D-DAY' : days > 0 ? `D-${days}` : `D+${Math.abs(days)}`;
  };

  document.title = `${customer.petName || '반려동물'} Travel Pass | 닥터검역`;
  $('pet-name').textContent = customer.petName || '반려동물';
  $('guardian-name').textContent = customer.guardianName || '고객';
  $('route').textContent = `${customer.country || '목적지 확인 중'} 출국`;
  $('departure').textContent = `출국일 ${dateText(customer.departureDate)}`;
  $('d-day').textContent = dDay(customer.departureDate);
  $('progress-number').textContent = `${progress}%`;
  $('current-step').textContent = current.name;
  $('completed-count').textContent = `${completed.size}/${steps.length} 완료`;
  $('progress-bar').style.width = `${progress}%`;
  $('progress-copy').textContent = `${progress}%`;
  $('next-visit').textContent = customer.nextVisitDate ? `다음 방문 · ${dateText(customer.nextVisitDate)}` : '다음 방문일 조율 중';
  $('next-action').textContent = customer.nextAction || '담당자가 다음 준비사항을 안내드릴 예정입니다.';
  $('memo').textContent = customer.memo || '등록된 메모가 없습니다.';
  $('timeline').innerHTML = steps.map((step, index) => {
    const isDone = completed.has(step.id);
    const isCurrent = step.id === customer.currentStepId && !isDone;
    const status = isDone ? 'done' : isCurrent ? 'current' : '';
    const icon = isDone ? '✓' : index + 1;
    const suffix = isDone ? ' · 완료' : isCurrent ? ' · 진행 중' : '';
    return `<li class="${status}"><span class="step-icon">${icon}</span><div class="step-copy"><strong>${escapeHtml(step.name)}${suffix}</strong><span>${escapeHtml(step.description)}</span></div></li>`;
  }).join('');
  $('pass').classList.remove('hidden');
  }
})();
