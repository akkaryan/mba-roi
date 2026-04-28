# MBA ROI Calculator

Project your post-MBA net worth, investment corpus, and annual cashflow across three customizable career scenarios.

## Features
- Three fully customizable career scenarios (label, CTC, growth, expenses)
- Net worth & MF corpus trajectory over 13 years
- Annual cashflow breakdown (salary, expenses, EMI, savings)
- All savings automatically invested in mutual funds
- Key metrics: break-even year, loan cleared by, 10-year corpus
- Responsive — works on mobile and desktop

## Deploy to Vercel (2 minutes)

### Option A — Vercel CLI
```bash
npm i -g vercel
cd mba-roi
vercel
```
Follow the prompts. Your app will be live at `https://mba-roi-[hash].vercel.app`

### Option B — Drag & Drop
1. Go to [vercel.com/new](https://vercel.com/new)
2. Drag the `mba-roi` folder into the browser
3. Click Deploy

### Option C — GitHub
1. Push this folder to a GitHub repo
2. Connect repo at [vercel.com/new](https://vercel.com/new)
3. Auto-deploys on every push

## Share
Once deployed, copy the Vercel URL and share with peers.
Each person fills in their own numbers — no data is stored.

## Assumptions baked in
- All net savings (salary − expenses − EMI) are invested monthly into MF
- Existing investments also compound at the MF return rate
- Loan interest accrues as simple interest during moratorium
- Expense growth applies compounded year-on-year post-MBA

## Local preview
No build step needed. Just open `index.html` in a browser, or:
```bash
npx serve .
```
