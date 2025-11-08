let radar1, radar2;
let chartColor = '#92dfec';

function hexToRGBA(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* === Chart.js Plugins === */

// Outlined Axis Labels (Colored Outline, White Fill)
const outlinedLabelsPlugin = {
  id: 'outlinedLabels',
  afterDraw(chart) {
    if (chart.canvas.id === 'radarChart2' || chart.canvas.id === 'radarChart1') {
      const ctx = chart.ctx;
      const r = chart.scales.r;
      const labels = chart.data.labels;
      const cx = r.xCenter;
      const cy = r.yCenter;
      
      const isMainChart = chart.canvas.id === 'radarChart1';
      // Fetch values for the main chart, ensuring numbers are capped at 10 for display consistency, 
      const statValues = isMainChart ? getStatValues().map(val => Math.min(val, 10)) : [];

      const baseRadius = r.drawingArea * 1.1 + 10;
      const base = -Math.PI / 2;

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'italic 18px Candara';

      ctx.strokeStyle = chartColor; 
      ctx.fillStyle = 'white';
      ctx.lineWidth = 4;

      labels.forEach((label, i) => {
        let angle = base + (i * 2 * Math.PI / labels.length);

        if (label === 'Defense') {
          angle -= 0.08;
        } else if (label === 'Speed') {
          angle += 0.05;
        }

        const x = cx + baseRadius * Math.cos(angle);
        const y = cy + baseRadius * Math.sin(angle);
        
        // Append stat value for the main chart
        let displayLabel = label;
        if (isMainChart) {
             const stat = statValues[i];
             displayLabel += ` (${stat.toFixed(1)})`; // Display with one decimal place for consistency
        }

        ctx.strokeText(displayLabel, x, y);
        ctx.fillText(displayLabel, x, y);
      });
      ctx.restore();
    }
  }
};


// Pentagon background + gradient + border
const radarBackgroundPlugin = {
  id: 'customBackground',
  beforeDraw(chart, args, options) {
    if (chart.canvas.id !== 'radarChart2') return;

    const ctx = chart.ctx;
    const r = chart.scales.r;
    const cx = r.xCenter;
    const cy = r.yCenter;
    const radius = r.drawingArea;
    const N = chart.data.labels.length;
    const start = -Math.PI / 2;

    // Gradient: light (#f8fcff) in center to dark (chartColor) on outside, hard stop at 40%
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    const currentColor = window.chartColor || '#92dfec';
    
    gradient.addColorStop(0, '#f8fcff');
    gradient.addColorStop(0.4, currentColor);
    gradient.addColorStop(1, currentColor); 

    ctx.save();

    // Draw Pentagon Fill
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

    // Draw Spokes
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const a = start + (i * 2 * Math.PI / N);
      const x = cx + radius * Math.cos(a);
      const y = cy + radius * Math.sin(a);
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#35727d';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  },
  afterDatasetsDraw(chart, args, options) {
    if (chart.canvas.id !== 'radarChart2') return;

    const ctx = chart.ctx;
    const r = chart.scales.r;
    const radius = r.drawingArea;
    const N = chart.data.labels.length;
    const start = -Math.PI / 2;

    ctx.save();

    // Outer pentagon border
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const a = start + (i * 2 * Math.PI / N);
      const x = r.xCenter + radius * Math.cos(a);
      const y = r.yCenter + radius * Math.sin(a);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = '#184046';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }
};

Chart.register(radarBackgroundPlugin, outlinedLabelsPlugin);

function makeRadar(ctx, isOverlayChart = false) {
  const currentColor = document.getElementById('colorPicker').value || '#92dfec';
  
  // Set point radius based on whether it's the overlay chart (0) or the main chart (4)
  const pointR = isOverlayChart ? 0 : 4; 

  return new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Power', 'Speed', 'Trick', 'Recovery', 'Defense'],
      datasets: [{
        data: [0, 0, 0, 0, 0],
        backgroundColor: hexToRGBA(currentColor, 0.75),
        borderColor: currentColor,
        borderWidth: 2,
        pointRadius: pointR, // FIX: Use calculated point radius
        pointBackgroundColor: '#fff',
        pointBorderColor: currentColor
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          min: 0,
          max: 10,
          ticks: {
            display: false,
          },
          grid: { display: false },
          angleLines: { color: '#6db5c0' },
          pointLabels: {
            font: { family: 'Candara', size: 16 },
            color: 'transparent'
          }
        }
      },
      plugins: {
        legend: { display: false },
        customBackground: { enabled: isOverlayChart },
        // FIX: Enable tooltips only for the overlay chart (where the main chart custom labels aren't shown)
        tooltip: {
            enabled: isOverlayChart, 
            callbacks: {
                // Ensure the tooltip label shows the category name and the score
                label: function(context) {
                    let label = context.dataset.label || '';
                    if (label) {
                        label += ': ';
                    }
                    if (context.parsed.r !== null) {
                        label += context.label + ': ' + context.parsed.r.toFixed(1);
                    }
                    return label;
                }
            }
        }
      }
    },
    plugins: []
  });
}

