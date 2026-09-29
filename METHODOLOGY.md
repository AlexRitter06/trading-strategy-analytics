# Methodology

## R-multiple normalization

The application analyses trades in R-multiples rather than currency so that outcomes are comparable across trades without exposing monetary position sizing.

Rules used by the parser:

- **Win:** use realised R when available; otherwise use planned R/R.
- **Loss:** map to -1R.
- **Break-even:** map to 0R.
- **Invalid/non-trade rows:** exclude and report.

## Maximum drawdown

Maximum drawdown is calculated from the cumulative R series as the largest peak-to-trough decline observed in the active sample.

## Bootstrap

The bootstrap repeatedly resamples the observed trade-level R outcomes with replacement and computes the mean R for each resample.

The resulting percentile interval is an estimate of sampling uncertainty conditional on the observed data.

It should not be interpreted as proof of a permanent edge.

## Monte Carlo scenario analysis

The Monte Carlo engine repeatedly samples observed R outcomes with replacement over a chosen horizon.

A deterministic seeded pseudo-random number generator makes repeated runs reproducible.

Outputs include ending-R percentiles, the fraction of simulated paths ending below zero and drawdown summaries.

## Key assumptions and limitations

The resampling model assumes the observed distribution is informative about the hypothetical sample being generated.

It does **not** model:

- market regime change
- serial dependence between trades
- execution deterioration
- strategy drift
- changing opportunity frequency
- changing market microstructure

For that reason, simulated results are presented as **scenario analysis**, not forecasts.

## Historical-development separation

Historical strategy-development research involved iterative model changes. It is therefore not labelled as a fixed-strategy out-of-sample backtest.

Later current-model observations are tracked separately so that development data and forward evidence are not conflated.

## Small samples

Subgroup statistics can become unstable when only a few observations are available. The live app surfaces small-sample warnings rather than implying false precision.
