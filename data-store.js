(function (global) {
  'use strict';

  const STEP_CATALOG = [
    { id: 'consult', name: '출국 상담 및 일정 확인', description: '국가별 요구사항과 전체 일정을 확인합니다.' },
    { id: 'microchip', name: '마이크로칩 확인', description: 'ISO 규격 마이크로칩 번호를 확인합니다.' },
    { id: 'rabies', name: '광견병 예방접종', description: '유효한 광견병 예방접종 기록을 준비합니다.' },
    { id: 'titer', name: '광견병 항체가검사', description: '필요 국가의 항체가검사와 대기기간을 확인합니다.' },
    { id: 'notification', name: '도착국 사전신고', description: '도착국 검역기관에 필요한 사전신고를 진행합니다.' },
    { id: 'certificate', name: '건강증명서 및 서류 준비', description: '출국에 필요한 증명서와 첨부서류를 준비합니다.' },
    { id: 'final', name: '최종 검역 및 출국', description: '최종 서류 검토 후 공항 검역을 진행합니다.' }
  ];


  function normalize(customer) {
    const clean = {...customer};
    clean.steps = Array.isArray(clean.steps) && clean.steps.length ? clean.steps.map((step,index) => ({
      id: String(step.id || 'step-' + (index+1)), name: String(step.name || '준비 단계'),
      description: String(step.description || ''), days: Number(step.days) || 0
    })) : JSON.parse(JSON.stringify(STEP_CATALOG));
    clean.completedStepIds = Array.isArray(clean.completedStepIds) ? clean.completedStepIds.filter(id => clean.steps.some(s => s.id === id)) : [];
    if (!clean.steps.some(s => s.id === clean.currentStepId)) clean.currentStepId = clean.steps[0].id;
    return clean;
  }
  global.TravelPassModel = {steps: STEP_CATALOG, normalize};
})(window);
