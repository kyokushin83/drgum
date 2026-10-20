// City/province choices only. Keep detailed addresses out of consultation intake.
(() => {
  const regions = ['서울특별시','부산광역시','대구광역시','인천광역시','대전광역시','울산광역시','세종특별자치시','경기도','강원특별자치도','충청북도','충청남도','전북특별자치도','전남광주통합특별시','경상북도','경상남도','제주특별자치도'];
  window.DQRegions = {values: regions.slice(), valid: value => window.DQRegions.values.includes(value)};
  const select = document.getElementById('region');
  if (!select) return;
  function render(values) {
    const previous = select.value;
    select.replaceChildren(new Option('시·도 선택', ''), ...values.map(value => new Option(value, value)));
    select.value = values.includes(previous) ? previous : '';
  }
  render(regions);
  fetch('https://docs.google.com/spreadsheets/d/1bKBW8lEp7bY1e_1BdwQrwxF84WU00ytedpZqKme0QRQ/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent('거주지역') + '&_=' + Date.now(), {cache:'no-store'})
    .then(response => { if (!response.ok) throw new Error('Region sheet unavailable'); return response.text(); })
    .then(text => {
      const values = [...new Set(parseCSV(text).slice(1)
        .filter(row => regions.includes(row[1]) && String(row[2]).toUpperCase() !== 'N')
        .sort((a,b) => Number(a[0]) - Number(b[0])).map(row => row[1]))];
      if (!values.length) throw new Error('Region sheet empty');
      window.DQRegions.values = values;
      render(values);
    }).catch(error => console.warn('거주지역 시트 연결 실패 - 내장 시·도 목록 사용', error));
})();
