const SCENARIO_DEFAULTS = [
  { label: 'Conservative', startingCTC: 28, inhandPct: 72, salaryGrowthPct: 8,  baseExpL: 0.065, color: '#2563EB', corpColor: '#93C5FD' },
  { label: 'Moderate',     startingCTC: 35, inhandPct: 73, salaryGrowthPct: 10, baseExpL: 0.075, color: '#059669', corpColor: '#6EE7B7' },
  { label: 'Aggressive',   startingCTC: 50, inhandPct: 74, salaryGrowthPct: 12, baseExpL: 0.090, color: '#7C3AED', corpColor: '#C4B5FD' },
];

let wChart = null, fChart = null, oChart = null, activeScen = 0, lastResults = null, lastBaseline = null;

function num(id) { return parseFloat(document.getElementById(id).value) || 0; }
function str(id) { return document.getElementById(id).value.trim(); }

function saveInputs() {
  const data = {};
  document.querySelectorAll('input').forEach(el => {
    data[el.id] = el.value;
  });
  localStorage.setItem('mbaRoiInputs', JSON.stringify(data));
}

function loadInputs() {
  const params = new URLSearchParams(window.location.search);
  const hasUrlParams = params.toString().length > 0;
  
  let storedData = null;
  if (!hasUrlParams) {
    try { storedData = JSON.parse(localStorage.getItem('mbaRoiInputs')); } catch(e) {}
  }

  document.querySelectorAll('input').forEach(el => {
    if (hasUrlParams && params.has(el.id)) {
      el.value = params.get(el.id);
    } else if (!hasUrlParams && storedData && storedData[el.id] !== undefined) {
      el.value = storedData[el.id];
    } else {
      if (el.placeholder && !el.placeholder.includes('e.g.')) el.value = el.placeholder;
      else if (el.placeholder && el.id.includes('Label')) el.value = el.placeholder.replace('e.g. ', '');
    }
  });
}

function copyLink(btn) {
  saveInputs();
  const params = new URLSearchParams();
  document.querySelectorAll('input').forEach(el => params.set(el.id, el.value));
  const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  navigator.clipboard.writeText(url).then(() => {
    const originalText = btn.innerHTML;
    btn.innerHTML = '✓ Copied!';
    setTimeout(() => btn.innerHTML = originalText, 2000);
  }).catch(() => {
    prompt("Copy this link to share:", window.location.href);
  });
}

