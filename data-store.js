(function (global) {
  'use strict';

  const STORAGE_KEY = 'drQuarantine.travelPass.customers.v1';
  const STEP_CATALOG = [
    { id: 'consult', name: '출국 상담 및 일정 확인', description: '국가별 요구사항과 전체 일정을 확인합니다.' },
    { id: 'microchip', name: '마이크로칩 확인', description: 'ISO 규격 마이크로칩 번호를 확인합니다.' },
    { id: 'rabies', name: '광견병 예방접종', description: '유효한 광견병 예방접종 기록을 준비합니다.' },
    { id: 'titer', name: '광견병 항체가검사', description: '필요 국가의 항체가검사와 대기기간을 확인합니다.' },
    { id: 'notification', name: '도착국 사전신고', description: '도착국 검역기관에 필요한 사전신고를 진행합니다.' },
    { id: 'certificate', name: '건강증명서 및 서류 준비', description: '출국에 필요한 증명서와 첨부서류를 준비합니다.' },
    { id: 'final', name: '최종 검역 및 출국', description: '최종 서류 검토 후 공항 검역을 진행합니다.' }
  ];

  const SAMPLE = {
    id: 'A7K29X', guardianName: '김하늘', petName: '몽이', country: '일본',
    departureDate: '2026-12-20', nextVisitDate: '2026-11-10',
    nextAction: '항체가검사 결과를 확인하고 일본 사전신고 서류를 준비해 주세요.',
    currentStepId: 'titer', completedStepIds: ['consult', 'microchip', 'rabies'],
    memo: '몽이는 현재 항체가검사 결과를 기다리고 있습니다. 결과가 나오면 바로 안내드리겠습니다.',
    createdAt: '2026-09-21T09:00:00.000Z', updatedAt: '2026-09-21T09:00:00.000Z'
  };

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function normalize(customer) {
    const clean = Object.assign({}, customer);
    clean.completedStepIds = Array.isArray(clean.completedStepIds) ? clean.completedStepIds.filter(id => STEP_CATALOG.some(step => step.id === id)) : [];
    if (!STEP_CATALOG.some(step => step.id === clean.currentStepId)) clean.currentStepId = STEP_CATALOG[0].id;
    return clean;
  }
  function read() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(parsed)) return parsed.map(normalize);
    } catch (error) { console.warn('저장 데이터를 읽지 못했습니다.', error); }
    const seeded = [clone(SAMPLE)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  function write(customers) { localStorage.setItem(STORAGE_KEY, JSON.stringify(customers)); }
  function generateId(length) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const existing = new Set(read().map(item => item.id));
    let id;
    do {
      const bytes = new Uint8Array(length || 6);
      if (global.crypto && global.crypto.getRandomValues) global.crypto.getRandomValues(bytes);
      else bytes.forEach((_, index) => { bytes[index] = Math.floor(Math.random() * 256); });
      id = Array.from(bytes, value => chars[value % chars.length]).join('');
    } while (existing.has(id));
    return id;
  }
  const api = {
    steps: clone(STEP_CATALOG),
    list() { return read().sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))); },
    get(id) { return read().find(item => item.id === String(id || '').toUpperCase()) || null; },
    save(customer) {
      const customers = read();
      const now = new Date().toISOString();
      const next = normalize(Object.assign({}, customer));
      if (!next.id) next.id = generateId(6);
      next.id = next.id.toUpperCase();
      const index = customers.findIndex(item => item.id === next.id);
      if (index >= 0) {
        next.createdAt = customers[index].createdAt || now;
        next.updatedAt = now;
        customers[index] = next;
      } else {
        next.createdAt = now;
        next.updatedAt = now;
        customers.push(next);
      }
      write(customers);
      return clone(next);
    },
    remove(id) { write(read().filter(item => item.id !== id)); },
    createBlank() { return { id: generateId(6), guardianName: '', petName: '', country: '', departureDate: '', nextVisitDate: '', nextAction: '', currentStepId: STEP_CATALOG[0].id, completedStepIds: [], memo: '' }; },
    resetSample() { write([clone(SAMPLE)]); return clone(SAMPLE); }
  };

  // Firebase/Google Sheets 연동 시 이 객체와 같은 메서드(list/get/save/remove)를 제공하는
  // 새 어댑터로 교체하면 화면 코드는 그대로 유지할 수 있습니다.
  global.TravelPassStore = api;
})(window);

