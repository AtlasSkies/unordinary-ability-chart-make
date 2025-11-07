let radar1, radar2;
let radar2Ready = false;
let chartColor = '#92dfec';

const CHART2_CENTER_DX = 0;
const CHART2_CENTER_DY = 12;

const nameInput = document.getElementById('nameInput');
const abilityInput = document.getElementById('abilityInput');
const levelInput = document.getElementById('levelInput');
const powerInput = document.getElementById('powerInput');
const speedInput = document.getElementById('speedInput');
const trickInput = document.getElementById('trickInput');
const recoveryInput = document.getElementById('recoveryInput');
const defenseInput = document.getElementById('defenseInput');
const colorPicker = document.getElementById('colorPicker');

/* === Fix radar scale center === */
const fixedCenterPlugin = {
  id: 'fixedCenter',
  afterLayout(chart) {
    const opt = chart.config.options.fixedCenter;
    if (!opt?.enabled) return;
    const rScale = chart.scales.r;
    if (!rScale) return;
    rScale.xCenter += (opt.dx ?? 0);
    rScale.yCenter += (opt.dy ?? 0);
  }
};

/* === Gradient pentagon background === */
const radarBackgroundPlugin = {
  id: 'customPentagonBackground',
  beforeDraw(chart) {
    const opts = chart.config.options.customBackground;
    if (!opts?.enabled) return;
    const r = chart.scales.r;
    const ctx = chart.ctx;
    const cx = r.xCenter;
    const cy = r.yCenter;
    const radius = r.drawingArea;
    const N = chart.data.labels.length;
    const start = -Math.PI / 2;

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gradient.addColorStop(0, '#f8fcff');
    gradient.addColorStop(0.25, '#92dfec');
    gradient.addColorStop(1, '#92dfec');

    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const a = start + (i * 2 * Math.PI / N);
      const x = cx + radius * Math.cos(a);
      const y = cy + radius * Math.sin(a);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = '#184046';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Spokes
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const a = start + (i * 2 * Math.PI / N);
      const x = cx + radius * Math.cos(a);
      const y = cy + radius * Math.sin(a);
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#6db5c0';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }
};

/* === Outlined axis labels === */
const outlinedLabelsPlugin = {
  id: 'outlinedLabels',
  afterDraw(chart) {
    if (!chart?.config?.options?.outlinedLabels?.enabled) return;
    const ctx = chart.ctx;
    const r = chart.scales.r;
    const labels = chart.data.labels;
    const cx = r.xCenter;
    const cy = r.yCenter;
    const radius = r.drawingArea + 20;
    const base = -Math.PI / 2;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'italic 16px Candara';
    ctx.lineWidth = 4;
    ctx.strokeStyle = chartColor;
    ctx.fillStyle = 'white';

    labels.forEach((label, i) => {
      const angle = base + (i * 2 * Math.PI / labels.length);
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      ctx.strokeText(label, x, y);
      ctx.fillText(label, x, y);
    });
    ctx.restore();
  }
};

/* === Chart factory === */
function makeRadar(ctx, maxCap = null, showPoints = true, withBackground = false, fixed = false) {
  return new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Power', 'Speed', 'Trick', 'Recovery', 'Defense'],
      datasets: [{
        data: [0, 0, 0, 0, 0],
        backgroundColor: 'transparent',
        borderColor: '#92dfec',
        borderWidth: 2,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#92dfec',
        pointRadius: showPoints ? 5 : 0
      }]
    },
    options: {
      scales: {
        r: {
          grid: { display: false },
          angleLines: { color: '#6db5c0', lineWidth: 1 },
          suggestedMin: 0,
          suggestedMax: maxCap ?? undefined,
          ticks: { display: false },
          pointLabels: { display: false }
        }
      },
      customBackground: { enabled: withBackground },
      outlinedLabels: { enabled: true },
      fixedCenter: { enabled: fixed, dx: CHART2_CENTER_DX, dy: CHART2_CENTER_DY },
      plugins: { legend: { display: false } },
      responsive: true,
      maintainAspectRatio: false
    },
    plugins: [fixedCenterPlugin, radarBackgroundPlugin, outlinedLabelsPlugin]
  });
}

/* === Init Chart 1 === */
window.addEventListener('load', () => {
  const ctx1 = document.getElementById('radarChart1').getContext('2d');
  radar1 = makeRadar(ctx1, null, true, false, false);
});

function hexToRGBA(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* === Update Charts === */
document.getElementById('updateBtn').addEventListener('click', () => {
  const vals = [
    parseFloat(powerInput.value) || 0,
    parseFloat(speedInput.value) || 0,
    parseFloat(trickInput.value) || 0,
    parseFloat(recoveryInput.value) || 0,
    parseFloat(defenseInput.value) || 0
  ];
  const capped = vals.map(v => Math.min(v, 10));
  chartColor = colorPicker.value;
  const fill = hexToRGBA(chartColor, 0.75);

  radar1.data.datasets[0].data = vals;
  radar1.data.datasets[0].borderColor = chartColor;
  radar1.data.datasets[0].backgroundColor = fill;
  radar1.update();

  if (radar2Ready) {
    radar2.data.datasets[0].data = capped;
    radar2.data.datasets[0].borderColor = chartColor;
    radar2.data.datasets[0].backgroundColor = fill;
    radar2.update();
  }

  document.getElementById('dispName').textContent = nameInput.value || '-';
  document.getElementById('dispAbility').textContent = abilityInput.value || '-';
  document.getElementById('dispLevel').textContent = levelInput.value || '-';
});

/* === Overlay Controls === */
const overlay = document.getElementById('overlay');
const viewBtn = document.getElementById('viewBtn');
const closeBtn = document.getElementById('closeBtn');
const downloadBtn = document.getElementById('downloadBtn');

viewBtn.addEventListener('click', () => {
  overlay.classList.remove('hidden');
  document.getElementById('overlayImg').src = document.getElementById('uploadedImg').src;
  document.getElementById('overlayName').textContent = nameInput.value || '-';
  document.getElementById('overlayAbility').textContent = abilityInput.value || '-';
  document.getElementById('overlayLevel').textContent = levelInput.value || '-';

  setTimeout(() => {
    const ctx2 = document.getElementById('radarChart2').getContext('2d');
    if (!radar2Ready) {
      radar2 = makeRadar(ctx2, 10, false, true, true);
      radar2Ready = true;
    } else radar2.resize();

    const vals = [
      parseFloat(powerInput.value) || 0,
      parseFloat(speedInput.value) || 0,
      parseFloat(trickInput.value) || 0,
      parseFloat(recoveryInput.value) || 0,
      parseFloat(defenseInput.value) || 0
    ].map(v => Math.min(v, 10));

    const fill = hexToRGBA(chartColor, 0.75);
    radar2.data.datasets[0].data = vals;
    radar2.data.datasets[0].borderColor = chartColor;
    radar2.data.datasets[0].backgroundColor = fill;
    radar2.update();
  }, 150);
});

closeBtn.addEventListener('click', () => overlay.classList.add('hidden'));

/* === Download without button === */
downloadBtn.addEventListener('click', () => {
  const btn = document.getElementById('downloadBtn');
  btn.style.display = 'none';
