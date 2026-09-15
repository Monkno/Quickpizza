# Anonymous Protocol Smoke — 2026-09-15

## Outcome

Pass for the approved anonymous public scope.

| Field                      | Value                                                                        |
| -------------------------- | ---------------------------------------------------------------------------- |
| Repository                 | `Monkno/Quickpizza`                                                          |
| Branch                     | `codex/performance-testing-plan`                                             |
| Commit                     | `c1ecb201a3e7e1f2ad0e347c7bc5fc7c4b52d22b`                                   |
| Target                     | `https://quickpizza.grafana.com`                                             |
| Runner                     | GitHub-hosted, Node.js 24                                                    |
| Profile                    | `smoke`                                                                      |
| Virtual users              | 1                                                                            |
| Iterations                 | 1                                                                            |
| Gatling Enterprise credits | 0                                                                            |
| GitHub Actions run         | [35007608915](https://github.com/Monkno/Quickpizza/actions/runs/35007608915) |

## Results

| Transaction                                          | Requests | Successful | Failed |
| ---------------------------------------------------- | -------: | ---------: | -----: |
| Open QuickPizza / GET homepage                       |        1 |          1 |      0 |
| Load public configuration / GET public configuration |        1 |          1 |      0 |
| Global                                               |        2 |          2 |      0 |

- Minimum response time: 39 ms.
- Maximum response time: 267 ms.
- Mean response time: 153 ms.
- p95 response time: 267 ms; assertion below 2,000 ms passed.
- p99 response time: 267 ms; assertion below 3,000 ms passed.
- Failed-event assertion: zero; passed.

This single iteration proves protocol connectivity and contract checks only. It is not a
performance baseline and must not be used for a capacity conclusion.

## Reconciliation of the first attempt

The first manual run reached the target and returned 200 for the homepage and public
configuration. `POST /api/pizza` returned 401 because the live endpoint requires an
authorization token. That run was not automatically retried.

The anonymous simulation was corrected to exclude the authenticated operation. A future pizza
recommendation transaction requires a dedicated synthetic credential approved for this purpose.
Human browser-session credentials must never be copied into CI.
