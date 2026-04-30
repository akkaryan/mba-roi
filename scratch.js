const fs = require('fs');

function calcEMI(principal, annualRatePct, months) {
  const mr = annualRatePct / 100 / 12;
  if (mr === 0) return principal / months;
  return principal * mr * Math.pow(1 + mr, months) / (Math.pow(1 + mr, months) - 1);
}

function simulateBaseline(inputs) {
  const { currentInvL, cashL, mfReturnPct, expGrowthPct, startYear, baseCTC, baseInhand, baseGrowth, baseExpL } = inputs;
  const ir = mfReturnPct / 100 / 12;
  const SIM_YEARS = 13;
  const SIM_MONTHS = SIM_YEARS * 12;
  let corpus = currentInvL + cashL;
  const nwArr = [], corpArr = [], salA = [], expA = [], savA = [];
  const R = v => Math.round(v * 10) / 10;
  nwArr.push(R(corpus));
  for (let m = 1; m <= SIM_MONTHS; m++) {
    const yW = Math.floor((m - 1) / 12);
    const inhand = (baseCTC * baseInhand / 100 / 12) * Math.pow(1 + baseGrowth / 100, yW);
    const monthlyExp = baseExpL * Math.pow(1 + expGrowthPct / 100, yW);
    const sav = inhand - monthlyExp;
    corpus = corpus * (1 + ir) + sav;
    if (m % 12 === 0) nwArr.push(R(corpus));
  }
  return { nwArr };
}

function simulate(inputs, scenario, baseline) {
  const { totalFeesL, loanL, loanRatePct, mbaDuration, currentInvL, cashL, mbaMonthlyL, mfReturnPct, repayYears, expGrowthPct, startYear } = inputs;
  const { startingCTC, inhandPct, salaryGrowthPct, baseExpL } = scenario;

  const MR = loanRatePct / 100 / 12;
  const ir = mfReturnPct / 100 / 12;
  const loanAtRepay = loanL * (1 + (loanRatePct / 100) * mbaDuration);
  const n = repayYears * 12;
  const emi = calcEMI(loanAtRepay, loanRatePct, n);
  const mbaTotalMonths = mbaDuration * 12;
  const SIM_MONTHS = 13 * 12;

  let corpus = currentInvL + cashL - Math.max(0, totalFeesL - loanL);
  let loan = 0, repayM = 0;
  const nwArr = [];
  nwArr.push(corpus);

  for (let m = 1; m <= SIM_MONTHS; m++) {
    if (m <= mbaTotalMonths) {
      loan = loanAtRepay * m / mbaTotalMonths;
      corpus = corpus * (1 + ir) - mbaMonthlyL;
    } else {
      if (m === mbaTotalMonths + 1) loan = loanAtRepay;
      repayM++;
      const yW = Math.floor((m - mbaTotalMonths - 1) / 12);
      const inhand = (startingCTC * inhandPct / 100 / 12) * Math.pow(1 + salaryGrowthPct / 100, yW);
      const monthlyExp = baseExpL * Math.pow(1 + expGrowthPct / 100, yW);
      const cEMI = repayM <= n ? emi : 0;
      const sav = inhand - monthlyExp - cEMI;
      corpus = corpus * (1 + ir) + sav;
      if (repayM <= n && loan > 0) {
        loan = Math.max(0, loan - (emi - loan * MR));
      } else {
        loan = 0;
      }
    }
    if (m % 12 === 0) nwArr.push(corpus - loan);
  }

  let breakEvenIdx = nwArr.findIndex((v, i) => i > 0 && v >= baseline.nwArr[i]);
  return { breakEvenYear: breakEvenIdx > 0 ? startYear + breakEvenIdx : null, nwArr };
}

const inputs = {
  totalFeesL: 35, loanL: 35, loanRatePct: 7, mbaDuration: 2, currentInvL: 30, cashL: 3,
  mbaMonthlyL: 2 / 100, baseCTC: 15, baseInhand: 100, baseGrowth: 8, baseExpL: 0.2,
  mfReturnPct: 10, repayYears: 7, expGrowthPct: 6.5, startYear: 2026
};

const baseline = simulateBaseline(inputs);
console.log("Baseline NW:", baseline.nwArr);

[ 
  { startingCTC: 24, inhandPct: 75, salaryGrowthPct: 10, baseExpL: 0.3 },
  { startingCTC: 30, inhandPct: 72, salaryGrowthPct: 8, baseExpL: 0.4 },
  { startingCTC: 38, inhandPct: 72, salaryGrowthPct: 7, baseExpL: 0.5 }
].forEach((sc, i) => {
  const res = simulate(inputs, sc, baseline);
  console.log(`Sc ${i+1} NW:`, res.nwArr.map(v => Math.round(v)));
  console.log(`Sc ${i+1} BE:`, res.breakEvenYear);
});
