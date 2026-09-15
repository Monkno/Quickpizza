# Gatling Cloud Connectivity Smoke — 2026-09-15

## Outcome

Pass. The first controlled Gatling Enterprise Cloud run completed with all assertions successful.

| Field              | Value                                                                                                                                         |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Repository         | `Monkno/Quickpizza`                                                                                                                           |
| Branch             | `codex/performance-testing-plan`                                                                                                              |
| Commit             | `262cc65e444df79c70dc023937f7e2aaba2815a0`                                                                                                    |
| Target             | `https://quickpizza.grafana.com`                                                                                                              |
| Team               | `Quickpizza`                                                                                                                                  |
| Test               | `QuickPizza - Anonymous Smoke`                                                                                                                |
| Test ID            | `test_e885rruk97b4fpbtpfbxuxtcxa`                                                                                                             |
| Run ID             | `run_z1htg41chifw7dt9bjf6fao8oy`                                                                                                              |
| Location           | `US East - N. Virginia`                                                                                                                       |
| Load generators    | 1                                                                                                                                             |
| Virtual users      | 1                                                                                                                                             |
| Iterations         | 1                                                                                                                                             |
| GitHub Actions run | [35010308814](https://github.com/Monkno/Quickpizza/actions/runs/35010308814)                                                                  |
| Gatling report     | [Interactive report](https://cloud.gatling.io/o/pushpoint-co/simulations/test_e885rruk97b4fpbtpfbxuxtcxa/runs/run_z1htg41chifw7dt9bjf6fao8oy) |

## Results

- Total requests: 2.
- Error ratio: 0%.
- Maximum concurrent virtual users: 1.
- Global p95 response time: 179 ms.
- Assertions: 3 successful, 0 failed.
- Gatling credits consumed: 1.
- `Quickpizza` team quota after the run: 1/10 consumed, 9 remaining.

This run proves cloud packaging, deployment, managed-location connectivity, test selection,
parameter propagation, assertion reporting, and CI orchestration. It is not a performance
baseline or a capacity result.

## Decision

The connectivity gate is healthy. Baseline implementation may proceed, but the three-credit
baseline must remain manual, use the same single location and generator, and require a fresh
quota check immediately before execution.
