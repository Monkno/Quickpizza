# Implementation Status

Last updated: 2026-09-15

## Current checkpoint

The project has completed Phase 3 and the cloud connectivity smoke in Phase 4. The campaign has
consumed one Gatling credit.

| Phase                        | Status                            | Evidence or next gate                                                                 |
| ---------------------------- | --------------------------------- | ------------------------------------------------------------------------------------- |
| 0. Planning                  | Complete                          | Plan approved; repository, branch, target, quota, and safety limits confirmed         |
| 1. Live reconnaissance       | Complete for anonymous HTTP scope | Homepage and public configuration returned 200; recommendation requires authorization |
| 2. Test harness              | Complete                          | No-load gates and the corrected two-request anonymous smoke passed                    |
| 3. Cloud deployment          | Complete                          | Package and test configuration deployed; immutable IDs recorded                       |
| 4. Controlled cloud campaign | In progress                       | Cloud connectivity smoke passed; baseline and light ramp remain                       |
| 5. Baseline governance       | Not started                       | Requires valid controlled-run evidence                                                |

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
- Campaign consumption is 1 credit; the `Quickpizza` team has 9 of 10 credits remaining.

## Safe resume point

1. Validate the guarded baseline-only workflow in CI.
2. Reconfirm the repository, branch, target, and anonymous-only scope.
3. Recheck the `Quickpizza` team quota immediately before the three-credit baseline.
4. Run the baseline only when the campaign budget remains valid; do not start the light ramp
   unless the baseline is healthy.

Do not add the authenticated pizza transaction, proceed to baseline or ramp, or enable any
automatic retry from this checkpoint.
