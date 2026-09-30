import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { compareResults, validateResult } from "../scripts/compare-results.mts";
import type { RunSummary } from "../scripts/result-types.mts";

const baselinePath = new URL("../docs/results/2026-09-15-cloud-baseline.json", import.meta.url);
const rampPath = new URL("../docs/results/2026-09-16-cloud-light-ramp.json", import.meta.url);
const baseline = validateResult(JSON.parse(readFileSync(baselinePath, "utf8")));
const ramp = validateResult(JSON.parse(readFileSync(rampPath, "utf8")));

// Modified runs are synthetic test cases, never new execution evidence.
function candidate() {
  const run = structuredClone(baseline);
  run.runId = "synthetic_candidate";
  run.evidence.gatling = run.evidence.gatling.replace(baseline.runId, run.runId);
  return run;
}

test("historical evidence validates, but baseline versus ramp is inconclusive", () => {
  assert.equal(validateResult(baseline), baseline);
  assert.equal(validateResult(ramp), ramp);
  const result = compareResults(baseline, ramp);
  assert.equal(result.runOutcome, "pass");
  assert.equal(result.comparison, "inconclusive");
  assert.ok(result.reasons.includes("Incompatible profile"));
  assert.deepEqual(result.changes, []);
});

test("same-run comparison cannot masquerade as regression evidence", () => {
  assert.equal(compareResults(baseline, baseline).comparison, "inconclusive");
});

test("compatible synthetic observation has no candidate regression", () => {
  assert.equal(compareResults(baseline, candidate()).comparison, "no-candidate-regression");
});

test("a 25 percent p95 increase is not a candidate, but more than 25 percent is", () => {
  const run = candidate();
  run.global.p95Ms = 55;
  run.global.p99Ms = 56;
  assert.equal(compareResults(baseline, run).comparison, "no-candidate-regression");
  run.global.p95Ms = 55.01;
  assert.equal(compareResults(baseline, run).comparison, "candidate-regression");
});

test("transaction regression is visible even when the global p95 is unchanged", () => {
  const run = candidate();
  run.requests[1].p95Ms = 19;
  run.requests[1].p99Ms = 20;
  const result = compareResults(baseline, run);
  assert.equal(result.comparison, "candidate-regression");
  assert.equal(result.changes[2].name, "Load public configuration");
  assert.equal(result.changes[0].candidateRegression, false);
});

test("failed request is a failed run even below the error regression threshold", () => {
  const run = candidate();
  run.global.failed = run.requests[0].failed = 1;
  const result = compareResults(baseline, run);
  assert.equal(result.runOutcome, "fail");
  assert.equal(result.comparison, "no-candidate-regression");
});

test("error regression uses percentage points at each transaction", () => {
  const run = candidate();
  run.global.failed = run.requests[0].failed = 2;
  const result = compareResults(baseline, run);
  assert.equal(result.changes[0].candidateRegression, false);
  assert.equal(result.changes[1].candidateRegression, true);
});

const failedRunCases: [string, (run: RunSummary) => void][] = [
  [
    "p95 guardrail equality",
    (run) => {
      run.global.p95Ms = 2000;
      run.global.p99Ms = 2100;
      run.global.maxMs = 2200;
      run.requests[0].maxMs = 2200;
    }
  ],
  [
    "p99 guardrail equality",
    (run) => {
      run.global.p99Ms = run.global.maxMs = 3000;
      run.requests[0].maxMs = 3000;
    }
  ],
  [
    "incomplete workload",
    (run) => {
      run.completedWorkload = false;
    }
  ],
  [
    "incorrect achieved volume",
    (run) => {
      run.global.count = 358;
      run.requests.forEach((request) => {
        request.count = 179;
      });
    }
  ]
];
for (const [name, update] of failedRunCases) {
  test(`run fails for ${name}`, () => {
    const run = candidate();
    update(run);
    assert.equal(compareResults(baseline, run).runOutcome, "fail");
  });
}

test("environmental anomaly is inconclusive and never authorizes a retry", () => {
  const run = candidate();
  run.anomalies.push("Synthetic generator saturation");
  const result = compareResults(baseline, run);
  assert.equal(result.runOutcome, "inconclusive");
  assert.equal(result.comparison, "inconclusive");
});

test("a failed reference cannot establish a regression baseline", () => {
  const reference = structuredClone(baseline);
  reference.global.failed = reference.requests[0].failed = 1;
  assert.equal(compareResults(reference, candidate()).comparison, "inconclusive");
});

test("unknown configuration and changed transaction sequence are incompatible", () => {
  const run = candidate();
  run.sourceSha = "a".repeat(40);
  run.requests.reverse();
  const result = compareResults(baseline, run);
  assert.ok(result.reasons.includes("Incompatible sourceSha"));
  assert.ok(result.reasons.includes("Incompatible transaction sequence"));
});

const invalidSummaryCases: [string, (run: RunSummary) => void][] = [
  [
    "missing evidence",
    (run) => {
      Reflect.deleteProperty(run, "evidence");
    }
  ],
  [
    "impossible global maximum",
    (run) => {
      run.global.maxMs = 50;
    }
  ],
  [
    "nonexistent calendar date",
    (run) => {
      run.evidence.startedAtUtc = "2026-02-30T12:00:00Z";
    }
  ],
  [
    "missing anomaly review",
    (run) => {
      Reflect.deleteProperty(run, "anomalies");
    }
  ],
  [
    "negative latency",
    (run) => {
      run.global.p50Ms = -1;
    }
  ],
  [
    "unordered percentiles",
    (run) => {
      run.global.p95Ms = 500;
    }
  ],
  [
    "non-finite latency",
    (run) => {
      run.global.p95Ms = Infinity;
    }
  ],
  [
    "impossible failures",
    (run) => {
      run.global.failed = 361;
    }
  ],
  [
    "inconsistent counts",
    (run) => {
      run.global.count = 359;
    }
  ],
  [
    "duplicate names",
    (run) => {
      run.requests[1].name = run.requests[0].name;
    }
  ],
  [
    "unapproved target",
    (run) => {
      run.target = "https://example.com";
    }
  ],
  [
    "higher load",
    (run) => {
      run.injection.to = 100;
    }
  ],
  [
    "unknown schema",
    (run) => {
      Reflect.set(run, "schemaVersion", 2);
    }
  ]
];
for (const [name, update] of invalidSummaryCases) {
  test(`invalid summary rejects ${name}`, () => {
    const run = candidate();
    update(run);
    assert.throws(() => compareResults(baseline, run));
  });
}

test("CLI returns exit 2 for incompatible historical runs", () => {
  const result = spawnSync(
    process.execPath,
    [
      fileURLToPath(new URL("../scripts/compare-results.mts", import.meta.url)),
      fileURLToPath(baselinePath),
      fileURLToPath(rampPath)
    ],
    { encoding: "utf8" }
  );
  assert.equal(result.status, 2, result.stderr);
  assert.equal(JSON.parse(result.stdout).comparison, "inconclusive");
});
