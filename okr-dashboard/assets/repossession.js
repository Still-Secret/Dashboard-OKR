const KR_DEFS = [
  { id: 'dw_dw_bike',     group: 'bike', icon: '🏍️', label: 'DW – DW',        sub: 'Bike / Motor',  targetPerDay: 5 },
  { id: 'dw_pkwt_bike',   group: 'bike', icon: '🏍️', label: 'DW – PKWT',      sub: 'Bike / Motor',  targetPerDay: 6 },
  { id: 'pkwt_pkwt_bike', group: 'bike', icon: '🏍️', label: 'PKWT – PKWT',    sub: 'Bike / Motor',  targetPerDay: 7 },
  { id: 'dw_dw_car',      group: 'car',  icon: '🚗',  label: 'DW – DW',        sub: 'Car / Mobil',   targetPerDay: 7 },
  { id: 'dw_pkwt_car',    group: 'car',  icon: '🚗',  label: 'DW – PKWT',      sub: 'Car / Mobil',   targetPerDay: 8 },
  { id: 'pkwt_pkwt_car',  group: 'car',  icon: '🚗',  label: 'PKWT – PKWT',    sub: 'Car / Mobil',   targetPerDay: 9 },
];

let rawRows = [];
let allDates = [];
let filtered = { start: null, end: null };

async function boot() {
  const statusEl = document.getElementById('loadStatus');
  try {
    rawRows = await OKR.loadCsv('data/repossession_daily.csv');
    allDates = [...new Set(rawRows.map(r => r.date))].sort();
    if (!allDates.length) throw new Error('File data kosong.');
    document.getElementById('fStart').value = allDates[0];
    document.getElementById('fEnd').value = allDates[allDates.length - 1];
    filtered.start = allDates[0];
    filtered.end = allDates[allDates.length - 1];
    statusEl.textContent = '✅ Data dimuat: ' + allDates.length + ' hari (' + allDates[0] + ' s/d ' + allDates[allDates.length - 1] + ')';
    statusEl.className = 'load-status ok';
    render();
  } catch (e) {
    statusEl.textContent = '❌ ' + e.message;
    statusEl.className = 'load-status err';
  }
}

function computeKR(def) {
  const rows = rawRows.filter(r => r.category === def.id && OKR.inRange(r.date, filtered.start, filtered.end));
  const actual = rows.reduce((s, r) => s + OKR.toNum(r.actual_units), 0);
  const days = OKR.daysBetween(filtered.start, filtered.end);
  const target = def.targetPerDay * days;
  const ach = target > 0 ? (actual / target) * 100 : 0;
  return { actual, target, days, ach };
}

function weightedGroupTotal(defs) {
  const results = defs.map(computeKR);
  const targetSum = results.reduce((s, r) => s + r.target, 0);
  const actualSum = results.reduce((s, r) => s + r.actual, 0);
  return targetSum > 0 ? (actualSum / targetSum) * 100 : 0;
}

function cardHtml(def) {
  const r = computeKR(def);
  const st = OKR.statusFor(r.ach);
  const cls = def.group;
  return `
    <div class="card">
      <div class="card-head ${cls}">
        <div class="ic">${def.icon}</div>
        <div class="ttl">${def.label}<small>${def.sub}</small></div>
        <div class="ring-total"><canvas id="ringtotal-${def.id}"></canvas><div class="val" id="ringtotal-val-${def.id}"></div></div>
      </div>
      <div class="kr-body">
        <div class="kr-stats">
          <div class="stat"><div class="lbl">Target Periode</div><div class="val">${OKR.fmtInt(r.target)}</div><div class="sub">${def.targetPerDay} unit/hari × ${r.days} hari</div></div>
          <div class="stat"><div class="lbl">Aktual</div><div class="val">${OKR.fmtInt(r.actual)}</div><div class="sub">unit tertarik</div></div>
        </div>
        <div class="kr-row">
          <div class="kr-name">Achievement<small>Aktual / Target</small></div>
          <div class="achv"><div class="ring-wrap"><canvas id="ring-${def.id}"></canvas><div class="val" style="color:${st.color}" id="ring-val-${def.id}">${OKR.fmtPct(r.ach)}</div></div></div>
          <div class="status-badge">${st.icon}</div>
        </div>
        <div class="status-lbl" style="color:${st.color}">${st.label}</div>
      </div>
    </div>`;
}

function render() {
  document.getElementById('bikeGroup').innerHTML = KR_DEFS.filter(d => d.group === 'bike').map(cardHtml).join('');
  document.getElementById('carGroup').innerHTML = KR_DEFS.filter(d => d.group === 'car').map(cardHtml).join('');

  KR_DEFS.forEach(def => {
    const r = computeKR(def);
    OKR.renderRing('ring-' + def.id, r.ach, r.ach >= 100 ? 'var(--ok)' : r.ach >= 80 ? 'var(--warn)' : 'var(--bad)');
  });

  const bikeTotal = weightedGroupTotal(KR_DEFS.filter(d => d.group === 'bike'));
  const carTotal = weightedGroupTotal(KR_DEFS.filter(d => d.group === 'car'));
  KR_DEFS.filter(d => d.group === 'bike').forEach(def => {
    OKR.renderRingTotal('ringtotal-' + def.id, document.getElementById('ringtotal-val-' + def.id), bikeTotal);
  });
  KR_DEFS.filter(d => d.group === 'car').forEach(def => {
    OKR.renderRingTotal('ringtotal-' + def.id, document.getElementById('ringtotal-val-' + def.id), carTotal);
  });

  renderBarChart('chartBike', KR_DEFS.filter(d => d.group === 'bike'), 'Achievement Bike (%)');
  renderBarChart('chartCar', KR_DEFS.filter(d => d.group === 'car'), 'Achievement Car (%)');
}

function renderBarChart(canvasId, defs, title) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const labels = defs.map(d => d.label);
  const data = defs.map(d => Math.round(computeKR(d).ach * 100) / 100);
  const colors = data.map(v => OKR.resolveColor(v >= 100 ? 'var(--ok)' : v >= 80 ? 'var(--warn)' : 'var(--bad)'));
  if (OKR.ringCharts[canvasId]) OKR.ringCharts[canvasId].destroy();
  OKR.ringCharts[canvasId] = new Chart(canvas, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Achievement %', data, backgroundColor: colors, borderRadius: 6, maxBarThickness: 40 }] },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: true,
      plugins: { legend: { display: false }, title: { display: true, text: title, font: { size: 12 } } },
      scales: { x: { beginAtZero: true, ticks: { callback: v => v + '%' } } }
    }
  });
}

document.getElementById('applyBtn').addEventListener('click', () => {
  filtered.start = document.getElementById('fStart').value || allDates[0];
  filtered.end = document.getElementById('fEnd').value || allDates[allDates.length - 1];
  if (filtered.start > filtered.end) [filtered.start, filtered.end] = [filtered.end, filtered.start];
  render();
});
document.getElementById('resetBtn').addEventListener('click', () => {
  document.getElementById('fStart').value = allDates[0];
  document.getElementById('fEnd').value = allDates[allDates.length - 1];
  filtered.start = allDates[0];
  filtered.end = allDates[allDates.length - 1];
  render();
});

boot();
