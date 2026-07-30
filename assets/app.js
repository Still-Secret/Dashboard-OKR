/* Shared utilities for the OKR dashboard.
   Loads data straight from the /data CSV files in this repo, so once you
   commit an updated CSV to GitHub, reloading the page shows the new numbers.
   No build step, no backend — everything runs from static files. */

const OKR = (() => {

  // fetch + parse a CSV file as an array of row objects (string values)
  async function loadCsv(path) {
    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) throw new Error('Gagal memuat ' + path + ' (HTTP ' + res.status + ')');
    const text = await res.text();
    return Papa.parse(text.trim(), { header: true, skipEmptyLines: true }).data;
  }

  function toNum(v) {
    const n = parseFloat(v);
    return isFinite(n) ? n : 0;
  }

  function fmtInt(n) {
    return Math.round(n).toLocaleString('id-ID');
  }

  function fmtPct(n) {
    if (!isFinite(n)) return '0%';
    const r = Math.round(n * 100) / 100;
    return (Number.isInteger(r) ? r : r.toFixed(1)) + '%';
  }

  function daysBetween(startIso, endIso) {
    const a = new Date(startIso + 'T00:00:00');
    const b = new Date(endIso + 'T00:00:00');
    return Math.round((b - a) / 86400000) + 1;
  }

  function inRange(dateIso, startIso, endIso) {
    return dateIso >= startIso && dateIso <= endIso;
  }

  function statusFor(ach) {
    if (ach >= 100) return { icon: '✅', color: 'var(--ok)', label: 'ON TARGET' };
    if (ach >= 80) return { icon: '⚠️', color: 'var(--warn)', label: 'BELOW TARGET' };
    return { icon: '❌', color: 'var(--bad)', label: ach <= 0 ? 'BELUM ADA DATA' : 'NOT ACHIEVED' };
  }

  function getCss(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  }
  function resolveColor(cssVarExpr) {
    const m = /var\((--[a-z0-9-]+)\)/.exec(cssVarExpr);
    return m ? getCss(m[1]) : cssVarExpr;
  }

  const ringCharts = {};
  function renderRing(canvasId, ach, colorVar) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const val = Math.max(0, Math.min(ach, 100));
    const color = resolveColor(colorVar);
    if (ringCharts[canvasId]) ringCharts[canvasId].destroy();
    ringCharts[canvasId] = new Chart(canvas, {
      type: 'doughnut',
      data: { datasets: [{ data: [val, 100 - val], backgroundColor: [color, '#e7eaf1'], borderWidth: 0 }] },
      options: { cutout: '72%', rotation: -90, circumference: 360, plugins: { legend: { display: false }, tooltip: { enabled: false } }, animation: { duration: 250 } }
    });
  }

  function renderRingTotal(canvasId, valEl, total) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const t = Math.max(0, Math.min(total, 100));
    if (ringCharts[canvasId]) ringCharts[canvasId].destroy();
    ringCharts[canvasId] = new Chart(canvas, {
      type: 'doughnut',
      data: { datasets: [{ data: [t, 100 - t], backgroundColor: ['#ffffff', 'rgba(255,255,255,.28)'], borderWidth: 0 }] },
      options: { cutout: '68%', rotation: -90, circumference: 360, plugins: { legend: { display: false }, tooltip: { enabled: false } }, animation: { duration: 250 } }
    });
    if (valEl) valEl.textContent = Math.round(total) + '%';
  }

  return { loadCsv, toNum, fmtInt, fmtPct, daysBetween, inRange, statusFor, getCss, resolveColor, renderRing, renderRingTotal, ringCharts };
})();
