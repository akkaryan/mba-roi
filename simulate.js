function calcEMI(principal, annualRatePct, months) {
  const mr = annualRatePct / 100 / 12;
  if (mr === 0) return principal / months;
  return principal * mr * Math.pow(1 + mr, months) / (Math.pow(1 + mr, months) - 1);
}

function simulate(inputs, scenario) {
  const {
    loanL, loanRatePct, mbaDuration,
    currentInvL, cashL, mbaMonthlyL,
    mfReturnPct, repayYears, expGrowthPct,
    startYear
  } = inputs;

  const { startingCTC, inhandPct, salaryGrowthPct, baseExpL, label, color, corpColor } = scenario;

  const MR = loanRatePct / 100 / 12;
  const ir = mfReturnPct / 100 / 12;
  const loanAtRepay = loanL * (1 + (loanRatePct / 100) * mbaDuration);
  const n = repayYears * 12;
  const emi = calcEMI(loanAtRepay, loanRatePct, n);
  const mbaTotalMonths = mbaDuration * 12;
  const SIM_YEARS = 13;
  const SIM_MONTHS = SIM_YEARS * 12;

  let corpus = currentInvL, loan = 0, repayM = 0, clearedYear = null;
  let aSal = 0, aExp = 0, aEMI = 0, aSav = 0;

  const nwArr = [], corpArr = [], loanArr = [];
  const salA = [], expA = [], emiA = [], savA = [];
  const R = v => Math.round(v * 10) / 10;

  nwArr.push(R(corpus + cashL));
  corpArr.push(R(corpus));
  loanArr.push(0);
  salA.push(0); expA.push(0); emiA.push(0); savA.push(0);

  for (let m = 1; m <= SIM_MONTHS; m++) {
    if (m <= mbaTotalMonths) {
      loan = loanAtRepay * m / mbaTotalMonths;
      corpus = corpus * (1 + ir) - mbaMonthlyL;
      aExp += mbaMonthlyL;
    } else {
      if (m === mbaTotalMonths + 1) loan = loanAtRepay;
      repayM++;
      const yW = Math.floor((m - mbaTotalMonths - 1) / 12);
      const inhand = (startingCTC * inhandPct / 100 / 12) * Math.pow(1 + salaryGrowthPct / 100, yW);
      const monthlyExp = baseExpL * Math.pow(1 + expGrowthPct / 100, yW);
      const cEMI = repayM <= n ? emi : 0;
      const sav = Math.max(0, inhand - monthlyExp - cEMI);
      corpus = corpus * (1 + ir) + sav;
      if (repayM <= n && loan > 0) {
        loan = Math.max(0, loan - (emi - loan * MR));
        if (loan < 0.005 && clearedYear === null)
          clearedYear = startYear + mbaDuration + Math.ceil(repayM / 12);
      } else {
        if (clearedYear === null) clearedYear = startYear + mbaDuration + repayYears;
        loan = 0;
      }
      aSal += inhand; aExp += monthlyExp; aEMI += cEMI; aSav += sav;
    }
    if (m % 12 === 0) {
      nwArr.push(R(corpus - loan));
      corpArr.push(R(corpus));
      loanArr.push(R(loan));
      if (m <= mbaTotalMonths) {
        salA.push(0); expA.push(R(aExp)); emiA.push(0); savA.push(0);
      } else {
        salA.push(R(aSal)); expA.push(R(aExp)); emiA.push(R(aEMI)); savA.push(R(aSav));
      }
      aSal = 0; aExp = 0; aEMI = 0; aSav = 0;
    }
  }

  const startNW = nwArr[0];
  const breakEvenIdx = nwArr.findIndex((v, i) => i > 0 && v >= startNW);

  return {
    label, color, corpColor,
    nwArr, corpArr, loanArr, salA, expA, emiA, savA,
    cleared: clearedYear || startYear + mbaDuration + repayYears,
    breakEvenYear: breakEvenIdx > 0 ? startYear + breakEvenIdx : null,
    emi,
    nwAtGrad: nwArr[mbaDuration],
    nw5yr: nwArr[mbaDuration + 5] || nwArr[nwArr.length - 1],
    nw10yr: nwArr[Math.min(mbaDuration + 10, nwArr.length - 1)],
    corp10yr: corpArr[Math.min(mbaDuration + 10, corpArr.length - 1)],
    totalInterest: R(loanAtRepay - loanL),
  };
}

function getLabels(startYear, count) {
  return Array.from({ length: count }, (_, i) => startYear + i);
}