function downloadCSV() {
  if (!lastResults) return;
  const inputs = getInputs();
  const startYear = inputs.startYear;
  
  let csv = 'Year,Scenario,Salary In-Hand (L),Total Expenses (L),Loan EMI (L),Net Savings (L),Loan Outstanding (L),Investment Corpus (L),Net Worth (L)\n';
  
  lastResults.forEach(r => {
    for(let i = 0; i < r.nwArr.length; i++) {
      const year = startYear + i;
      const scen = r.label;
      const sal = r.salA[i];
      const exp = r.expA[i];
      const emi = r.emiA[i];
      const sav = r.savA[i];
      const loan = r.loanArr[i];
      const corp = r.corpArr[i];
      const nw = r.nwArr[i];
      
      csv += `${year},${scen},${sal},${exp},${emi},${sav},${loan},${corp},${nw}\n`;
    }
  });

  if (lastBaseline) {
    for(let i = 0; i < lastBaseline.nwArr.length; i++) {
      const year = startYear + i;
      const scen = lastBaseline.label;
      const sal = lastBaseline.salA[i];
      const exp = lastBaseline.expA[i];
      const emi = 0; // No MBA loan in baseline
      const sav = lastBaseline.savA[i];
      const loan = 0;
      const corp = lastBaseline.corpArr[i];
      const nw = lastBaseline.nwArr[i];
      
      csv += `${year},${scen},${sal},${exp},${emi},${sav},${loan},${corp},${nw}\n`;
    }
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', 'mba_roi_projection.csv');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function resetDefaults() {
  if (!confirm('Are you sure you want to reset all inputs to their defaults?')) return;
  localStorage.removeItem('mbaRoiInputs');
  window.location.href = window.location.pathname;
}

function dismissBanner() {
  const el = document.getElementById('onboardingBanner');
  if (el) el.style.display = 'none';
  localStorage.setItem('mbaRoiBannerDismissed', 'true');
}


function fmt(n) {
  return Number(n).toLocaleString('en-IN', { maximumFractionDigits: 1 });
}

function getInputs() {
  return {
    totalFeesL:   num('totalFees'),
    loanL:        num('loanAmount'),
    loanRatePct:  num('loanRate'),
    mbaDuration:  num('mbaDuration'),
    currentInvL:  num('currentInv'),
    cashL:        num('cashSavings'),
    mbaMonthlyL:  num('mbaMonthly') / 100,
    mfReturnPct:  num('mfReturn'),
    repayYears:   Math.max(0.1, num('repayYears')),
    expGrowthPct: num('expGrowth'),
    startYear:    new Date().getFullYear(),
    baseCTC:      num('baseCTC'),
    baseInhand:   num('baseInhand'),
    baseGrowth:   num('baseGrowth'),
    baseExpL:     num('baseExp'),
  };
}

function getScenarios() {
  return [1, 2, 3].map((n, i) => ({
    label:          str(`sc${n}Label`) || `Scenario ${n}`,
    startingCTC:    num(`sc${n}CTC`),
    inhandPct:      num(`sc${n}Inhand`),
    salaryGrowthPct:num(`sc${n}Growth`),
    baseExpL:       num(`sc${n}Exp`) / 100,
    color:          SCENARIO_DEFAULTS[i].color,
    corpColor:      SCENARIO_DEFAULTS[i].corpColor,
  }));
}

function dark() { return window.matchMedia('(prefers-color-scheme: dark)').matches; }

function cDef() {
  const d = dark();
  return {
    gc: d ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
    tc: d ? 'rgba(255,255,255,0.5)'  : 'rgba(0,0,0,0.45)',
    tt: {
      backgroundColor: d ? '#1F2937' : '#fff',
      titleColor:      d ? '#F9FAFB' : '#111827',
      bodyColor:       d ? 'rgba(249,250,251,0.7)' : 'rgba(17,24,39,0.65)',
      borderColor:     d ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
      borderWidth: 1, 
      padding: window.innerWidth < 600 ? 8 : 10, 
      cornerRadius: 8,
      bodyFont: { size: window.innerWidth < 600 ? 11 : 12 },
      titleFont: { size: window.innerWidth < 600 ? 12 : 13 },
      boxPadding: 4
    }
  };
}

const shadePl = {
  id: 'shade',
  beforeDraw(c) {
    const { ctx, chartArea: { top, bottom }, scales: { x } } = c;
    const inputs = getInputs();
    const x0 = x.getPixelForValue(0);
    const x1 = x.getPixelForValue(inputs ? inputs.mbaDuration : 2);
    ctx.save();
    ctx.fillStyle = dark() ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
    ctx.fillRect(x0, top, x1 - x0, bottom - top);
    ctx.restore();
  }
};

function externalTooltipHandler(context) {
  const {chart, tooltip} = context;
  const isFlow = chart.canvas.id === 'flowChart';
  const panel = document.getElementById(isFlow ? 'flowHoverPanel' : 'wealthHoverPanel');

  if (tooltip.opacity === 0) {
    panel.style.display = 'none';
    return;
  }

  panel.style.display = 'grid';

  const titleLines = tooltip.title || [];
  const bodyLines = tooltip.body.map(b => b.lines);

  let html = `<div class="hover-panel-title">Year ${titleLines[0] || ''}</div>`;
  
  bodyLines.forEach((body, i) => {
    const colors = tooltip.labelColors[i];
    html += `
      <div class="hover-panel-item">
        <span class="hover-panel-color" style="background:${colors.backgroundColor}; border: 1px solid ${colors.borderColor}"></span>
        <span>${body}</span>
      </div>
    `;
  });

  panel.innerHTML = html;
}

function renderWealthChart(results, labels) {
  const { gc, tc, tt } = cDef();
  const datasets = [
    ...results.map(r => ({
      label: 'Net worth · ' + r.label, data: r.nwArr,
      borderColor: r.color,
      backgroundColor: (context) => {
        const chart = context.chart;
        const {ctx, chartArea} = chart;
        if (!chartArea) return null;
        const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        g.addColorStop(0, r.color + '33');
        g.addColorStop(1, r.color + '00');
        return g;
      },
      fill: true,
      borderWidth: 2.5, pointRadius: ctx => [0, getInputs().mbaDuration, 12].includes(ctx.dataIndex) ? 4 : 2,
      pointBackgroundColor: r.color, cubicInterpolationMode: 'monotone', order: 1
    })),
    {
      label: 'Loan outstanding', data: results[0].loanArr,
      borderColor: '#EF4444', backgroundColor: 'transparent',
      borderWidth: 2, pointRadius: 2, pointBackgroundColor: '#EF4444', cubicInterpolationMode: 'monotone', order: 1
    }
  ];
  if (wChart) wChart.destroy();
  wChart = new Chart(document.getElementById('wealthChart'), {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: { ...tt, 
          enabled: window.innerWidth >= 768,
          external: window.innerWidth < 768 ? externalTooltipHandler : undefined,
          callbacks: {
          title: a => String(a[0].label),
          label: c => ` ${c.dataset.label.replace('Net worth · ', '')}: ₹${fmt(c.parsed.y)}L`
        }}
      },
      scales: {
        x: { ticks: { color: tc, font: { size: 11 }, maxRotation: 0 }, grid: { color: gc }, border: { display: false } },
        y: { ticks: { color: tc, font: { size: 11 }, callback: v => '₹' + fmt(v) + 'L' }, grid: { color: gc }, border: { display: false } }
      }
    },
    plugins: [shadePl]
  });
}

