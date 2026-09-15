# Gatling Enterprise Deployment — 2026-09-15

## Outcome

Phase 3 deployment passed without starting a cloud test run.

| Field                               | Value                                                                                              |
| ----------------------------------- | -------------------------------------------------------------------------------------------------- |
| Repository                          | `Monkno/Quickpizza`                                                                                |
| Branch                              | `codex/performance-testing-plan`                                                                   |
| Team                                | `Quickpizza` (`team_9qhrc8qfsff6dpps4uzu7xxpqa`)                                                   |
| Package                             | `QuickPizza Performance Tests`                                                                     |
| Package ID                          | `package_zo3jqbgrt3nh9gjfbq3jphdzdy`                                                               |
| Test                                | `QuickPizza - Anonymous Smoke`                                                                     |
| Test ID                             | `test_e885rruk97b4fpbtpfbxuxtcxa`                                                                  |
| Location                            | `US East - N. Virginia`                                                                            |
| Load generators                     | 1                                                                                                  |
| GitHub Actions run                  | [35009730918](https://github.com/Monkno/Quickpizza/actions/runs/35009730918)                       |
| Package artifact                    | [10412983160](https://github.com/Monkno/Quickpizza/actions/runs/35009730918/artifacts/10412983160) |
| Gatling Enterprise credits consumed | 0                                                                                                  |

## Deployed controls

- Target fixed to `https://quickpizza.grafana.com`.
- Profile fixed to `smoke`.
- One managed load generator with 100% weight in one location.
- Dedicated IPs disabled.
- Stop criteria configured for load-generator CPU, global p95 response time, and global error
  ratio.
- Package deployment and cloud execution are separate manual workflows.
- No automatic retries or scheduled execution.

The immutable package and test IDs are stored in `.gatling/package.conf` so later deployments
update the same Gatling resources instead of creating duplicates.