const inputs = ['powerInput', 'speedInput', 'trickInput', 'recoveryInput', 'defenseInput'];
const colorPicker = document.getElementById('colorPicker');
const viewBtn = document.getElementById('viewBtn');
const overlay = document.getElementById('overlay');
const closeBtn = document.getElementById('closeBtn');
const downloadBtn = document.getElementById('downloadBtn');
const uploadedImg = document.getElementById('uploadedImg');
const imgInput = document.getElementById('imgInput');

window.addEventListener('load', () => {
  const ctx1 = document.getElementById('radarChart1').getContext('2d');
  radar1 = makeRadar(ctx1, false);
  updateCharts();
});

function getStatValues() {
  return inputs.map(id => +document.getElementById(id).value || 0);
}

function updateCharts() {
  const vals = getStatValues();
  chartColor = colorPicker.value;
  const fill = hexToRGBA(chartColor, 0.75);
  
  // Create a version of the stats capped at 10 for the overlay chart
  const overlayVals = vals.map(val => Math.min(val, 10));

  // Update Chart 1 (Main page chart)
  radar1.data.datasets[0].data = vals; 
  radar1.data.datasets[0].backgroundColor = fill;
  radar1.data.datasets[0].borderColor = chartColor;
  radar1.update();

  // Update Chart 2 (Overlay chart - data itself is capped at 10)
  if (radar2) {
    radar2.data.datasets[0].data = overlayVals;
    radar2.data.datasets[0].backgroundColor = fill;
    radar2.data.datasets[0].borderColor = chartColor;
    radar2.update();
  }
}

inputs.forEach(id => document.getElementById(id).addEventListener('input', updateCharts));
colorPicker.addEventListener('input', updateCharts);
['nameInput', 'abilityInput', 'levelInput'].forEach(id =>
  document.getElementById(id).addEventListener('input', updateCharts)
);

viewBtn.addEventListener('click', () => {
  overlay.classList.remove('hidden');
  document.getElementById('overlayImg').src = uploadedImg.src;
  document.getElementById('overlayName').textContent = document.getElementById('nameInput').value || '-';
  document.getElementById('overlayAbility').textContent = document.getElementById('abilityInput').value || '-';
  document.getElementById('overlayLevel').textContent = document.getElementById('levelInput').value || '-';
  
  document.getElementById('textWatermark').textContent = 'AS';
  
  const ctx2 = document.getElementById('radarChart2').getContext('2d');

  if (radar2) {
    radar2.destroy();
  }

  radar2 = makeRadar(ctx2, true);
  updateCharts();
});

closeBtn.addEventListener('click', () => overlay.classList.add('hidden'));

downloadBtn.addEventListener('click', () => {
  downloadBtn.style.visibility = 'hidden';
  closeBtn.style.visibility = 'hidden';
  html2canvas(document.getElementById('characterBox'), { scale: 2 }).then(canvas => {
    const link = document.createElement('a');
    link.download = `${document.getElementById('nameInput').value || 'Character'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    downloadBtn.style.visibility = 'visible';
    closeBtn.style.visibility = 'visible';
  });
});

imgInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => { uploadedImg.src = ev.target.result; };
  reader.readAsDataURL(file);
});
