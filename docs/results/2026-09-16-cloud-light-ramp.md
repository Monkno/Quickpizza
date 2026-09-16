# Gatling Cloud Light Ramp — 2026-09-16

## Run identity

| Field                  | Value                                                                                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Outcome                | Pass                                                                                                                                                      |
| UTC load interval      | 2026-09-16 00:20:34–00:21:36                                                                                                                              |
| Git commit SHA         | `453ae6950e0450fbafe4cd7d8fb680bfa9474dd8`                                                                                                                |
| Simulation             | `quickPizza`                                                                                                                                              |
| Target                 | `https://quickpizza.grafana.com`                                                                                                                          |
| Profile                | `light-ramp`                                                                                                                                              |
| Generator/location     | One managed generator, `US East - N. Virginia`                                                                                                            |
| GitHub Actions run     | [35039483726](https://github.com/Monkno/Quickpizza/actions/runs/35039483726)                                                                              |
| Gatling report         | [run_p38b85aed3gzt8oregydxsx9sy](https://cloud.gatling.io/o/pushpoint-co/simulations/test_6b4hwub88ffkiprt1dqqfq9ksh/runs/run_p38b85aed3gzt8oregydxsx9sy) |
| Comparison baseline    | [2026-09-15 controlled baseline](2026-09-15-cloud-baseline.md)                                                                                            |
| Credits used/remaining | 2 used by this run; 3 of the 10-credit team quota remain                                                                                                  |

## Workload and result

| Metric                    | Configured                      | Achieved             |
| ------------------------- | ------------------------------- | -------------------- |
| Duration                  | 1 minute                        | 1 minute 2 seconds   |
| Journey rate              | Ramp from 0.5 to 2 journeys/s   | 75 journeys; 1.21/s  |
| Request rate              | Approximately 1 to 4 requests/s | 2.42 requests/s avg. |
| Total requests            | Approximately 150               | 150                  |
| Failed requests/checks    | 0                               | 0                    |
| Error rate                | 0%                              | 0%                   |
| Maximum concurrent users  | Bounded by the open model       | 4                    |
| Global p50                | Observation only                | 20 ms                |
| Global p95                | Less than 2,000 ms              | 45 ms                |
| Global p99                | Less than 3,000 ms              | 47 ms                |
| Maximum response time     | Observation only                | 184 ms               |
| Unexpected response codes | 0                               | 0                    |

## Per-request evidence

| Request                   | Count | Errors | p50   | p95   | p99    | Maximum |
| ------------------------- | ----- | ------ | ----- | ----- | ------ | ------- |
| Open QuickPizza           | 75    | 0      | 39 ms | 45 ms | 184 ms | 184 ms  |
| Load public configuration | 75    | 0      | 13 ms | 15 ms | 20 ms  | 20 ms   |

The homepage p99 equals its maximum because one slower sample among 75 requests falls inside that
request-level percentile. The global p99 remains 47 ms across all 150 requests.

## Baseline comparison

| Metric       | Baseline | Light ramp | Observation               |
| ------------ | -------- | ---------- | ------------------------- |
| Request rate | 1.99/s   | 2.42/s     | 21.6% higher average rate |
| Error rate   | 0%       | 0%         | No change                 |
| Global p50   | 21 ms    | 20 ms      | 4.8% lower                |
| Global p95   | 44 ms    | 45 ms      | 2.3% higher               |
| Global p99   | 45 ms    | 47 ms      | 4.4% higher               |
| Maximum      | 192 ms   | 184 ms     | 4.2% lower                |

This is a directional comparison, not a like-for-like regression gate: the light ramp intentionally
uses a higher and changing workload and has a shorter duration. The latency changes remain far
below the 25% candidate-regression threshold, with no errors or failed checks.

## Assessment

The run passed all three assertions and completed the intended open workload without an error,
unexpected response code, early-stop event, or retry. Achieved journeys and request counts match
the configured ramp.

The one-minute profile consumed exactly two credits, bringing total campaign consumption to seven
and preserving the planned three-credit investigation buffer. No confirmation run is justified.

These results describe what the external load generator observed on a shared public demo. They do
not establish server capacity or a server-side cause for response-time variation.
