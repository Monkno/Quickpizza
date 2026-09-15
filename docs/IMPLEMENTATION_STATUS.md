# Implementation Status

Last updated: 2026-09-15

## Current checkpoint

The project has completed Phase 3, the cloud connectivity smoke, and the baseline in Phase 4. The
campaign has consumed five Gatling credits. Five of the ten-credit team quota remain.

| Phase                        | Status                            | Evidence or next gate                                                                 |
| ---------------------------- | --------------------------------- | ------------------------------------------------------------------------------------- |
| 0. Planning                  | Complete                          | Plan approved; repository, branch, target, quota, and safety limits confirmed         |
| 1. Live reconnaissance       | Complete for anonymous HTTP scope | Homepage and public configuration returned 200; recommendation requires authorization |
| 2. Test harness              | Complete                          | No-load gates and the corrected two-request anonymous smoke passed                    |
| 3. Cloud deployment          | Complete                          | Package and test configuration deployed; immutable IDs recorded                       |
| 4. Controlled cloud campaign | Paused at credit gate             | Baseline passed; light ramp would breach the three-credit investigation buffer        |
| 5. Baseline governance       | Procedure complete                | Rules are versioned; thresholds remain provisional after the first baseline           |

## Implemented safety controls

- The simulation accepts only `https://quickpizza.grafana.com`.
- Only three bounded profiles exist: one-user `smoke`, three-minute `baseline`, and three-minute
  `light-ramp`.
- The journey makes exactly two anonymous application requests and contains no loop or retry.
- Gatling's external warm-up request is disabled.
- CI performs installation, formatting, type checking, and packaging only; it sends no target
  traffic and starts no cloud run.
- A separate manual-only workflow is the sole CI entry point for the bounded protocol smoke.
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
- The baseline consumed 4 credits. Total campaign consumption is 5 credits, leaving 5 of 10.

## Safe resume point

1. Keep the light ramp deferred while only five team credits remain; the expected four-credit cost
   would leave one and violate the three-credit investigation buffer.
2. If the quota increases, reconfirm the repository, branch, target, and anonymous-only scope.
3. Recheck the quota immediately before dispatch and run at most one guarded light ramp.
4. Record its evidence using the result template and compare it only under the governance rules.

Do not add the authenticated pizza transaction, spend the protected credit buffer, or enable any
automatic retry from this checkpoint.
