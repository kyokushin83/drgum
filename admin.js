import * as TravelPassStore from './firebase-store.js?v=20261012-3';
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
      const customer = await TravelPassStore.get(selectedId);
      if(customer) applyCountrySchedule(customer.country, customer.completedStepIds, customer.currentStepId, customer.steps);
    } catch(error) {
      console.warn('Google Sheets 일정 로드 실패 - 저장된 단계 사용', error);
      $('schedule-status').textContent = '· 저장된 단계 사용 중';
    }
  }

  function travelUrl(token) { return new URL(`travel.html#token=${encodeURIComponent(token)}`, location.href).href; }
  function showToast(message) {
    $('toast').textContent = message; $('toast').classList.add('show');
    clearTimeout(showToast.timer); showToast.timer = setTimeout(() => $('toast').classList.remove('show'), 2200);
  }
  function dateShort(value) { return value ? value.replaceAll('-', '.') : '미정'; }
  async function renderList() {
    const uid = TravelPassStore.auth.currentUser?.uid;
    const version = authVersion;
    const items = await TravelPassStore.list();
    if (!uid || version !== authVersion || uid !== TravelPassStore.auth.currentUser?.uid) return;
    const customers = items.filter(item => [item.guardianName,item.petName,item.country,item.id].join(' ').toLowerCase().includes(searchTerm));
    $('customer-items').innerHTML = customers.length ? customers.map(item => `<button type="button" class="customer-item ${item.id === selectedId ? 'active' : ''}" data-id="${escapeHtml(item.id)}"><strong>${escapeHtml(item.petName || '이름 없음')} · ${escapeHtml(item.guardianName || '보호자 미정')}</strong><span>${escapeHtml(item.country || '국가 미정')} · ${escapeHtml(dateShort(item.departureDate))} · ${escapeHtml(item.id)}</span></button>`).join('') : '<div class="empty" style="padding:24px 8px"><p>검색 결과가 없습니다.</p></div>';
    document.querySelectorAll('.customer-item').forEach(button => button.addEventListener('click', () => { if (!busy) select(button.dataset.id).catch(reportError); }));
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
    $('share-enabled').checked = customer.shareEnabled !== false;
    applyCountrySchedule(customer.country, customer.completedStepIds, customer.currentStepId, customer.steps);
    $('editor-title').textContent = isNew ? '새 고객 등록' : `${customer.petName || '고객'} Travel Pass`;
    $('id-badge').textContent = customer.id;
    const shareable = !isNew && !!customer.shareToken && customer.shareEnabled !== false;
    $('customer-url').value = shareable ? travelUrl(customer.shareToken) : '';
    $('open-url').removeAttribute('href');
    if (shareable) $('open-url').href = travelUrl(customer.shareToken);
    $('copy-url').disabled = !shareable;
    $('customer-url-status').textContent = customer.shareError
      ? '고객 정보는 저장됐지만 공유 설정 반영에 실패했습니다. Firebase 공유 규칙 게시 및 연결을 확인한 뒤 다시 저장해 주세요. 기존 공유 링크는 계속 열릴 수 있습니다.'
      : customer.shareEnabled === false
        ? '고객 링크 공유가 중지되었습니다.'
        : shareable
          ? '로그인 없이 열리는 고객 URL입니다. 마지막 저장일부터 180일간 유효하며 공유 체크를 해제하고 저장하면 접근이 중지됩니다.'
          : '고객 정보를 저장하면 전용 URL이 생성됩니다.';
    $('delete-button').classList.toggle('hidden', isNew);
    renderList().catch(reportError);
  }
  async function select(id) { const customer = await TravelPassStore.get(id); if (customer && TravelPassStore.isAdmin(TravelPassStore.auth.currentUser)) fill(customer, false); }
  function newCustomer() { fill(TravelPassStore.createBlank(), true); $('guardian-name').focus(); }
  function formValue() {
    return {
      id: $('customer-id').value, shareEnabled: $('share-enabled').checked, guardianName: $('guardian-name').value.trim(), petName: $('pet-name').value.trim(),
      country: $('country').value.trim(), departureDate: $('departure-date').value,
      currentStepId: $('current-step').value, nextVisitDate: $('next-visit-date').value,
      nextAction: $('next-action').value.trim(), memo: $('memo').value.trim(),
      steps: currentSteps,
      completedStepIds: Array.from(document.querySelectorAll('[name="completed-step"]:checked')).map(box => box.value)
    };
  }

  function reportError(error) {
    console.error(error);
    showToast(error.code === 'permission-denied' ? '접근이 거부되었습니다. Firebase 보안 규칙과 관리자 계정을 확인해 주세요.' : (error.message || '저장소 연결을 확인해 주세요.'));
  }
  let busy = false;
  async function mutate(action) {
    if (busy) return;
    busy = true;
    $('editor-fields').disabled = true;
    $('new-button').disabled = true;
    $('import-local').disabled = true;
    try { await action(); } catch (error) { reportError(error); }
    finally {
      busy = false;
      const locked = !TravelPassStore.isAdmin(TravelPassStore.auth.currentUser);
      $('editor-fields').disabled = locked;
      $('new-button').disabled = locked;
      $('import-local').disabled = locked;
    }
  }
  $('customer-form').addEventListener('submit', event => {
    event.preventDefault();
    const value = formValue();
    mutate(async () => {
      const saved = await TravelPassStore.save(value);
      if (!TravelPassStore.isAdmin(TravelPassStore.auth.currentUser)) return;
      fill(saved, false); showToast(saved.shareError ? '고객 저장 완료 · 공유 링크 생성은 실패했습니다.' : '고객 정보와 공유 설정이 저장되었습니다.');
    });
  });
  $('new-button').addEventListener('click', newCustomer);
  $('country').addEventListener('change', () => applyCountrySchedule($('country').value.trim(), [], null, null));
  $('search').addEventListener('input', event => { searchTerm = event.target.value.trim().toLowerCase(); renderList().catch(reportError); });
  $('copy-url').addEventListener('click', async () => {
    const text = $('customer-url').value;
    try { await navigator.clipboard.writeText(text); showToast('고객 URL을 복사했습니다.'); }
    catch (error) { $('customer-url').select(); document.execCommand('copy'); showToast('고객 URL을 복사했습니다.'); }
  });
  $('delete-button').addEventListener('click', () => mutate(async () => {
    const customer = await TravelPassStore.get(selectedId);
    if (!customer || !confirm(customer.guardianName + ' 보호자님의 ' + customer.petName + ' 정보를 삭제할까요?')) return;
    await TravelPassStore.remove(selectedId);
    const next = (await TravelPassStore.list())[0];
    if (next) await select(next.id); else newCustomer();
    showToast('고객 정보를 삭제했습니다.');
  }));
  $('import-local').addEventListener('click', () => {
    if (!confirm('이 브라우저의 기존 고객을 Firestore로 가져올까요? 기존 고객 ID는 유지하며 원본과 이미 등록된 고객은 변경하지 않습니다.')) return;
    mutate(async () => {
      const count = await TravelPassStore.importLegacy();
      await renderList();
      showToast(count + '명 가져오기 완료');
    });
  });
  $('admin-login').onclick = () => TravelPassStore.login().catch(reportError);
  $('admin-logout').onclick = () => TravelPassStore.logout().catch(reportError);
  let authVersion = 0;
  TravelPassStore.observeAuth(async user => {
    const version = ++authVersion;
    const allowed = TravelPassStore.isAdmin(user);
    $('admin-login').hidden = !!user;
    $('admin-logout').hidden = !user;
    $('editor-fields').disabled = true;
    $('new-button').disabled = true;
    $('import-local').disabled = true;
    $('customer-items').replaceChildren();
    $('customer-form').reset();
    $('open-url').removeAttribute('href');
    $('customer-url-status').textContent = '';
    $('copy-url').disabled = true;
    selectedId = null;
    $('auth-status').textContent = allowed ? 'Firestore 연결 확인 중…' : user ? '이 계정은 관리자 권한이 없습니다.' : '관리자 Google 로그인이 필요합니다.';
    if (!allowed) return;
    try {
      const initial = (await TravelPassStore.list())[0];
      if (version !== authVersion) return;
      $('editor-fields').disabled = false;
      $('new-button').disabled = false;
      $('import-local').disabled = false;
      $('auth-status').textContent = user.email + ' · Firestore 연결됨';
      if (initial) await select(initial.id); else newCustomer();
      loadSchedules();
    } catch (error) {
      if (version !== authVersion) return;
      $('auth-status').textContent = 'Firebase 설정 대기 또는 접근 실패 · 보안 규칙과 활성화 설정을 확인해 주세요.';
      reportError(error);
    }
  });
})();
