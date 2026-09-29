# Trading Strategy Analytics

Interactive empirical research software for analysing a structured trading journal in normalized **R-multiples**.

**Live application:** https://trading-strategy-analytics.floot.app

## Why I built it

I wanted a research workflow that went beyond displaying a win rate or equity curve. The project focuses on data validation, reproducibility, uncertainty estimation and transparent limitations.

The live application lets a user import journal data, filter the active sample, inspect performance and drawdown, run bootstrap and Monte Carlo analyses, and export reproducibility information.

## What this repository contains

This repository is a public, non-proprietary portfolio snapshot of the analytical core behind the application. It intentionally excludes private trading rules, comments and proprietary journal fields.

- `src/tradingAnalytics.ts` — pure analytics and CSV parsing utilities
- `tests/tradingAnalytics.spec.ts` — tests for drawdown, rolling means, deterministic resampling and CSV parsing
- `data/example_trades.csv` — synthetic example data for exercising the parser
- `METHODOLOGY.md` — modelling assumptions, normalization rules and limitations

## Research workflow

1. **Ingest** structured journal data in the browser.
2. **Validate** required fields and report invalid rows explicitly.
3. **Normalize** outcomes to R-multiples.
4. **Explore** expectancy, profit factor, drawdown, rolling behaviour and subgroups.
5. **Estimate uncertainty** with empirical bootstrap resampling.
6. **Run scenario analysis** with seeded empirical Monte Carlo resampling.
7. **Expose assumptions** rather than treating simulated outcomes as forecasts.

## Normalized trade model

Each valid observation uses:

`date, market, session, outcome, realised_r, entry_tf`

Normalization rules:

- Win: realised R, or planned R/R when realised R is absent
- Loss: -1R
- Break-even: 0R
- Invalid / non-trade rows: excluded and reported

Missing categorical metadata is preserved as `—` rather than invented.

## Statistical methods

The live app includes:

- net R and expectancy
- profit factor
- peak-to-trough maximum drawdown
- rolling expectancy
- subgroup summaries
- empirical bootstrap intervals
- seeded empirical Monte Carlo resampling

Bootstrap and Monte Carlo results are conditional on the observed sample. They do **not** prove a permanent edge or predict future performance.

## Research integrity

The broader historical work contained iterative strategy development. I therefore do not present that development sample as fixed-strategy out-of-sample evidence.

The application separates later current-model observations from historical strategy-development research and surfaces small-sample and non-stationarity limitations directly in the interface.

## Tech

React · TypeScript · Recharts · browser-side CSV parsing · deterministic seeded resampling · automated tests

## Privacy

The public portfolio version excludes proprietary comments and trading-rule details. Imported CSVs in the live app are processed client-side for the current session.

## Author

**Alexander Ritter**  
BEng Electrical & Electronic Engineering, University of Nottingham
