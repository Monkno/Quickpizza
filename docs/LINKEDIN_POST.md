# Gatling performance testing: LinkedIn clip

## Brief post

I used Gatling with TypeScript to model controlled workloads against QuickPizza and turn each
run into performance evidence: throughput, response-time percentiles, errors, and assertions.

The recorded one-minute light ramp completed 150 requests with 0% errors, a 45 ms p95, and all
three assertions passing. The clip shows the actual Gatling Enterprise report from September 16,
2026 (UTC).

I also improved the repository with offline regression checks and tested workflow safeguards.
The comparison tool checks workload compatibility before flagging a possible regression.

These are observations from a shared demo, not a capacity benchmark.

Source and run evidence: https://github.com/Monkno/Quickpizza

#Gatling #PerformanceTesting #TestAutomation #TypeScript

## Silent clip storyboard

1. Gatling's native request and response charts: model a bounded load.
2. Native response-time report: inspect latency and errors by transaction.
3. Native summary: 150 requests, 0% errors, 45 ms p95, three successful assertions.

Keep the historical UTC date visible throughout. Use cropped report captures to omit personal
account controls. The clip needs no audio; the captions explain each view. It is an edited
walkthrough of a recorded run, not a recording of a new load execution.

## Evidence

- [Light-ramp record](results/2026-09-16-cloud-light-ramp.md)
- [Native Gatling report](https://cloud.gatling.io/o/pushpoint-co/simulations/test_6b4hwub88ffkiprt1dqqfq9ksh/runs/run_p38b85aed3gzt8oregydxsx9sy)
- [Baseline record](results/2026-09-15-cloud-baseline.md)
- [Offline comparison contract](RESULT_COMPARISON.md)

## Accuracy check

No performance improvement to the QuickPizza server is claimed. Gatling measures protocol-level
behavior from an external generator. The baseline and light ramp have different workloads and
source commits, so their directional observations do not establish a regression. No cloud run
was started while preparing this update. Credit counts in historical records describe those runs,
not the account's current available balance.