function renderFlowChart(results, labels) {
  const r = results[activeScen];
  const { gc, tc, tt } = cDef();
  const datasets = [
    { label: 'Salary in-hand',  data: r.salA, borderColor: '#059669', backgroundColor: 'transparent', borderWidth: 2.5, pointRadius: 2, pointBackgroundColor: '#059669', cubicInterpolationMode: 'monotone' },
    { label: 'Total expenses',  data: r.expA, borderColor: '#EF4444', backgroundColor: 'transparent', borderWidth: 2.5, pointRadius: 2, pointBackgroundColor: '#EF4444', cubicInterpolationMode: 'monotone' },
    { label: 'Loan EMI',        data: r.emiA, borderColor: '#D97706', backgroundColor: 'transparent', borderWidth: 2.5, pointRadius: 2, pointBackgroundColor: '#D97706', cubicInterpolationMode: 'monotone' },
    { label: 'Net savings → MF',data: r.savA, borderColor: '#2563EB', backgroundColor: 'transparent', borderWidth: 2.5, pointRadius: 2, pointBackgroundColor: '#2563EB', cubicInterpolationMode: 'monotone' },
  ];
  if (fChart) fChart.destroy();
  fChart = new Chart(document.getElementById('flowChart'), {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: { ...tt, 
          enabled: window.innerWidth >= 768,
          external: window.innerWidth < 768 ? externalTooltipHandler : undefined,
          callbacks: {
          title: a => String(a[0].label),
          label: c => ` ${c.dataset.label}: ₹${fmt(c.parsed.y)}L/yr`
        }}
      },
      scales: {
        x: { ticks: { color: tc, font: { size: 11 }, maxRotation: 0 }, grid: { color: gc }, border: { display: false } },
        y: { ticks: { color: tc, font: { size: 11 }, callback: v => '₹' + fmt(v) + 'L' }, grid: { color: gc }, border: { display: false } }
      }
    },
    plugins: [shadePl]
  });
}

function renderOppChart(results, baseline, labels) {
  const { gc, tc, tt } = cDef();
  const datasets = results.map(r => ({
    label: r.label, data: r.nwArr, borderColor: r.color, backgroundColor: 'transparent', borderWidth: 2.5, pointRadius: 2, pointBackgroundColor: r.color, cubicInterpolationMode: 'monotone'
  }));
  datasets.push({
    label: baseline.label, data: baseline.nwArr, borderColor: '#6B7280', borderDash: [5, 5], backgroundColor: 'transparent', borderWidth: 2.5, pointRadius: 2, pointBackgroundColor: '#6B7280', cubicInterpolationMode: 'monotone'
  });

  if (oChart) oChart.destroy();
  oChart = new Chart(document.getElementById('oppChart'), {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: { ...tt, 
          enabled: window.innerWidth >= 768,
          external: window.innerWidth < 768 ? function(c) {
            c.chart.canvas.id = 'oppChart'; // Hack to reuse externalTooltipHandler logic
            externalTooltipHandler(c, 'oppHoverPanel');
          } : undefined,
          callbacks: {
          title: a => String(a[0].label),
          label: c => ` ${c.dataset.label}: ₹${fmt(c.parsed.y)}L`
        }}
      },
      scales: {
        x: { ticks: { color: tc, font: { size: 11 }, maxRotation: 0 }, grid: { color: gc }, border: { display: false } },
        y: { ticks: { color: tc, font: { size: 11 }, callback: v => '₹' + fmt(v) + 'L' }, grid: { color: gc }, border: { display: false } }
      }
    },
    plugins: [shadePl]
  });
}

