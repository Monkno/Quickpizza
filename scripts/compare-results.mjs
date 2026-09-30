import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";

const target = "https://quickpizza.grafana.com";
const profiles = { smoke: [1, 0, 0], baseline: [180, 1, 1], "light-ramp": [60, 0.5, 2] };
const metricNames = ["p50Ms", "p95Ms", "p99Ms", "maxMs"];

function validateMetrics(metrics, context) {
  if (
    !metrics ||
    !Number.isInteger(metrics.count) ||
    metrics.count < 1 ||
    !Number.isInteger(metrics.failed) ||
    metrics.failed < 0 ||
    metrics.failed > metrics.count
  ) {
    throw new Error(`${context}: invalid request counts`);
  }
  let previous = 0;
  for (const name of metricNames) {
    if (!Number.isFinite(metrics[name]) || metrics[name] < previous) {
      throw new Error(`${context}: response times must be finite, non-negative and ordered`);
    }
    previous = metrics[name];
  }
}

export function validateResult(run) {
  if (!run || run.schemaVersion !== 1) throw new Error("Expected result schemaVersion 1");
  for (const key of ["runId", "sourceSha", "gatlingVersion", "testId"]) {
    if (typeof run[key] !== "string" || !run[key].trim()) throw new Error(`Missing ${key}`);
  }
  if (!/^[a-f0-9]{40}$/i.test(run.sourceSha)) throw new Error("sourceSha must be a full Git SHA");
  if (run.target !== target) throw new Error("Unapproved target");
  if (
    !Object.hasOwn(profiles, run.profile) ||
    !isDeepStrictEqual(
      [run.durationSeconds, run.injection?.from, run.injection?.to],
      profiles[run.profile]
    )
  ) {
    throw new Error("Workload does not match a bounded profile");
  }
  if (run.generator?.count !== 1 || run.generator?.location !== "US East - N. Virginia") {
    throw new Error("Expected one approved generator");
  }
  if (
    typeof run.completedWorkload !== "boolean" ||
    !Array.isArray(run.anomalies) ||
    !run.anomalies.every((value) => typeof value === "string" && value.trim())
  ) {
    throw new Error("Record completedWorkload and an explicit anomalies array");
  }
  if (!Number.isInteger(run.unexpectedStatusCodes) || run.unexpectedStatusCodes < 0) {
    throw new Error("Record unexpectedStatusCodes");
  }
  const startedAt = run.evidence?.startedAtUtc;
  if (
    typeof startedAt !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(startedAt) ||
    !Number.isFinite(Date.parse(startedAt)) ||
    new Date(startedAt).toISOString().replace(".000Z", "Z") !== startedAt
  ) {
    throw new Error("UTC start must be a real ISO timestamp with second precision");
  }
  if (
    !/^https:\/\/github\.com\/Monkno\/Quickpizza\/actions\/runs\/\d+$/.test(run.evidence.github)
  ) {
    throw new Error("Missing GitHub execution evidence");
  }
  if (
    run.evidence.gatling !==
    `https://cloud.gatling.io/o/pushpoint-co/simulations/${run.testId}/runs/${run.runId}`
  ) {
    throw new Error("Gatling evidence must match the test and run IDs");
  }
  validateMetrics(run.global, "global");
  if (
    !Array.isArray(run.requests) ||
    run.requests.length !== 2 ||
    new Set(run.requests.map((request) => request.name)).size !== 2
  ) {
    throw new Error("Expected two uniquely named transactions");
  }
  for (const request of run.requests) {
    if (typeof request.name !== "string" || !request.name.trim())
      throw new Error("Missing transaction name");
    validateMetrics(request, request.name);
  }
  for (const key of ["count", "failed"]) {
    if (run.requests.reduce((sum, request) => sum + request[key], 0) !== run.global[key]) {
      throw new Error(`Transaction ${key} must sum to global ${key}`);
    }
  }
  if (run.global.maxMs !== Math.max(...run.requests.map((request) => request.maxMs))) {
    throw new Error("Global maximum must match the maximum transaction response time");
  }
  if (run.unexpectedStatusCodes > run.global.failed)
    throw new Error("Unexpected statuses exceed failures");
  return run;
}

function outcome(run) {
  if (run.anomalies.length) return "inconclusive";
  const expectedCount = { smoke: 2, baseline: 360, "light-ramp": 150 }[run.profile];
  if (
    !run.completedWorkload ||
    run.global.count !== expectedCount ||
    run.requests.some((request) => request.count !== expectedCount / 2) ||
    run.unexpectedStatusCodes ||
    run.global.failed ||
    run.global.p95Ms >= 2000 ||
    run.global.p99Ms >= 3000
  )
    return "fail";
  return "pass";
}

export function compareResults(reference, candidate) {
  validateResult(reference);
  validateResult(candidate);
  const runOutcome = outcome(candidate);
  const reasons = [];
  if (reference.runId === candidate.runId)
    reasons.push("A run cannot be its own comparison candidate");
  for (const key of [
    "target",
    "sourceSha",
    "gatlingVersion",
    "testId",
    "profile",
    "durationSeconds",
    "injection",
    "generator"
  ]) {
    if (!isDeepStrictEqual(reference[key], candidate[key])) reasons.push(`Incompatible ${key}`);
  }
  const names = (run) => run.requests.map((request) => request.name);
  if (!isDeepStrictEqual(names(reference), names(candidate)))
    reasons.push("Incompatible transaction sequence");
  if (outcome(reference) !== "pass") reasons.push("Reference is not a valid passing baseline");
  if (runOutcome === "inconclusive") reasons.push("Candidate has environmental anomalies");
  if (reasons.length) return { runOutcome, comparison: "inconclusive", reasons, changes: [] };

  const changes = [reference.global, ...reference.requests].map((before, index) => {
    const after = index === 0 ? candidate.global : candidate.requests[index - 1];
    const p95IncreasePercent = before.p95Ms === 0 ? null : (after.p95Ms / before.p95Ms - 1) * 100;
    const errorIncreasePoints = (after.failed / after.count - before.failed / before.count) * 100;
    return {
      name: index === 0 ? "Global" : before.name,
      p50ChangeMs: after.p50Ms - before.p50Ms,
      p95IncreasePercent,
      p99ChangeMs: after.p99Ms - before.p99Ms,
      errorIncreasePoints,
      candidateRegression:
        (before.p95Ms === 0 ? after.p95Ms > 0 : after.p95Ms > before.p95Ms * 1.25) ||
        errorIncreasePoints > 1
    };
  });
  return {
    runOutcome,
    comparison: changes.some((change) => change.candidateRegression)
      ? "candidate-regression"
      : "no-candidate-regression",
    reasons: [],
    changes
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 2)
      throw new Error("Usage: npm run results:compare -- reference.json candidate.json");
    const result = compareResults(...args.map((path) => JSON.parse(readFileSync(path, "utf8"))));
    console.log(JSON.stringify(result, null, 2));
    process.exitCode =
      result.runOutcome === "fail" || result.comparison === "candidate-regression"
        ? 1
        : result.comparison === "inconclusive"
          ? 2
          : 0;
  } catch (error) {
    console.error(`Result comparison rejected: ${error.message}`);
    process.exitCode = 2;
  }
}
