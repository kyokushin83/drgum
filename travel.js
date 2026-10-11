import { getShared } from './firebase-share.js?v=20261012-3';
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const token = new URLSearchParams(location.hash.slice(1)).get('token');
  const escapeHtml = value => String(value || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  async function load() {
    try {
      const customer = await getShared(token);
      if (!customer) throw new Error('공유 링크를 찾을 수 없습니다.');
      render(customer);
      $('travel-load-status').textContent = '';
    } catch(error) {
      $('travel-load-status').textContent = '진행 현황을 조회할 수 없습니다. 링크와 인터넷 연결을 확인해 주세요.';
      $('not-found').classList.remove('hidden');
    }
  }
  function render(customer) {

  const steps = customer.steps;
  if (!Array.isArray(steps) || !steps.length) throw new Error('진행 단계 정보를 확인해 주세요.');
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

  load();
})();