function renderMetrics(results) {
  const el = document.getElementById('metricCards');
  const COLORS = ['#2563EB', '#059669', '#7C3AED'];
  el.innerHTML = results.map((r, i) => `
    <div class="metric-card" style="--accent:${COLORS[i]}">
      <div class="mc-header">
        <span class="mc-label">${r.label} <span class="info-btn" data-tip="Projected final outcome for this career scenario">ⓘ</span></span>
        <span class="mc-emi">EMI ₹${fmt(r.emi * 100)}k/mo</span>
      </div>
      <div class="mc-grid">
        <div class="mc-item">
          <span class="mc-key">At graduation</span>
          <span class="mc-val ${r.nwAtGrad < 0 ? 'neg' : ''}">${r.nwAtGrad < 0 ? '–' : ''}₹${fmt(Math.abs(r.nwAtGrad))}L</span>
        </div>
        <div class="mc-item">
          <span class="mc-key">5yr post-MBA</span>
          <span class="mc-val">₹${fmt(r.nw5yr)}L</span>
        </div>
        <div class="mc-item">
          <span class="mc-key">10yr corpus <span class="info-btn" data-tip="Total mutual fund balance at year 10 post-MBA">ⓘ</span></span>
          <span class="mc-val">₹${fmt(r.corp10yr)}L</span>
        </div>
        <div class="mc-item">
          <span class="mc-key">Loan cleared</span>
          <span class="mc-val">${r.cleared}</span>
        </div>
        <div class="mc-item" style="background: var(--surface2); padding: 8px; border-radius: 6px; border: 1px solid var(--border);">
          <span class="mc-key" style="color: var(--text); font-weight: 600;">Break-even <span class="info-btn" data-tip="Year when your MBA net worth surpasses what you would have earned staying at your current job">ⓘ</span></span>
          <span class="mc-val" style="color: var(--accent); font-weight: 700;">${r.breakEvenYear || '—'}</span>
        </div>
        <div class="mc-item">
          <span class="mc-key">Total interest paid</span>
          <span class="mc-val">₹${fmt(r.totalInterest)}L</span>
        </div>
      </div>
    </div>
  `).join('');
}

function setScen(i) {
  activeScen = i;
  [0, 1, 2].forEach(j => {
    const btn = document.getElementById('flowBtn' + j);
    btn.className = 'flow-btn' + (j === i ? ' active' : '');
    btn.style.borderColor = j === i ? SCENARIO_DEFAULTS[j].color : '';
    btn.style.color = j === i ? SCENARIO_DEFAULTS[j].color : '';
    btn.style.background = j === i ? (SCENARIO_DEFAULTS[j].color + '12') : '';
  });
  document.getElementById('flowScenLabel').textContent = getScenarios()[i].label;
  document.getElementById('flowScenLabel').textContent = getScenarios()[i].label;
  if (lastResults) {
    const labels = getLabels(new Date().getFullYear(), 14);
    renderFlowChart(lastResults, labels);
  }
}

function calculateTargetCTC(inputs, baseline) {
  const targetYearIdx = inputs.mbaDuration + inputs.repayYears;
  const targetYearNum = inputs.startYear + targetYearIdx;
  
  let low = 0;
  let high = 200;
  let bestCTC = null;
  
  const proxyScenario = {
    label: 'Target', inhandPct: 70, salaryGrowthPct: 10, baseExpL: 0.8, color: '#000', corpColor: '#000'
  };

  for (let i = 0; i < 20; i++) {
    const mid = (low + high) / 2;
    proxyScenario.startingCTC = mid;
    const res = simulate(inputs, proxyScenario, baseline);
    
    if (res.breakEvenYear && res.breakEvenYear <= targetYearNum) {
      bestCTC = mid;
      high = mid;
    } else {
      low = mid;
    }
  }
  
  return { ctc: bestCTC ? Math.round(bestCTC * 10) / 10 : null, year: targetYearNum };
}

