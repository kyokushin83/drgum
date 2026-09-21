(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  let selectedId = null;
  let searchTerm = '';
  let currentSteps = TravelPassStore.steps;
  let schedulesByCountry = {};
  const SHEET_ID = '1bKBW8lEp7bY1e_1BdwQrwxF84WU00ytedpZqKme0QRQ';
  const escapeHtml = value => String(value || '').replace(/[&<>'"]/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[character]);

  function csvUrl(sheetName) { return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}&_=${Date.now()}`; }
  function parseCSV(text) {
    const rows=[]; let row=[], cell='', quoted=false;
    for(let index=0;index<text.length;index++){
      const character=text[index], next=text[index+1];
      if(character==='"' && quoted && next==='"'){ cell+='"'; index++; }
      else if(character==='"') quoted=!quoted;
      else if(character===',' && !quoted){ row.push(cell); cell=''; }
      else if((character==='\n'||character==='\r') && !quoted){
        if(character==='\r' && next==='\n') index++;
        row.push(cell); if(row.some(value=>value!=='')) rows.push(row); row=[]; cell='';
      } else cell+=character;
    }
    row.push(cell); if(row.some(value=>value!=='')) rows.push(row);
    return rows;
  }
  function stepId(country, order, title) {
    let hash=0; const source=`${country}|${order}|${title}`;
    for(let index=0;index<source.length;index++) hash=((hash<<5)-hash+source.charCodeAt(index))|0;
    return `sheet-${order}-${Math.abs(hash).toString(36)}`;
  }
  function periodText(days) {
    const number=Number(days)||0;
    if(number===0) return '출국 당일';
    return number<0 ? `출국 ${Math.abs(number)}일 전` : `출국 ${number}일 후`;
  }
  function renderStepFields(steps, completedIds, currentId) {
    currentSteps = steps.length ? steps : TravelPassStore.steps;
    const completed = new Set(completedIds || []);
    $('current-step').innerHTML = currentSteps.map(step => `<option value="${escapeHtml(step.id)}">${escapeHtml(step.name)}</option>`).join('');
    $('current-step').value = currentSteps.some(step => step.id === currentId) ? currentId : currentSteps[0].id;
    $('steps-editor').innerHTML = currentSteps.map(step => `<label class="check-row"><input type="checkbox" name="completed-step" value="${escapeHtml(step.id)}" ${completed.has(step.id)?'checked':''}><span><strong>${escapeHtml(step.name)}</strong>${step.description?`<small style="display:block;color:#64748b;margin-top:4px">${escapeHtml(step.description)}</small>`:''}</span></label>`).join('');
  }
  function applyCountrySchedule(country, completedIds, currentId, savedSteps) {
    const sheetSteps = schedulesByCountry[country];
    const steps = sheetSteps && sheetSteps.length ? sheetSteps : (savedSteps && savedSteps.length ? savedSteps : TravelPassStore.steps);
    renderStepFields(steps, completedIds, currentId);
    $('schedule-status').textContent = sheetSteps && sheetSteps.length ? `· 스프레드시트 ${sheetSteps.length}단계` : '· 기본 단계';
  }
  async function loadSchedules() {
    try {
      const response = await fetch(csvUrl('일정'), {cache:'no-store'});
      if(!response.ok) throw new Error('일정 시트를 읽을 수 없습니다.');
      const rows = parseCSV(await response.text()).slice(1);
      const next = {};
      rows.forEach(row => {
        const [country,order,days,title,description,use]=row;
        if(!country || !title || String(use).toUpperCase()==='N') return;
        (next[country] ||= []).push({
          id:stepId(country,Number(order)||0,title), name:title,
          description:`${periodText(days)}${description ? ` · ${description}` : ''}`,
          days:Number(days)||0, order:Number(order)||0
        });
      });
      Object.values(next).forEach(items => items.sort((a,b)=>a.order-b.order));
      schedulesByCountry = next;
      $('country-options').innerHTML = Object.keys(next).map(country => `<option value="${escapeHtml(country)}"></option>`).join('');
      const customer = TravelPassStore.get(selectedId);
      if(customer) applyCountrySchedule(customer.country, customer.completedStepIds, customer.currentStepId, customer.steps);
    } catch(error) {
      console.warn('Google Sheets 일정 로드 실패 - 저장된 단계 사용', error);
      $('schedule-status').textContent = '· 저장된 단계 사용 중';
    }
  }

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
    $('next-visit-date').value = customer.nextVisitDate || '';
    $('next-action').value = customer.nextAction || '';
    $('memo').value = customer.memo || '';
    applyCountrySchedule(customer.country, customer.completedStepIds, customer.currentStepId, customer.steps);
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
      steps: currentSteps,
      completedStepIds: Array.from(document.querySelectorAll('[name="completed-step"]:checked')).map(box => box.value)
    };
  }

  $('customer-form').addEventListener('submit', event => {
    event.preventDefault();
    const saved = TravelPassStore.save(formValue());
    fill(saved, false); showToast('고객 정보가 저장되었습니다.');
  });
  $('new-button').addEventListener('click', newCustomer);
  $('country').addEventListener('change', () => applyCountrySchedule($('country').value.trim(), [], null, null));
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
  loadSchedules();
})();
