/* ========================================================================
   common.js — helper bersama untuk index.html & insurance-detail.html
   Semua fungsi di sini murni (tidak menyimpan state), aman dipakai lintas
   halaman.
   ======================================================================== */

/**
 * Ambil data JSON dari repo (folder /data). Kalau fetch gagal (mis. dibuka
 * langsung dari file lokal, atau dipratinjau di luar server web), maka akan
 * jatuh ke data cadangan (fallback) supaya halaman tetap tampil.
 */
async function fetchJSON(path, fallback) {
  try {
    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (e) {
    console.warn('[fetchJSON] Gagal memuat', path, '- pakai data bawaan.', e.message);
    return JSON.parse(JSON.stringify(fallback));
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : str;
  return div.innerHTML;
}

function fmtPct(n) {
  if (!isFinite(n)) return '0%';
  const r = Math.round(n * 100) / 100;
  return (Number.isInteger(r) ? r : r.toFixed(2)) + '%';
}

function calcAchievement(kr) {
  const t = parseFloat(kr.target), a = parseFloat(kr.actual);
  if (!isFinite(t) || t === 0 || !isFinite(a)) return 0;
  return kr.direction === 'lower' ? (t / a) * 100 : (a / t) * 100;
}

function statusFor(ach) {
  if (ach >= 100) return { icon: '✅', color: 'var(--ok)', soft: 'var(--ok-soft)', label: 'ON TARGET' };
  if (ach >= 80) return { icon: '⚠️', color: 'var(--warn)', soft: 'var(--warn-soft)', label: 'BELOW TARGET' };
  return { icon: '❌', color: 'var(--bad)', soft: 'var(--bad-soft)', label: ach <= 0 ? 'NOT ACHIEVED' : 'BELOW TARGET' };
}

function weightedTotal(krs) {
  let sum = 0, wsum = 0;
  krs.forEach(kr => {
    const ach = calcAchievement(kr);
    const w = parseFloat(kr.weight) || 0;
    sum += ach * w / 100;
    wsum += w;
  });
  return wsum ? sum : 0;
}

function getCss(varName) {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

function ringColor(ach) {
  if (ach >= 100) return getCss('--ok');
  if (ach >= 80) return getCss('--warn');
  return getCss('--bad');
}

/** Render ring/doughnut kecil untuk 1 Key Result. chartsStore = object penyimpan instance Chart.js (per halaman). */
function renderRing(chartsStore, canvasId, ach) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const val = Math.max(0, Math.min(ach, 100));
  const color = ringColor(ach);
  if (chartsStore[canvasId]) chartsStore[canvasId].destroy();
  chartsStore[canvasId] = new Chart(canvas, {
    type: 'doughnut',
    data: { datasets: [{ data: [val, 100 - val], backgroundColor: [color, '#e7eaf1'], borderWidth: 0 }] },
    options: { cutout: '72%', rotation: -90, circumference: 360, plugins: { legend: { display: false }, tooltip: { enabled: false } }, animation: { duration: 300 } }
  });
}

/** Render ring total (weighted) di header kartu. */
function renderRingTotal(chartsStore, canvasId, total) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const t = Math.max(0, Math.min(total, 100));
  if (chartsStore[canvasId]) chartsStore[canvasId].destroy();
  chartsStore[canvasId] = new Chart(canvas, {
    type: 'doughnut',
    data: { datasets: [{ data: [t, 100 - t], backgroundColor: ['#ffffff', 'rgba(255,255,255,.28)'], borderWidth: 0 }] },
    options: { cutout: '68%', rotation: -90, circumference: 360, plugins: { legend: { display: false }, tooltip: { enabled: false } }, animation: { duration: 300 } }
  });
  const valEl = canvas.parentElement.querySelector('.val');
  if (valEl) valEl.textContent = Math.round(t) + '%';
}

/** Render bar chart perbandingan achievement antar Key Result / kategori. */
function renderBarChart(chartsStore, canvasId, labels, data, colors, titleText) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  if (chartsStore[canvasId]) chartsStore[canvasId].destroy();
  chartsStore[canvasId] = new Chart(canvas, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Achievement %', data, backgroundColor: colors, borderRadius: 6, maxBarThickness: 34 }] },
    options: {
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: true,
      plugins: { legend: { display: false }, title: { display: true, text: titleText, font: { size: 12 } } },
      scales: { x: { beginAtZero: true, ticks: { callback: v => v + '%' } } }
    }
  });
}

/** Format tanggal ISO (YYYY-MM-DD) ke format Indonesia singkat, mis. "1 Jul 2026". */
function fmtTanggal(iso) {
  if (!iso) return '-';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Daftar kategori Insurance untuk halaman detail (id, label tampilan, warna aksen). */
const INSURANCE_CATEGORIES = [
  { id: 'GRAB_OONA', label: 'GRAB - OONA', color: '#2f6fed' },
  { id: 'GRAB_AVRIST', label: 'GRAB - AVRIST', color: '#5b3aa8' },
  { id: 'NON_GRAB_OONA', label: 'NON GRAB - OONA', color: '#0f9b8e' },
  { id: 'NON_GRAB_AVRIST', label: 'NON GRAB - AVRIST', color: '#177a4d' },
  { id: 'NON_GRAB_SINARMAS', label: 'NON GRAB - SINAR MAS', color: '#0f7bb5' },
  { id: 'GRAB_ALL_RISK', label: 'GRAB - ALL RISK', color: '#c98a12' },
  { id: 'NON_GRAB_ALL_RISK', label: 'NON GRAB - ALL RISK', color: '#c0451f' },
];
