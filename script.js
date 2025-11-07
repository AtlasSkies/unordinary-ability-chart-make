let radar1, radar2;
let radar2Ready = false;
let chartColor = '#92dfec';

const nameInput = document.getElementById('nameInput');
const abilityInput = document.getElementById('abilityInput');
const levelInput = document.getElementById('levelInput');
const powerInput = document.getElementById('powerInput');
const speedInput = document.getElementById('speedInput');
const trickInput = document.getElementById('trickInput');
const recoveryInput = document.getElementById('recoveryInput');
const defenseInput = document.getElementById('defenseInput');
const colorPicker = document.getElementById('colorPicker');

function makeRadar(ctx, maxCap = null, showPoints = true, withBackground = false) {
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
          pointLabels: {
            color: () => chartColor,
            font: { family: 'Candara', style: 'italic', size: 16 }
          }
        }
      },
      plugins: { legend: { display: false } },
      animation: { duration: 400 },
      responsive: true,
      maintainAspectRatio: false
    },
    plugins: [{
      id: 'customPentagonBackground',
      beforeDraw(chart) {
        if (!withBackground) return;
        const { ctx, chartArea } = chart;
        const centerX = (chartArea.left + chartArea.right) / 2;
        const centerY = (chartArea.top + chartArea.bottom) / 2 + 10; // shifted slightly down
        const radius = Math.min(chartArea.width, chartArea.height) / 2 * 0.9;

        // Gradient background
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, '#f8fcff');
        gradient.addColorStop(0.25, '#92dfec');
        gradient.addColorStop(1, '#92dfec');

        // Draw pentagon background
        ctx.save();
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (Math.PI / 2) + (i * 2 * Math.PI / 5);
          const x = centerX + radius * Math.cos(angle);
          const y = centerY - radius * Math.sin(angle);
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = '#184046';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw spokes
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (Math.PI / 2) + (i * 2 * Math.PI / 5);
          const x = centerX + radius * Math.cos(angle);
          const y = centerY - radius * Math.sin(angle);
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = '#6db5c0';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }
    }]
  });
}

// Chart 1: Transparent
window.addEventListener('load', () => {
  const ctx1 = document.getElementById('radarChart1').getContext('2d');
  radar1 = makeRadar(ctx1, null, true, false);
});

function hexToRGBA(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// Update
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
  const fillColor = hexToRGBA(chartColor, 0.75);

  radar1.data.datasets[0].data = vals;
  radar1.data.datasets[0].borderColor = chartColor;
  radar1.data.datasets[0].backgroundColor = fillColor;
  radar1.options.scales.r.pointLabels.color = chartColor;
  radar1.update();

  if (radar2Ready) {
    radar2.data.datasets[0].data = capped;
    radar2.data.datasets[0].borderColor = chartColor;
    radar2.data.datasets[0].backgroundColor = fillColor;
    radar2.options.scales.r.pointLabels.color = chartColor;
    radar2.update();
  }

  document.getElementById('dispName').textContent = nameInput.value || '-';
  document.getElementById('dispAbility').textContent = abilityInput.value || '-';
  document.getElementById('dispLevel').textContent = levelInput.value || '-';
});

// Overlay
const overlay = document.getElementById('overlay');
const viewBtn = document.getElementById('viewBtn');
const closeBtn = document.getElementById('closeBtn');
const downloadBtn = document.getElementById('downloadBtn');

viewBtn.addEventListener('click', () => {
  overlay.classList.remove('hidden');

  document.getElementById('overlayImg').src = document.getElementById('uploadedImg').src;
  document.getElementById('overlayName').textContent = nameInput.value || '-';
  document.get
