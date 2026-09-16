# QuickPizza Performance Testing and Observability Plan

| Field                   | Value                                                    |
| ----------------------- | -------------------------------------------------------- |
| Status                  | Approved — implementation in progress                    |
| Version                 | 1.0                                                      |
| System under test       | `https://quickpizza.grafana.com`                         |
| Test type               | Black-box performance testing and external observability |
| Primary platform        | Gatling Enterprise Cloud                                 |
| Implementation language | TypeScript                                               |
| Repository              | `Monkno/Quickpizza`                                      |

## 1. Executive summary

This plan defines a safe, repeatable, and credit-conscious performance testing approach for the public QuickPizza demo environment. The system is treated strictly as a black box: there is no application source-code access, deployment control, infrastructure access, or privileged access to server-side telemetry.

Gatling will generate HTTP and, where justified, WebSocket traffic. Gatling Enterprise Cloud will provide load-generator metrics, live run monitoring, reports, comparisons, and CI integration. The approach deliberately prioritizes measurement quality and environmental safety over load volume.

QuickPizza is a shared public demo. The objective is to characterize normal behavior under small, controlled loads. It is not appropriate to determine the service's breaking point.

## 2. Context and constraints

### 2.1 Confirmed constraints

- Only the public environment at `https://quickpizza.grafana.com` is in scope.
- The application and infrastructure cannot be modified or redeployed.
- Server-side logs, metrics, traces, profiles, database telemetry, and resource saturation metrics are unavailable.
- The target is shared with other users, so results can be affected by unrelated traffic and deployments.
- The test account has a limited Gatling Cloud credit balance.
- The `Quickpizza` Gatling team has a ten-credit quota.
- Gatling Cloud access is provided through the `GATLING_ENTERPRISE_API_TOKEN` GitHub Actions secret.
- No personally identifiable or production-like data may be generated.

### 2.2 Safety boundary

The following test types are prohibited against the shared public target:

- Stress testing intended to push the service beyond expected capacity.
- Breakpoint or capacity-limit testing.
- Aggressive spike testing.
- Long soak or endurance testing.
- Distributed tests using multiple load generators.
- Unbounded open-workload models.
- Automatic retries of failed cloud runs.
- Tests that create uncontrolled users, ratings, or other persistent data.

If these test types become necessary, they require a dedicated QuickPizza deployment owned by the test team and a separately approved plan.

## 3. Objectives

### 3.1 Primary objectives

1. Establish a reproducible low-load latency and reliability baseline.
2. Detect material client-observable regressions in response time, throughput, and error rate.
3. Validate that the public user journey remains reliable under a small concurrent workload.
4. Provide consistent Gatling reports with meaningful request names, groups, and run metadata.
5. Integrate controlled, manual performance execution with GitHub Actions.
6. Preserve Gatling credits and prevent accidental high-load execution.
7. Document the limits of any conclusion produced from a shared black-box environment.

### 3.2 Non-objectives

- Functional test-suite expansion.
- Browser UI automation or visual testing.
- Core Web Vitals measurement.
- Server capacity certification.
- Root-cause analysis using application internals.
- Verification of autoscaling, database capacity, CPU, memory, or container behavior.
- Security, penetration, denial-of-service, or resilience testing.
- Validation of QuickPizza source code.

## 4. Tool and language decision

### 4.1 Selected stack

- Gatling JavaScript SDK with TypeScript simulations.
- Gatling JavaScript CLI for local validation, packaging, and deployment.
- Gatling Enterprise Cloud for controlled execution and reporting.
- GitHub Actions for manual orchestration.

### 4.2 Why TypeScript

TypeScript is the preferred language because it is supported directly by Gatling's JavaScript SDK and CLI, provides compile-time feedback, and keeps the performance project lightweight for HTTP-focused black-box testing.

Python and C# are not native Gatling test-definition languages. Selecting either would require a different load-testing tool or custom integration code without improving this use case. Java remains a valid Gatling option, but it adds unnecessary build and JVM project complexity for the current scope.

### 4.3 Protocol-level limitation