function updateBlurb(results) {
  const beVals = results.map(r => parseInt(r.breakEvenYear)).filter(y => !isNaN(y));
  const minBE = beVals.length ? Math.min(...beVals) : '—';
  const maxBE = beVals.length ? Math.max(...beVals) : '—';
  
  const sorted = [...results].sort((a,b) => a.corp10yr - b.corp10yr);
  const worst = sorted[0];
  const best = sorted[sorted.length-1];

  let beStr = '';
  if (minBE !== '—' && minBE !== maxBE) beStr = `between <strong>${minBE}</strong> and <strong>${maxBE}</strong>`;
  else if (minBE !== '—') beStr = `in <strong>${minBE}</strong>`;
  else beStr = `never`;

  const inputs = getInputs();
  const target = calculateTargetCTC(inputs, lastBaseline);
  const tEl = document.getElementById('targetCtcBlurb');
  if (tEl && target.ctc) {
    tEl.innerHTML = `🎯 <strong>Target CTC:</strong> To mathematically beat your Opportunity Cost by the time your loan is repaid (${target.year}), you need a starting post-MBA CTC of approx <strong>₹${target.ctc}L</strong> <em>(assuming 10% annual salary growth)</em>.`;
    tEl.style.display = 'block';
  } else if (tEl) {
    tEl.style.display = 'none';
  }

  const gap = best.corp10yr - worst.corp10yr;
  const gapStr = gap > 0 ? ` Over 10 years, the difference between your <em>${worst.label}</em> and <em>${best.label}</em> trajectory creates a wealth gap of <strong>₹${fmt(gap)}L</strong>.` : '';

  const html = `💡 <strong>Chart Insights:</strong> The red line shows your loan balance. Your true ROI break-even point (when your MBA wealth surpasses your Current Job trajectory) happens ${beStr}.${gapStr}`;
  
  const el = document.getElementById('dynamicBlurb');
  if (el) {
    el.innerHTML = html;
    el.style.display = 'block';
  }
}

window.showTab = function(idx, btn) {
  document.querySelectorAll('.sc-tab').forEach((t, i) => {
    t.classList.toggle('active', i === idx);
    t.style.borderBottomColor = i === idx ? ['#2563EB','#059669','#7C3AED'][i] : 'transparent';
    t.style.color = i === idx ? ['#2563EB','#059669','#7C3AED'][i] : '';
    t.style.background = i === idx ? ['#EFF6FF','#F0FDF4','#F5F3FF'][i] : 'transparent';
  });
  document.querySelectorAll('.sc-panel').forEach((p, i) => p.classList.toggle('active', i === idx));
};

const shownToasts = new Set();
function showToast(id, msg) {
  if (shownToasts.has(id)) return;
  shownToasts.add(id);
  
  const container = document.getElementById('toastContainer');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = 'toast-msg';
  toast.innerHTML = msg;
  container.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 50);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

function checkRealityChecks(inputs, scenarios) {
  if (inputs.mfReturnPct > 18) showToast('mf', 'Are you Warren Buffett or just highly optimistic? 🤡');
  if (inputs.mbaMonthlyL > 1.5 || inputs.totalFeesL > 120) showToast('exp', 'That is an aggressive amount of avocado toast. 🥑');
  if (inputs.loanL > 50) showToast('loan', 'Debt trap incoming. Pray for a big signing bonus. 🏦');
  if (scenarios.some(s => s.startingCTC > 75)) showToast('mbb', 'MBB Partner track detected. Calm down, Elon. 📈');
}

function render() {
  const inputs = getInputs();
  const scenarios = getScenarios();
  const baseline = simulateBaseline(inputs);
  const labels = getLabels(inputs.startYear, 14);
  const results = scenarios.map(s => simulate(inputs, s, baseline));
  
  lastResults = results;
  lastBaseline = baseline;
  
  renderWealthChart(results, labels);
  renderOppChart(results, baseline, labels);
  renderFlowChart(results, labels);
  renderMetrics(results);
  updateBlurb(results);
  checkRealityChecks(inputs, scenarios);

  // On mobile, pulse the Results tab when user is still on Inputs tab
  if (window.innerWidth <= 900) {
    const rBtn = document.getElementById('mobileTabResults');
    if (rBtn && !rBtn.classList.contains('active')) {
      rBtn.setAttribute('data-updated', '');
    }
  }
}

function debounce(fn, ms) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

document.addEventListener('DOMContentLoaded', () => {
  loadInputs();

  // Show onboarding banner once per browser
  if (!localStorage.getItem('mbaRoiBannerDismissed')) {
    const banner = document.getElementById('onboardingBanner');
    if (banner) banner.style.display = 'flex';
  }

  // Touch support for info-btn tooltips (hover doesn't work on mobile)
  document.addEventListener('click', e => {
    const btn = e.target.closest('.info-btn');
    document.querySelectorAll('.info-btn.touch-open').forEach(b => {
      if (b !== btn) b.classList.remove('touch-open');
    });
    if (btn) { e.stopPropagation(); btn.classList.toggle('touch-open'); }
  });

  const debouncedRender = debounce(() => {
    saveInputs();
    render();
  }, 250);
  document.querySelectorAll('input').forEach(el => el.addEventListener('input', debouncedRender));
  render();
});
