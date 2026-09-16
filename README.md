# QuickPizza Performance Engineering

[![Quality](https://github.com/Monkno/Quickpizza/actions/workflows/quality.yml/badge.svg?branch=main)](https://github.com/Monkno/Quickpizza/actions/workflows/quality.yml?query=branch%3Amain)

This repository contains the performance testing and black-box observability strategy for the public QuickPizza demo environment.

- System under test: <https://quickpizza.grafana.com>
- Execution platform: Gatling Enterprise Cloud
- Test implementation language: TypeScript
- Current phase: Phase 4 paused at the credit gate

See the [Performance Testing and Observability Plan](docs/PERFORMANCE_TESTING_PLAN.md) for scope, safety controls, workload models, quality gates, credit budget, and implementation phases.

Progress and the exact safe resume point are recorded in
[Implementation Status](docs/IMPLEMENTATION_STATUS.md).

## Evidence and demonstration

- [Evidence Index](docs/EVIDENCE_INDEX.md) maps every claim to implementation and run evidence.
- [Demonstration Guide](docs/DEMO_GUIDE.md) provides a five-to-seven-minute, zero-load walkthrough.
- [LinkedIn Educational Post](docs/LINKEDIN_POST.md) contains ready-to-publish English copy and an
  accurate four-panel story.

## Requirements

- Node.js 24 LTS or newer
- npm 11 or newer

## No-load validation

```shell
npm ci
npm run quality
```

This is the default CI path. It formats-checks, type-checks, and builds the Gatling package. It
also verifies the versioned workload-safety policy. It does not contact QuickPizza or Gatling
Enterprise Cloud.

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

## Gatling Enterprise deployment

The manual-only `Gatling deploy (manual)` workflow packages the simulation and deploys its test
configuration to the `Quickpizza` team. Deployment does not start a load test. Cloud execution
is kept in separate profile-specific workflows so publishing code cannot consume credits.

The verified deployment is recorded in
[Gatling Enterprise Deployment — 2026-09-15](docs/results/2026-09-15-gatling-deployment.md).

## Controlled cloud smoke

The manual-only `Gatling Cloud smoke (manual)` workflow is the only cloud execution entry point
currently implemented. It requires the exact confirmation value `RUN_ONE_CREDIT_SMOKE`, runs the
deployed one-user smoke, waits for assertions, and has no retry or schedule. The team quota must
still be checked immediately before every dispatch.

The first cloud connectivity smoke passed and is documented in
[Gatling Cloud Connectivity Smoke — 2026-09-15](docs/results/2026-09-15-cloud-smoke.md).

The first controlled baseline also passed and is documented in
[Gatling Cloud Baseline — 2026-09-15](docs/results/2026-09-15-cloud-baseline.md).

The same anonymous journey also defines two bounded workload profiles: a three-minute `baseline`
at one journey per second and a one-minute `light-ramp` from 0.5 to 2 journeys per second. They are
deployed and executed separately; neither can be selected by the cloud smoke workflow.

The manual-only `Gatling Cloud baseline (manual)` workflow is the sole baseline entry point. It
requires `RUN_THREE_CREDIT_BASELINE`, uses the same one-generator concurrency lock as the cloud
smoke, and has no retry or schedule.

The manual-only `Gatling Cloud light ramp (manual)` workflow is also implemented, but its presence
does not authorize a run. It requires `RUN_TWO_CREDIT_LIGHT_RAMP` and may be dispatched only
after a healthy baseline and a fresh credit check confirm that the campaign budget remains valid.
The original three-minute ramp was deferred because it would have breached the three-credit
investigation buffer. The one-minute profile preserves the same peak rate while limiting expected
consumption to two credits, leaving the protected buffer intact.

Result interpretation and the version-controlled comparison rules are defined in
[Baseline Governance](docs/BASELINE_GOVERNANCE.md). Use the
[Gatling Cloud Run template](docs/results/RUN_RESULT_TEMPLATE.md) for future evidence records.

> QuickPizza is a shared public testing environment. High-load, stress, spike, breakpoint, and long-duration tests must not be executed against it.