Gatling works at the protocol level. It does not execute page JavaScript, render CSS, or measure browser rendering and interaction timings. Gatling results therefore describe HTTP/WebSocket service behavior, not full end-user browser performance.

## 5. Public surface under assessment

The first implementation phase will confirm the live contract before finalizing requests. Candidate public surfaces are:

| Surface                   | Method/protocol         | Purpose                                                                           | Initial scope                                                               |
| ------------------------- | ----------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `/`                       | `GET`                   | Homepage availability and static entry point                                      | Included                                                                    |
| `/api/config`             | `GET`                   | Public application configuration                                                  | Included after reconnaissance                                               |
| `/api/pizza`              | `POST`                  | Generate a pizza recommendation                                                   | Blocked until a dedicated synthetic credential is approved                  |
| Public catalog endpoints  | `GET`                   | Ingredients, doughs, tools, names, adjectives, and quotes used by the application | Include only endpoints confirmed by live traffic                            |
| `/ws`                     | WebSocket               | Real-time QuickPizza messages                                                     | Optional, low concurrency only                                              |
| User and rating endpoints | `POST`, `GET`, `DELETE` | Authentication and rating lifecycle                                               | Excluded initially because they create or depend on shared persistent state |
| Admin endpoints           | Any                     | Administrative behavior                                                           | Explicitly excluded                                                         |

Endpoint discovery must use public browser traffic, public documentation, and harmless single-request probes only. The performance suite must not rely on private implementation details.

## 6. Test model

### 6.1 Business transactions

The anonymous performance model contains two protocol-level transactions, not a new functional regression suite:

1. **Open QuickPizza**
   - Request the public homepage.
   - Validate a successful response and expected content type.

2. **Load public configuration/catalog data**
   - Request only the read-only resources confirmed as part of the live application flow.
   - Keep request names stable and group related resources.

The following transaction is conditional and must not be included in anonymous runs:

3. **Generate a pizza recommendation**
   - The live endpoint currently returns 401 without an authorization token.
   - Include it only after a dedicated synthetic credential is approved and stored as a CI secret.
   - Never reuse or export a human browser-session credential.
   - When enabled, validate HTTP status, JSON content type, response parseability, and the minimum response contract required by the UI.

The WebSocket flow may be introduced later as a separate simulation so it cannot unintentionally change the HTTP load model.

### 6.2 Test data

- Generate synthetic request data in memory.
- Use valid bounded values and realistic variation.
- Use no email addresses, personal names, credentials, or other personal data.
- Do not create accounts during normal performance runs.
- Do not persist generated data to the repository or CI logs.
- Use deterministic random seeds where supported so a failed run can be reproduced.

### 6.3 Think time and pacing

Pauses must represent human interaction time and prevent tight loops. The initial model will use bounded randomized pauses between transactions. An iteration must not immediately start again after a response without an intentional pause.

## 7. Workload strategy

All profiles use one load generator and a single geographic location. Cloud execution is sequential.

| Profile                  | Purpose                                                   | Proposed load                                                        | Maximum duration     | Cloud credits       |
| ------------------------ | --------------------------------------------------------- | -------------------------------------------------------------------- | -------------------- | ------------------- |
| Local protocol smoke     | Validate script, checks, data, and naming                 | One user, one iteration                                              | Less than one minute | None                |
| Cloud connectivity smoke | Confirm packaging, token, location, and report generation | One user with normal pauses                                          | One minute           | Approximately one   |
| Baseline                 | Measure low-load steady behavior                          | Open model targeting approximately one business iteration per second | Three minutes        | Approximately three |
| Light ramp               | Observe behavior under a small controlled increase        | Gradual ramp from approximately 0.5 to 2 iterations per second       | Three minutes        | Approximately three |
| Confirmation run         | Confirm a suspected regression only when justified        | Same profile as the run being confirmed                              | Maximum two minutes  | Up to two           |

The initial campaign must stop after the cloud smoke, baseline, and light-ramp runs. This limits planned use to approximately seven credits and preserves at least three credits for investigation or confirmation. Initialization time is billable, so actual consumption must be checked after every run.

The confirmation run is conditional and must not start automatically.

