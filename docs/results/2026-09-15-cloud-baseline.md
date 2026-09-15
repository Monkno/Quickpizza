# Gatling Cloud Baseline — 2026-09-15

## Run identity

| Field                  | Value                                                                                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Outcome                | Pass                                                                                                                                                      |
| UTC load start         | 2026-09-15 19:06:15                                                                                                                                       |
| Git commit SHA         | `c46bd82271fd43fccd5572f8c0af62e0e002f48c`                                                                                                                |
| Simulation             | `quickPizza`                                                                                                                                              |
| Target                 | `https://quickpizza.grafana.com`                                                                                                                          |
| Profile                | `baseline`                                                                                                                                                |
| Generator/location     | One managed generator, `US East - N. Virginia`                                                                                                            |
| GitHub Actions run     | [35011442047](https://github.com/Monkno/Quickpizza/actions/runs/35011442047)                                                                              |
| Gatling report         | [run_ifz6nrwcetgp7cjwqib3tudbfc](https://cloud.gatling.io/o/pushpoint-co/simulations/test_jo8wmpyydirkuqnifpszu7rt3c/runs/run_ifz6nrwcetgp7cjwqib3tudbfc) |
| Comparison baseline    | None; this is the first baseline observation                                                                                                              |
| Credits used/remaining | 4 used by this run; 5 of the 10-credit team quota remain                                                                                                  |

## Workload and result

| Metric                    | Configured                   | Achieved             |
| ------------------------- | ---------------------------- | -------------------- |
| Duration                  | 3 minutes                    | 3 minutes 1 second   |
| Journey rate              | 1 journey/second             | 180 journeys in 181s |
| Request rate              | Approximately 2 requests/s   | 1.99 requests/s      |
| Total requests            | Approximately 360            | 360                  |
| Failed requests/checks    | 0                            | 0                    |
| Error rate                | 0%                           | 0%                   |
| Maximum concurrent users  | Bounded by scenario duration | 3                    |
| Global p50                | Observation only             | 21 ms                |
| Global p95                | Less than 2,000 ms           | 44 ms                |
| Global p99                | Less than 3,000 ms           | 45 ms                |
| Maximum response time     | Observation only             | 192 ms               |
| Unexpected response codes | 0                            | 0                    |

## Per-request evidence

| Request                   | Count | Errors | p50   | p95   | p99   | Maximum |
| ------------------------- | ----- | ------ | ----- | ----- | ----- | ------- |
| Open QuickPizza           | 180   | 0      | 38 ms | 44 ms | 48 ms | 192 ms  |
| Load public configuration | 180   | 0      | 13 ms | 15 ms | 16 ms | 21 ms   |

## Assessment

The run passed all three assertions and completed the intended open workload without an error,
unexpected response code, or early-stop event. The achieved request rate matches the model. This
is the first valid baseline observation, so it is evidence for future comparison rather than a
statistically stable service-level objective.

The baseline consumed four credits because Gatling bills initialization in addition to the three
minutes of load. Campaign consumption is now five credits and only five remain. A similar
three-minute light ramp is expected to consume approximately four more credits, which would leave
one and violate the plan's minimum three-credit investigation buffer. The light ramp is therefore
deferred; no automatic or manual retry was started.

These results describe what the external load generator observed on a shared public demo. They do
not establish the cause of latency or prove server-side capacity.
