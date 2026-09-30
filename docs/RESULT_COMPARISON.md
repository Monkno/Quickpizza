# Offline Gatling result comparison

`npm run results:compare -- reference.json candidate.json` reads two local summaries. It never
connects to QuickPizza, calls Gatling Cloud, or starts a retry. Gatling's native report remains
the primary evidence; this tool applies the repository's [baseline governance](BASELINE_GOVERNANCE.md)
to reviewed observations.

## Input contract

Use [the historical baseline JSON](results/2026-09-15-cloud-baseline.json) as the field reference.
Its companion [Markdown record](results/2026-09-15-cloud-baseline.md) retains workload rates,
achieved duration, credits, and the interpretation. The JSON is a reviewed transcription, not
a native Gatling export and not evidence of a new run.

| Field                                                          | Required meaning                                                                                        |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `schemaVersion`                                                | Integer `1`                                                                                             |
| `runId`, `testId`, `gatlingVersion`                            | Exact identity from the native report                                                                   |
| `sourceSha`                                                    | Full Git SHA of the deployed source and configuration                                                   |
| `target`                                                       | `https://quickpizza.grafana.com`                                                                        |
| `profile`, `durationSeconds`, `injection.from`, `injection.to` | One versioned bounded profile; smoke uses `1, 0, 0`, baseline `180, 1, 1`, light ramp `60, 0.5, 2`      |
| `generator`                                                    | `count: 1`, `location: US East - N. Virginia`                                                           |
| `completedWorkload`                                            | Reviewer confirms achieved rate/duration and no early stop; never infer from a green assertion alone    |
| `anomalies`                                                    | Reviewed environmental issues; an empty array explicitly records none observed                          |
| `unexpectedStatusCodes`                                        | Non-negative count, no larger than failed requests                                                      |
| `global`                                                       | `count`, `failed`, `p50Ms`, `p95Ms`, `p99Ms`, `maxMs`                                                   |
| `requests`                                                     | Two transaction summaries in journey order, with stable `name` and the same metric fields               |
| `evidence`                                                     | `startedAtUtc` in `YYYY-MM-DDTHH:mm:ssZ`, `github` execution URL, `gatling` report URL matching the IDs |

Transaction rows use the existing named Gatling groups: `Open QuickPizza` and
`Load public configuration`. Each group contains one anonymous HTTP request. Counts and failures
must sum to their global totals; the global maximum must equal the highest transaction maximum.
Percentiles must be finite, non-negative, and ordered. The tool rejects missing evidence and
invalid calendar dates. URLs are validated as identifiers; their remote contents are not fetched.

## Interpretation

`runOutcome` is `pass`, `fail`, or `inconclusive`. Passing requires a reviewed completed workload,
the exact bounded request volume (2, 360, or 150), zero failed requests/unexpected statuses,
global p95 below 2,000 ms, and global p99 below 3,000 ms. Environmental anomalies take precedence
and make the observation inconclusive.

`comparison` requires different run IDs, a passing reference, matching target/source SHA/Gatling
version/test ID/profile/duration/injection/generator, and the same transaction sequence.
An incompatible pair yields `inconclusive` with reasons and no regression calculation.

For a compatible pair, p95 rising by **more than 25%**, or error rate rising by **more than one
percentage point**, flags `candidate-regression` globally or at a transaction. Exactly 25% does
not trigger the signal. A zero reference p95 followed by a positive p95 is flagged without
inventing a finite percentage. `no-candidate-regression` can still accompany `runOutcome: fail`
when a single failed request violates the zero-failure assertion. Candidate signals require
human review; they do not establish a root cause.

| Exit code | Meaning                                                              |
| --------- | -------------------------------------------------------------------- |
| `0`       | Passing candidate, compatible pair, no candidate regression          |
| `1`       | Candidate run fails, or a compatible pair has a candidate regression |
| `2`       | Invalid input or inconclusive evidence/comparison                    |

A failed candidate returns `1` even when the pair is incompatible. No result authorizes another
load test. The two historical fixtures intentionally exercise incompatibility rather than
pretending the baseline and ramp share a workload. Modified test cases are synthetic and confined
to the offline test suite.

## Safety validation scope

`npm test` includes mutations of the versioned workflows: automatic triggers, misleading YAML
comments, duplicate keys, skipped/ignored confirmations, incorrect confirmation operators,
missing concurrency, oversized timeouts, and ignored cloud assertion failures.

Workflow YAML is parsed. The reviewed confirmation block and the direct cloud command are checked
conservatively; changing their shell structure requires a policy/test update. Simulation and
package checks retain the existing source-text invariants. This is a guard against accidental
drift in the reviewed repository, not a proof of arbitrary shell or TypeScript program safety.
