import './data-store.js?v=20261011-1';

// Fictional demo fixture for the original public sample URL. No customer database access.
export const demoTravelPass = window.TravelPassModel.normalize({
  petName: '몽이', country: '일본',
  departureDate: '2026-12-20', nextVisitDate: '2026-11-10',
  nextAction: '항체가검사 결과를 확인하고 일본 사전신고 서류를 준비해 주세요.',
  currentStepId: 'titer', completedStepIds: ['consult', 'microchip', 'rabies'],
  memo: '몽이는 현재 항체가검사 결과를 기다리고 있습니다. 결과가 나오면 바로 안내드리겠습니다.'
});