## 8. Performance and reliability criteria

### 8.1 Response validation

Every request must have an explicit protocol or content check. A fast but invalid response is a failure.

- Expected status codes must be checked per request.
- JSON responses must be parseable and contain the minimum required fields.
- Redirects must be intentional and visible in request naming.
- Transport errors, timeouts, and failed checks must be reported separately.
- Expected negative responses must not be mixed into success metrics.

### 8.2 Provisional safety thresholds

Until a stable baseline exists, the following broad thresholds detect obvious failures without pretending to be product SLOs:

- Successful request rate: at least 99%.
- Functional check success rate: 100%.
- Global response-time p95: below 2,000 ms.
- Global response-time p99: below 3,000 ms.
- No unexpected `5xx` responses.
- No uncontrolled increase in active users or request rate.

These are provisional guardrails, not contractual service-level objectives.

### 8.3 Baseline-derived regression gates

After valid baseline runs exist, thresholds will be defined per stable transaction:

- Use p50, p95, and p99; do not gate on averages alone.
- Compare runs using the same simulation version, location, load model, target, and approximate time window.
- A candidate regression is a p95 increase greater than 25% with no workload increase, or an error-rate increase greater than one percentage point.
- A result from the shared environment is inconclusive when external traffic, deployment changes, network instability, or target throttling cannot be ruled out.
- Do not automatically re-run an inconclusive cloud result. Review remaining credits and obtain approval first.

Thresholds must be version-controlled and changed only with a documented baseline or requirement change.

## 9. Observability strategy

### 9.1 Available black-box signals

Gatling reports will be the source of truth for load-side telemetry:

- Active, started, completed, and failed virtual users.
- Request and response counts.
- Request throughput and achieved iteration rate.
- Response-time distributions and percentiles.
- Response codes and failed checks.
- TCP connection and TLS handshake behavior when available.
- Bytes sent and received.
- Load-generator health and injection-profile accuracy.

Every simulation must use readable request names and transaction groups. Reports must not contain dynamically generated IDs in request names because that would fragment metrics.

### 9.2 Run metadata

Each cloud run should include:

- Git commit SHA.
- Target environment identifier: `public-demo`.
- Workload profile: `smoke`, `baseline`, or `light-ramp`.
- Simulation version.
- GitHub Actions run URL when launched from CI.
- A short purpose statement.

The base URL must be configurable, but CI must allow only the approved QuickPizza hostname unless the plan is amended.

### 9.3 Unavailable internal signals

Because no telemetry backend is available for this target, the following cannot be observed or asserted:

- Application, service, or database resource saturation.
- Internal service-level latency and dependency timing.
- Logs correlated to an individual load-test request.
- Distributed traces and critical-path analysis.
- Runtime profiles or lock contention.
- Deployment markers and infrastructure changes.

Gatling's OpenTelemetry export does not provide missing application telemetry; it exports load-test metrics for correlation with telemetry that must already exist and be accessible. It also requires infrastructure and plan capabilities that are outside the current scope.

### 9.4 Interpretation rule

Black-box results can prove what the load generator observed. They cannot, by themselves, prove why the behavior occurred. Root-cause statements must not be made without supporting server-side evidence.

## 10. Execution controls

### 10.1 Pre-run checklist

1. Confirm the repository, branch, target hostname, profile, and requested run owner.
2. Verify the test is within the shared-environment safety boundary.
3. Verify the Gatling team has sufficient remaining credits.
4. Verify no other performance run is active.
5. Run formatting, type checking, and local static validation.
6. Run one local protocol smoke only when a live request has been explicitly approved.
7. Review the generated package and simulation configuration.
8. Confirm one load generator and the maximum duration.
9. Confirm the run has an abort condition for excessive errors or latency.

### 10.2 Abort conditions

A cloud run must stop early when any of the following occurs:

- Unexpected error rate exceeds 5% over a sustained observation window.
- Response-time p95 exceeds five seconds over a sustained observation window.
- The achieved request rate materially exceeds the configured rate.
- The target begins returning throttling, blocking, or abuse-prevention responses.
- The load generator or simulation produces an unbounded loop.
- Another active run is discovered against the same shared target.

