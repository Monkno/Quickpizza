## Purpose

Describe the performance-engineering change and why it is needed.

## Safety and scope checklist

- [ ] The repository, target, and profile were reconfirmed before making changes.
- [ ] This pull request does not add an automatic target or Gatling Cloud execution trigger.
- [ ] The target remains restricted to `https://quickpizza.grafana.com`.
- [ ] Workload rate, concurrency, duration, and iteration count remain finite and documented.
- [ ] No retry, schedule, arbitrary host, or additional load generator was introduced.
- [ ] No credential, token, response body, or personal data is present in code, logs, or artifacts.
- [ ] Read/write endpoint side effects were reviewed.
- [ ] `npm ci` and `npm run quality` pass without sending target traffic.
- [ ] Any requested cloud run has a documented purpose, cost estimate, abort criteria, and remaining
      credit check.

## Evidence

- Quality run:
- Gatling report, when an execution was separately authorized:
- Result classification: Not run / Pass / Fail / Inconclusive
- Credits consumed and remaining:

## Limitations

State which conclusions cannot be made from the available black-box telemetry.
