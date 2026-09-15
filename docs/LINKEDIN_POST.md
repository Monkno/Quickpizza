# LinkedIn Educational Post

## Ready-to-publish copy

Performance testing is not always about finding the breaking point.

I recently built a black-box performance engineering capability for QuickPizza, a shared public
demo, using TypeScript, Gatling Enterprise Cloud, and GitHub Actions.

The constraints shaped the solution:

- No access to application source code or infrastructure telemetry.
- No dedicated environment.
- A limited cloud-credit budget.
- No justification for stressing a service shared with other users.

Instead of maximizing load, I optimized for controlled and explainable evidence:

- One fixed HTTPS target; arbitrary hosts are rejected.
- Two anonymous, read-only requests with protocol and content checks.
- Finite smoke, baseline, and light-ramp profiles.
- No automatic cloud execution on pushes or pull requests.
- Separate deploy-only and run workflows.
- Manual confirmation, hard timeouts, stop criteria, and one concurrency lock.
- Versioned rules for pass, fail, inconclusive, and baseline compatibility.

The three-minute baseline completed 360 requests with 0% errors, a 44 ms p95, and a 45 ms p99.
Those numbers are a point-in-time external observation—not an SLO or a capacity claim.

The most useful outcome was actually deciding not to run the next test. Initialization plus the
baseline consumed four credits. Running the light ramp would have broken the investigation buffer
defined before execution, so the campaign stopped even though the script was ready.

That is one of my favorite QA lessons from this exercise:

Good performance engineering is not measured by how much traffic we generate. It is measured by
whether the evidence is reproducible, the conclusions match the available telemetry, and the test
stops before its cost or risk exceeds its value.

The implementation, test plan, evidence index, run results, and demonstration guide are available
here:

<https://github.com/Monkno/Quickpizza>

#PerformanceTesting #QualityEngineering #QAautomation #Gatling #Observability #TypeScript
#GitHubActions #SoftwareTesting

## Suggested post structure

Use four images or carousel panels:

1. **Constraint:** shared black-box environment and limited credits.
2. **Controls:** fixed target, bounded profiles, manual workflow, and concurrency lock.
3. **Evidence:** 360 requests, 0% errors, 44 ms p95, and 45 ms p99.
4. **Decision:** the ramp was ready but intentionally deferred to preserve the credit buffer.

## Accuracy notes

- Describe the result as an external protocol-level observation.
- Do not call the first baseline an SLO, benchmark, or capacity certification.
- Do not imply access to QuickPizza server logs, traces, or infrastructure metrics.
- Do not present the deferred light ramp as an executed result.
- Keep the short repository URL so the post continues to point to the default branch.