### 10.3 Post-run checklist

1. Stop the run and verify that no load generator remains active.
2. Record consumed and remaining credits.
3. Save the Gatling report URL and run metadata.
4. Export or retain the CI summary as an artifact without secrets or response bodies.
5. Compare the result only with compatible baseline runs.
6. Classify the result as pass, fail, or inconclusive.
7. Document anomalies and the evidence required for confirmation.

## 11. CI/CD strategy

### 11.1 Pull requests

Pull requests will run only non-load checks by default:

- Dependency installation from the lockfile.
- Formatting and linting.
- Type checking.
- Gatling source compilation or packaging validation.
- Unit tests for custom data builders or helper functions, if introduced.

No request to QuickPizza and no Gatling Cloud run should occur automatically on pull requests.

### 11.2 Cloud execution workflow

Profile-specific Gatling workflows use `workflow_dispatch` and literal confirmation inputs. They
include:

- A protected GitHub environment named `performance` when repository settings allow it.
- `GATLING_ENTERPRISE_API_TOKEN` from encrypted repository secrets.
- Immutable Gatling package and test IDs in the configuration-as-code file.
- A hard job timeout.
- One concurrency group with `cancel-in-progress: false`.
- No retry step.
- Full-commit pinning for third-party GitHub Actions.
- A run summary containing the Gatling report link and selected profile.
- A source-level allowlist that rejects unapproved target hosts and profile values.
- A no-load safety-policy check that fails CI when workload or workflow bounds drift.

Scheduled execution is disabled during the limited-credit evaluation period. It may be proposed later only after stable baselines, predictable credit use, and an appropriate Gatling plan exist.

### 11.3 Secret handling

- Never print, echo, upload, or persist the Gatling API token.
- Never pass the token as a command-line argument when an environment variable is supported.
- Mask sensitive values in CI output.
- Keep the token limited to the `Quickpizza` team and the minimum required permission.
- Rotate the token after suspected exposure or when repository access changes.
- Review token scope before enabling any automated deployment workflow.

## 12. Proposed repository structure

The following structure is proposed for the implementation phase:

```text
.
|-- .github/
|   `-- workflows/
|       |-- quality.yml
|       `-- gatling-cloud.yml
|-- docs/
|   `-- PERFORMANCE_TESTING_PLAN.md
|-- resources/
|   `-- data/
|-- src/
|   |-- config/
|   |-- feeders/
|   |-- scenarios/
|   `-- quickpizza.gatling.ts
|-- .gitignore
|-- README.md
|-- package-lock.json
|-- package.json
`-- tsconfig.json
```

Only files justified by the implemented workload should be created. Empty abstraction layers and speculative helpers are not acceptable.

## 13. Implementation phases and gates

### Phase 0: Planning

Deliverables:

- Approved testing plan.
- Confirmed repository and branch.
- Confirmed safety and credit limits.

Exit gate: stakeholder approval before test code is created.

### Phase 1: Live reconnaissance

Deliverables:

- Confirmed request flow, methods, payloads, and response contracts.
- Confirmed list of read-only and write-side-effect endpoints.
- Recorded single-request timings for calibration only.

Exit gate: no endpoint ambiguity and no uncontrolled persistent data creation.

### Phase 2: Test harness

Deliverables:

- Minimal TypeScript Gatling project.
- One simulation containing the approved HTTP transactions.
- Environment validation, stable request naming, checks, pauses, and assertions.
- Local quality workflow with no cloud execution.

Exit gate: clean install, lint, type check, packaging validation, and one explicitly approved local protocol smoke.

### Phase 3: Gatling Cloud deployment

Deliverables:

- Package deployed to the `Quickpizza` Gatling team.
- Simulation configured with one load generator.
- Simulation ID stored as a non-secret repository variable.
- Manual GitHub Actions workflow.

Exit gate: configuration review completed before the first cloud run.

### Phase 4: Controlled cloud campaign

Deliverables:

- One cloud connectivity smoke.
- One baseline run.
- One light-ramp run only if the baseline is healthy.
- Recorded reports, credit use, and findings.

