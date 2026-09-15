# Baseline Governance

This procedure defines how QuickPizza performance results are compared and interpreted. It
applies only to the bounded anonymous journey against the shared public demo.

## Comparison eligibility

A run is eligible for comparison only when all of the following match:

- Target: `https://quickpizza.grafana.com`.
- Simulation source and package version, identified by Git commit SHA.
- Workload profile, duration, injection model, and request sequence.
- One load generator in `US East - N. Virginia`.
- Gatling test configuration and stop criteria.
- No known target throttling, load-generator saturation, overlapping project run, or material
  execution interruption.

Time of day and external traffic cannot be controlled on the shared demo. Record them as context;
do not claim causal conclusions from client-side metrics alone.

## Required evidence

Record the following for every cloud run:

- GitHub Actions run and Gatling report URLs.
- UTC start time, commit SHA, profile, configured duration, and achieved duration.
- Configured and achieved journey/request rate.
- Total requests, error rate, failed checks, and unexpected status codes.
- Global and per-request p50, p95, p99, and maximum response time.
- Generator count/location, credits consumed, and team credits remaining.
- Any observed environmental anomaly or early-stop event.

Use [the run-result template](results/RUN_RESULT_TEMPLATE.md) so missing evidence remains visible.

## Classification

### Pass

A run passes when it is eligible, completes the intended workload, has no failed checks, and
satisfies all versioned assertions:

- Failed request count: exactly zero.
- Global p95: less than 2,000 ms.
- Global p99: less than 3,000 ms.

These are safety guardrails for the demo, not service-level objectives.

### Fail

A run fails when the test evidence is valid and any assertion fails, an unexpected response code
occurs, the achieved workload materially diverges from the model, or the run triggers a configured
stop criterion.

### Inconclusive

A run is inconclusive when it cannot support a fair comparison, including target throttling,
external instability, generator degradation, an incompatible configuration, or incomplete
evidence. Inconclusive does not mean pass. It also does not authorize an automatic rerun.

## Regression assessment

Compare compatible runs by stable transaction name. A result is a candidate regression when:

- p95 increases by more than 25% without a workload increase; or
- error rate increases by more than one percentage point.

Also inspect p50 and p99 to distinguish a broad shift from tail-only latency. A candidate
regression requires human review because the shared target has no correlated server-side metrics.
Do not report a root cause unless independent evidence supports it.

The first valid baseline is a reference observation, not a statistically stable performance
standard. Promote thresholds only after compatible observations show that they are repeatable.

## Change and execution control

- Threshold changes require a committed rationale linked to eligible run evidence.
- Keep request names stable; a rename begins a new comparison series.
- Run profiles sequentially under the shared CI concurrency lock.
- Cloud workflows remain manual-only, require their literal confirmation value, and must never
  retry or run on a schedule.
- Check the team quota before every dispatch. Preserve the campaign investigation buffer.
- Execute the light ramp only after a healthy baseline and a credit check show that the approved
  campaign budget will remain valid.
- Never reuse a human browser token or add the authenticated pizza operation to this anonymous
  baseline.

## Retention

Commit the concise findings record to `docs/results/`. Keep the Gatling report URL as the primary
interactive evidence and the GitHub Actions URL as execution evidence. Do not commit credentials,
response bodies, personal data, or generated Gatling report bundles.
