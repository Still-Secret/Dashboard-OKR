const CAT_DEFS = [
  { id: 'grab_oona',        icon: '🚕', label: 'GRAB OONA' },
  { id: 'grab_avrist',      icon: '🚕', label: 'GRAB AVRIST' },
  { id: 'nongrab_oona',     icon: '🚙', label: 'NON-GRAB OONA' },
  { id: 'nongrab_avrist',   icon: '🚙', label: 'NON-GRAB AVRIST' },
  { id: 'nongrab_sinarmas', icon: '🚙', label: 'NON-GRAB SINAR MAS' },
  { id: 'grab_allrisk',     icon: '🛡️', label: 'GRAB ALL RISK' },
  { id: 'nongrab_allrisk',  icon: '🛡️', label: 'NON-GRAB ALL RISK' },
];

const METRICS = [
  { key: 'reported', csv: 'reported',    label: 'Reported to Insurance', target: 95, weight: 30 },
  { key: 'spk',      csv: 'spk_issued',  label: 'SPK Issued',            target: 85, weight: 25 },
  { key: 'invoice',  csv: 'invoice',     label: 'Invoiced',              target: 60, weight: 25 },
  { key: 'paid',     csv: 'paid',        label: 'Paid / Disbursed',      target: 30, weight: 20 },
];

let rawRows = [];
let allDates = [];
let filtered = { start: null, end: null };
let activeCats = new Set(CAT_DEFS.map(c => c.id));

async function boot() {
  const statusEl = document.getElementById('loadStatus');
  try {
    rawRows = await OKR.loadCsv('data/insurance_daily.csv');
    allDates = [...new Set(rawRows.map(r => r.date))].sort();
    if (!allDates.length) throw new Error('File data kosong.');
    document.getElementById('fStart').value = allDates[0];
    document.getElementById('fEnd').value = allDates[allDates.length - 1];
    filtered.start = allDates[0];
    filtered.end = allDates[allDates.length - 1];
    statusEl.textContent = '✅ Data dimuat: ' + allDates.length + ' hari (' + allDates[0] + ' s/d ' + allDates[allDates.length - 1] + ')';
    statusEl.className = 'load-status ok';
    renderChips();
    render();
  } catch (e) {
    statusEl.textContent = '❌ ' + e.message;
    statusEl.className = 'load-status err';
  }
}

function renderChips() {
  const wrap = document.getElementById('catChips');
  wrap.innerHTML = CAT_DEFS.map(c => `
    <label class="chip on" data-id="${c.id}">
      <input type="checkbox" checked data-id="${c.id}"> ${c.icon} ${c.label}
    </label>`).join('');
  wrap.querySelectorAll('input[type=checkbox]').forEach(cb => {
    cb.addEventListener('change', () => {
      const id = cb.dataset.id;
      if (cb.checked) activeCats.add(id); else activeCats.delete(id);
      cb.closest('.chip').classList.toggle('on', cb.checked);
      render();
    });
  });
}

// aggregate totals for one category across the selected date range
function catTotals(catId) {
  const rows = rawRows.filter(r => r.category === catId && OKR.inRange(r.date, filtered.start, filtered.end));
  const sum = { total_cases: 0 };
  METRICS.forEach(m => sum[m.csv] = 0);
  rows.forEach(r => {
    sum.total_cases += OKR.toNum(r.total_cases);
    METRICS.forEach(m => sum[m.csv] += OKR.toNum(r[m.csv]));
  });
  return sum;
}

function metricAchievements(catId) {
  const t = catTotals(catId);
  return METRICS.map(m => {
    const actualPct = t.total_cases > 0 ? (t[m.csv] / t.total_cases) * 100 : 0;
    const ach = m.target > 0 ? (actualPct / m.target) * 100 : 0;
    return { ...m, actualPct, ach };
  });
}

function catOverallAch(catId) {
  const ms = metricAchievements(catId);
  const wsum = ms.reduce((s, m) => s + m.weight, 0);
  const sum = ms.reduce((s, m) => s + m.ach * m.weight, 0);
  return wsum ? sum / wsum : 0;
}

function cardHtml(cat) {
  const ms = metricAchievements(cat.id);
  const overall = catOverallAch(cat.id);
  const rowsHtml = ms.map(m => {
    const st = OKR.statusFor(m.ach);
    const rid = 'ring-' + cat.id + '-' + m.key;
    return `
      <div class="kr-row">
        <div class="kr-name">${m.label}<small>Target ≥ ${m.target}% &nbsp;•&nbsp; Aktual ${OKR.fmtPct(m.actualPct)}</small></div>
        <div class="achv"><div class="ring-wrap"><canvas id="${rid}"></canvas><div class="val" style="color:${st.color}" id="${rid}-val">${OKR.fmtPct(m.ach)}</div></div></div>
        <div class="status-badge">${st.icon}</div>
      </div>`;
  }).join('');
  const t = catTotals(cat.id);
  return `
    <div class="card">
      <div class="card-head ins">
        <div class="ic">${cat.icon}</div>
        <div class="ttl">${cat.label}<small>${OKR.fmtInt(t.total_cases)} total kasus pada periode</small></div>
        <div class="ring-total"><canvas id="ringtotal-${cat.id}"></canvas><div class="val" id="ringtotal-val-${cat.id}"></div></div>
      </div>
      <div class="kr-body">${rowsHtml}</div>
    </div>`;
}

function render() {
  const shown = CAT_DEFS.filter(c => activeCats.has(c.id));
  document.getElementById('catGroup').innerHTML = shown.map(cardHtml).join('');

  shown.forEach(cat => {
    const ms = metricAchievements(cat.id);
    ms.forEach(m => {
      const rid = 'ring-' + cat.id + '-' + m.key;
      OKR.renderRing(rid, m.ach, m.ach >= 100 ? 'var(--ok)' : m.ach >= 80 ? 'var(--warn)' : 'var(--bad)');
    });
    OKR.renderRingTotal('ringtotal-' + cat.id, document.getElementById('ringtotal-val-' + cat.id), catOverallAch(cat.id));
  });

  METRICS.forEach(m => renderMetricBar(m, shown));
}

function renderMetricBar(metric, cats) {
  const canvasId = 'chart' + metric.key.charAt(0).toUpperCase() + metric.key.slice(1);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const labels = cats.map(c => c.label);
  const data = cats.map(c => {
    const ms = metricAchievements(c.id);
    const found = ms.find(x => x.key === metric.key);
    return Math.round(found.actualPct * 100) / 100;
  });
  const colors = cats.map(c => {
    const ms = metricAchievements(c.id);
    const found = ms.find(x => x.key === metric.key);
    return OKR.resolveColor(found.ach >= 100 ? 'var(--ok)' : found.ach >= 80 ? 'var(--warn)' : 'var(--bad)');
  });
  if (OKR.ringCharts[canvasId]) OKR.ringCharts[canvasId].destroy();
  OKR.ringCharts[canvasId] = new Chart(canvas, {
    type: 'bar',
    data: { labels, datasets: [{ label: metric.label + ' (%)', data, backgroundColor: colors, borderRadius: 6, maxBarThickness: 30 }] },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: metric.label + ' — Target ' + metric.target + '%', font: { size: 12 } }
      },
      scales: { x: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } } }
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