Exit gate: total campaign remains within the approved credit budget and the target shows no sign of overload.

### Phase 5: Baseline governance

Deliverables:

- Versioned transaction thresholds based on collected evidence.
- Run-comparison procedure.
- Documented criteria for pass, fail, and inconclusive results.

Exit gate: a future authorized run can be reproduced and interpreted without undocumented assumptions.

## 14. Entry and exit criteria

### 14.1 Entry criteria for implementation

- This plan is approved.
- The target repository and implementation branch are confirmed.
- TypeScript remains the selected Gatling language.
- Live reconnaissance is authorized.
- The shared-target safety limits are accepted.

### 14.2 Exit criteria for the initial performance capability

- The project installs reproducibly from a lockfile.
- Static checks and packaging validation pass in CI.
- Requests have meaningful names, checks, and bounded pauses.
- The target hostname, workload, users, rate, and duration are bounded.
- The manual workflow cannot select an arbitrary host or unsafe profile.
- Gatling Cloud receives the approved package and generates a valid report.
- The smoke, baseline, and optional light-ramp results are documented.
- Credit consumption remains within the approved campaign budget.
- No secret appears in source, artifacts, or logs.
- Known black-box limitations are included in every findings report.

## 15. Risks and mitigations

| Risk                      | Impact                            | Mitigation                                                                              |
| ------------------------- | --------------------------------- | --------------------------------------------------------------------------------------- |
| Shared target variability | False regression signals          | Use compatible runs, record context, and allow an inconclusive outcome                  |
| Accidental overload       | Harm to a public demo             | Low rates, one generator, hard durations, abort thresholds, and manual execution        |
| Credit exhaustion         | Inability to confirm results      | Ten-credit team quota, seven-credit initial campaign, no schedules or automatic retries |
| Token exposure            | Unauthorized Gatling access       | Encrypted secret, team-only scope, no logging, and rotation procedure                   |
| Dynamic request names     | Fragmented metrics                | Use stable names and groups; keep IDs only in session data                              |
| Invalid fast responses    | Misleading pass result            | Check status, content type, JSON parseability, and required fields                      |
| Coordinated omission      | Under-reported latency under load | Prefer an open workload for rate-based profiles and monitor achieved injection rate     |
| Load-generator bottleneck | Invalid service conclusions       | Monitor generator health and keep the load intentionally small                          |
| Hidden server-side cause  | Unsupported root-cause claim      | Report client evidence only and explicitly state missing telemetry                      |
| Persistent test data      | Pollution of shared environment   | Exclude write-heavy flows and use non-persistent public operations                      |

## 16. Reporting template

Every executed cloud profile should produce a short findings record containing:

- Date and UTC time.
- Commit SHA and simulation version.
- Target, location, and workload profile.
- Configured and achieved rate/concurrency.
- Duration and Gatling credits consumed.
- Total requests, error rate, and failed checks.
- Per-transaction p50, p95, p99, and maximum response time.
- Unexpected response-code distribution.
- Gatling report URL.
- Comparison baseline, if applicable.
- Outcome: pass, fail, or inconclusive.
- Observed limitation and next authorized action.

## 17. References

- [QuickPizza public demo](https://quickpizza.grafana.com/)
- [QuickPizza upstream project and shared-environment guidance](https://github.com/grafana/quickpizza)
- [Gatling HTTP protocol reference](https://docs.gatling.io/reference/script/http/protocol/)
- [Gatling JavaScript CLI](https://docs.gatling.io/integrations/build-tools/js-cli/)
- [Gatling GitHub Actions integration](https://docs.gatling.io/integrations/ci-cd/github-actions/)
- [Gatling API token permissions](https://docs.gatling.io/reference/administration/api-tokens/)
- [Gatling credit consumption](https://docs.gatling.io/reference/run-tests/credits/)
- [Gatling OpenTelemetry integration](https://docs.gatling.io/integrations/apm-tools/otel/)
- [Grafana k6 resource guidance for shared demo environments](https://grafana.com/docs/k6/latest/get-started/resources/)
