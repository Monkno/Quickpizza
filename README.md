# QuickPizza Performance Engineering

This repository contains the performance testing and black-box observability strategy for the public QuickPizza demo environment.

- System under test: <https://quickpizza.grafana.com>
- Execution platform: Gatling Enterprise Cloud
- Test implementation language: TypeScript
- Current phase: planning only; no load tests have been implemented or executed

See the [Performance Testing and Observability Plan](docs/PERFORMANCE_TESTING_PLAN.md) for scope, safety controls, workload models, quality gates, credit budget, and implementation phases.

> QuickPizza is a shared public testing environment. High-load, stress, spike, breakpoint, and long-duration tests must not be executed against it.
