export const partnerHospitals = Object.freeze([
  {id:'marine-forest', name:'마린숲', region:'부산'},
  {id:'suyeong-forest', name:'수영숲', region:'부산'},
  {id:'happy-our-kid', name:'행복한우리아이', region:'서울'},
  {id:'innovation-medical', name:'혁신동물의료센터', region:'경남'},
  {id:'dr-jung', name:'닥터정', region:'성남'}
].map(hospital => Object.freeze(hospital)));

export function findPartnerHospital(id) {
  return partnerHospitals.find(hospital => hospital.id === id);
}

export function normalizePartnerHospital(id) {
  if (id === undefined || id === null || id === '') return '';
  if (!findPartnerHospital(id)) throw new Error('목록에서 연계병원을 선택해 주세요.');
  return id;
}
