# Demonstration Guide

This walkthrough demonstrates the QuickPizza performance capability without sending a request to
the target or consuming a Gatling Cloud credit. Expected duration: five to seven minutes.

## 1. Frame the constraints

Open the [performance testing plan](PERFORMANCE_TESTING_PLAN.md) and explain:

- The application is a shared public demo treated as a black box.
- Application source, deployment control, logs, traces, and infrastructure metrics are not
  available.
- The goal is a reproducible low-load observation, not a breaking-point exercise.

## 2. Show the safety design

Open [`src/quickPizza.gatling.ts`](../src/quickPizza.gatling.ts) and point out:

- The fixed `https://quickpizza.grafana.com` target.
- The strict profile allowlist.
- Two read-only anonymous requests with checks and human-style pause.
- Finite injection profiles, no loop, no retry, and disabled warm-up traffic.
- Global error and percentile assertions.

Then open the three cloud workflows and show that every run is manual, profile-specific, protected
by a literal confirmation value, bounded by a timeout, and serialized by one concurrency group.

## 3. Show the delivery pipeline

Use the [evidence index](EVIDENCE_INDEX.md) to move through the pipeline:

1. No-load Quality validates formatting, types, and Gatling packaging on every push and pull
   request.
2. Protocol smoke produces a native HTML report and retains it as a short-lived artifact.
3. Deploy publishes the package and test definitions without starting load.
4. Cloud execution is a separate, explicit decision.

This separation is the central operational control: publishing a script cannot spend load-testing
credits or hit the target.

## 4. Show actual results

Open the [baseline evidence](results/2026-09-15-cloud-baseline.md) and the linked Gatling report.
Highlight:

- 360 total requests and zero errors.
- 1.99 achieved requests per second.
- 44 ms global p95 and 45 ms global p99.
- Three successful assertions.
- One managed generator in `US East - N. Virginia`.

Then open the [light-ramp evidence](results/2026-09-16-cloud-light-ramp.md): 150 requests completed
with zero errors, 45 ms p95, 47 ms p99, and the same managed location.

The Gatling report requires access to the PushPoint Co. organization. The committed findings record
and GitHub Actions run provide reviewable evidence when that organization access is unavailable.

## 5. Demonstrate the engineering decision

Open [Implementation Status](IMPLEMENTATION_STATUS.md). The cloud smoke used one credit and the
baseline used four, leaving five of the ten-credit team quota. A comparable three-minute ramp was
expected to consume approximately four more and leave only one.

The plan required a minimum three-credit investigation buffer, so that profile was not run. The
final light-ramp duration was later reduced to one minute while retaining the approved peak rate.
The revised run passed and consumed two credits, leaving exactly three. This is a positive control
outcome: governance changed the workload before execution instead of spending the protected
balance.

## 6. Close with the correct interpretation

Use [Baseline Governance](BASELINE_GOVERNANCE.md) to explain that the result is:

- A valid point-in-time external observation.
- The first comparison reference, not yet a statistically stable baseline.
- Evidence of client-observed latency and reliability, not server capacity or root cause.

## Suggested captures for an educational post

1. The native Gatling HTML report summary.
2. The Gatling Cloud baseline summary showing requests, error ratio, p95, and assertions.
3. The manual GitHub Actions workflow with its confirmation input.
4. The evidence-flow diagram above.

Crop account navigation and unrelated browser tabs. Do not include API tokens, repository secrets,
browser cookies, private URLs, or response bodies.
