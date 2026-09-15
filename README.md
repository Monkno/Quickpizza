# QuickPizza Performance Engineering

This repository contains the performance testing and black-box observability strategy for the public QuickPizza demo environment.

- System under test: <https://quickpizza.grafana.com>
- Execution platform: Gatling Enterprise Cloud
- Test implementation language: TypeScript
- Current phase: Phase 2 harness complete; Gatling Cloud deployment not started

See the [Performance Testing and Observability Plan](docs/PERFORMANCE_TESTING_PLAN.md) for scope, safety controls, workload models, quality gates, credit budget, and implementation phases.

Progress and the exact safe resume point are recorded in
[Implementation Status](docs/IMPLEMENTATION_STATUS.md).

## Requirements

- Node.js 24 LTS or newer
- npm 11 or newer

## No-load validation

```shell
npm ci
npm run quality
```

This is the default CI path. It formats-checks, type-checks, and builds the Gatling package. It
does not contact QuickPizza or Gatling Enterprise Cloud.

## Manual protocol smoke

```shell
npm run smoke
```

This command must be run only after the repository, branch, target, profile, and authorization
have been reconfirmed. It sends exactly two requests to the public demo with one virtual user
and one iteration. It uses no Gatling Enterprise Cloud credits when run locally.

The same bounded smoke is available through the manual-only `Protocol smoke (manual)` GitHub
Actions workflow. It is never triggered by a push, pull request, or schedule. Every manual run
retains its native Gatling HTML report as a GitHub Actions artifact for seven days.

The latest verified result is recorded in
[Anonymous Protocol Smoke — 2026-09-15](docs/results/2026-09-15-protocol-smoke.md).

> QuickPizza is a shared public testing environment. High-load, stress, spike, breakpoint, and long-duration tests must not be executed against it.
