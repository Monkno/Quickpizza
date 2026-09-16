# Implementation Status

Last updated: 2026-09-15

## Current checkpoint

The initial capability and controlled cloud campaign are complete. The smoke, baseline, and final
light ramp consumed seven Gatling credits in total. Three of the ten-credit team quota remain as the
protected investigation buffer.

| Phase                        | Status                            | Evidence or next gate                                                                 |
| ---------------------------- | --------------------------------- | ------------------------------------------------------------------------------------- |
| 0. Planning                  | Complete                          | Plan approved; repository, branch, target, quota, and safety limits confirmed         |
| 1. Live reconnaissance       | Complete for anonymous HTTP scope | Homepage and public configuration returned 200; recommendation requires authorization |
| 2. Test harness              | Complete                          | No-load gates and the corrected two-request anonymous smoke passed                    |
| 3. Cloud deployment          | Complete                          | Package and test configuration deployed; immutable IDs recorded                       |
| 4. Controlled cloud campaign | Complete                          | Smoke, baseline, and one-minute light ramp passed within the seven-credit budget      |
| 5. Baseline governance       | Complete                          | Comparison and classification rules are versioned; thresholds remain provisional      |

## Implemented safety controls

- The simulation accepts only `https://quickpizza.grafana.com`.
- Only three bounded profiles exist: one-user `smoke`, three-minute `baseline`, and one-minute
  `light-ramp`.
- The journey makes exactly two anonymous application requests and contains no loop or retry.
- Gatling's external warm-up request is disabled.
- CI performs installation, formatting, type checking, and packaging only; it sends no target
  traffic and starts no cloud run.
- The no-load quality gate verifies the target, profiles, request count, generator configuration,
  assertions, manual triggers, confirmations, concurrency, and absence of scheduled cloud runs.
- A separate manual-only workflow is the sole CI entry point for the bounded protocol smoke.
- Every live-target or Gatling operation uses the `performance` GitHub Environment, restricted to
  the default branch in repository settings.
- Gatling Enterprise deployment and execution are separated; the deploy workflow cannot start
  a cloud run.
- Cloud smoke execution requires a literal confirmation value and is limited by a hard job
  timeout.
- Baseline and light-ramp launchers require distinct literal confirmations and share the same
  concurrency lock; neither retries or runs on a schedule.
- Unsafe profiles, arbitrary targets, cloud schedules, and automatic retries are absent.

## Reconnaissance note

One visible browser interaction confirmed that an authenticated browser session can generate a
recommendation. The first CI protocol smoke confirmed `GET /` and `GET /api/config` with 200
responses, while `POST /api/pizza` returned 401. The recommendation operation is therefore not
part of anonymous load until a dedicated synthetic credential is explicitly approved and stored
as a secret. No browser session credential will be copied into CI.

## Verified evidence

- [No-load safety-policy run 35038752866](https://github.com/Monkno/Quickpizza/actions/runs/35038752866)
  passed formatting, repository safety invariants, type checking, and the Gatling package build
  on `main` without sending target traffic or consuming credits.
- [No-load Quality run 35007545377](https://github.com/Monkno/Quickpizza/actions/runs/35007545377)
  passed installation, formatting, type checking, and Gatling package build on Node.js 24.
- [Anonymous protocol smoke 35007608915](https://github.com/Monkno/Quickpizza/actions/runs/35007608915)
  passed two of two requests with zero failures and a 267 ms p95.
- The smoke used no Gatling Enterprise Cloud load generator and consumed zero Gatling credits.
- [Deploy-only run 35009730918](https://github.com/Monkno/Quickpizza/actions/runs/35009730918)
  created the package and test configuration without starting a run or consuming credits.
- [Cloud connectivity smoke run_z1htg41chifw7dt9bjf6fao8oy](https://cloud.gatling.io/o/pushpoint-co/simulations/test_e885rruk97b4fpbtpfbxuxtcxa/runs/run_z1htg41chifw7dt9bjf6fao8oy)
  passed with two requests, zero errors, 179 ms p95, and three successful assertions.
- [Controlled baseline run_ifz6nrwcetgp7cjwqib3tudbfc](https://cloud.gatling.io/o/pushpoint-co/simulations/test_jo8wmpyydirkuqnifpszu7rt3c/runs/run_ifz6nrwcetgp7cjwqib3tudbfc)
  passed 360 requests with zero errors, 44 ms p95, 45 ms p99, and three successful assertions.
- [Controlled light ramp run_p38b85aed3gzt8oregydxsx9sy](https://cloud.gatling.io/o/pushpoint-co/simulations/test_6b4hwub88ffkiprt1dqqfq9ksh/runs/run_p38b85aed3gzt8oregydxsx9sy)
  passed 150 requests with zero errors, 45 ms p95, 47 ms p99, and three successful assertions.
- The smoke, baseline, and light ramp consumed 1, 4, and 2 credits respectively. Total campaign
  consumption is 7 credits, leaving the protected 3-credit balance.

## Closed checkpoint

No additional cloud run is justified by the collected evidence. A future execution requires a new
explicit authorization, repository and target reconfirmation, a compatible comparison purpose, and
a fresh credit check.

Do not add the authenticated pizza transaction, allow the balance to fall below three, or enable
any schedule or automatic retry from this checkpoint.
