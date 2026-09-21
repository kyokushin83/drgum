(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  let selectedId = null;
  let searchTerm = '';
  const steps = TravelPassStore.steps;
  const escapeHtml = value => String(value || '').replace(/[&<>'"]/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[character]);

  $('current-step').innerHTML = steps.map(step => `<option value="${step.id}">${step.name}</option>`).join('');
  $('steps-editor').innerHTML = steps.map(step => `<label class="check-row"><input type="checkbox" name="completed-step" value="${step.id}"><span>${step.name}</span></label>`).join('');

  function travelUrl(id) { return new URL(`travel.html?id=${encodeURIComponent(id)}`, location.href).href; }
  function showToast(message) {
    $('toast').textContent = message; $('toast').classList.add('show');
    clearTimeout(showToast.timer); showToast.timer = setTimeout(() => $('toast').classList.remove('show'), 2200);
  }
  function dateShort(value) { return value ? value.replaceAll('-', '.') : '미정'; }
  function renderList() {
    const customers = TravelPassStore.list().filter(item => [item.guardianName,item.petName,item.country,item.id].join(' ').toLowerCase().includes(searchTerm));
    $('customer-items').innerHTML = customers.length ? customers.map(item => `<button type="button" class="customer-item ${item.id === selectedId ? 'active' : ''}" data-id="${escapeHtml(item.id)}"><strong>${escapeHtml(item.petName || '이름 없음')} · ${escapeHtml(item.guardianName || '보호자 미정')}</strong><span>${escapeHtml(item.country || '국가 미정')} · ${escapeHtml(dateShort(item.departureDate))} · ${escapeHtml(item.id)}</span></button>`).join('') : '<div class="empty" style="padding:24px 8px"><p>검색 결과가 없습니다.</p></div>';
    document.querySelectorAll('.customer-item').forEach(button => button.addEventListener('click', () => select(button.dataset.id)));
  }
  function fill(customer, isNew) {
    selectedId = customer.id;
    $('customer-id').value = customer.id;
    $('guardian-name').value = customer.guardianName || '';
    $('pet-name').value = customer.petName || '';
    $('country').value = customer.country || '';
    $('departure-date').value = customer.departureDate || '';
    $('current-step').value = customer.currentStepId || steps[0].id;
    $('next-visit-date').value = customer.nextVisitDate || '';
    $('next-action').value = customer.nextAction || '';
    $('memo').value = customer.memo || '';
    document.querySelectorAll('[name="completed-step"]').forEach(box => { box.checked = (customer.completedStepIds || []).includes(box.value); });
    $('editor-title').textContent = isNew ? '새 고객 등록' : `${customer.petName || '고객'} Travel Pass`;
    $('id-badge').textContent = customer.id;
    $('customer-url').value = travelUrl(customer.id);
    $('open-url').href = travelUrl(customer.id);
    $('delete-button').classList.toggle('hidden', isNew);
    renderList();
  }
  function select(id) { const customer = TravelPassStore.get(id); if (customer) fill(customer, false); }
  function newCustomer() { fill(TravelPassStore.createBlank(), true); $('guardian-name').focus(); }
  function formValue() {
    return {
      id: $('customer-id').value, guardianName: $('guardian-name').value.trim(), petName: $('pet-name').value.trim(),
      country: $('country').value.trim(), departureDate: $('departure-date').value,
      currentStepId: $('current-step').value, nextVisitDate: $('next-visit-date').value,
      nextAction: $('next-action').value.trim(), memo: $('memo').value.trim(),
      completedStepIds: Array.from(document.querySelectorAll('[name="completed-step"]:checked')).map(box => box.value)
    };
  }

  $('customer-form').addEventListener('submit', event => {
    event.preventDefault();
    const saved = TravelPassStore.save(formValue());
    fill(saved, false); showToast('고객 정보가 저장되었습니다.');
  });
  $('new-button').addEventListener('click', newCustomer);
  $('search').addEventListener('input', event => { searchTerm = event.target.value.trim().toLowerCase(); renderList(); });
  $('copy-url').addEventListener('click', async () => {
    const text = $('customer-url').value;
    try { await navigator.clipboard.writeText(text); showToast('고객 URL을 복사했습니다.'); }
    catch (error) { $('customer-url').select(); document.execCommand('copy'); showToast('고객 URL을 복사했습니다.'); }
  });
  $('delete-button').addEventListener('click', () => {
    const customer = TravelPassStore.get(selectedId);
    if (!customer || !confirm(`${customer.guardianName} 보호자님의 ${customer.petName} 정보를 삭제할까요?`)) return;
    TravelPassStore.remove(selectedId); const next = TravelPassStore.list()[0];
    if (next) select(next.id); else newCustomer(); showToast('고객 정보를 삭제했습니다.');
  });
  $('reset-button').addEventListener('click', () => {
    if (!confirm('현재 고객 데이터를 지우고 샘플 고객 1명으로 복원할까요?')) return;
    const sample = TravelPassStore.resetSample(); fill(sample, false); showToast('샘플 고객을 복원했습니다.');
  });

  const initial = TravelPassStore.list()[0];
  if (initial) select(initial.id); else newCustomer();
})();
