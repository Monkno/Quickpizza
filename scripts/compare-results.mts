import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import type {
  ComparisonResult,
  Profile,
  ResponseMetrics,
  RunOutcome,
  RunSummary,
  TransactionMetrics
} from "./result-types.mts";

const target = "https://quickpizza.grafana.com";
const profiles = { smoke: [1, 0, 0], baseline: [180, 1, 1], "light-ramp": [60, 0.5, 2] };
const metricNames = ["p50Ms", "p95Ms", "p99Ms", "maxMs"] as const;

function record(value: unknown, context: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${context}: expected an object`);
  }
  return value as Record<string, unknown>;
}

function string(value: unknown, context: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`Missing ${context}`);
  return value;
}

function validateMetrics(value: unknown, context: string): ResponseMetrics {
  const metrics = record(value, context);
  if (
    typeof metrics.count !== "number" ||
    typeof metrics.failed !== "number" ||
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
    const metric = metrics[name];
    if (typeof metric !== "number" || !Number.isFinite(metric) || metric < previous) {
      throw new Error(`${context}: response times must be finite, non-negative and ordered`);
    }
    previous = metric;
  }
  return metrics as unknown as ResponseMetrics;
}

export function validateResult(value: unknown): RunSummary {
  const run = record(value, "result");
  if (!run || run.schemaVersion !== 1) throw new Error("Expected result schemaVersion 1");
  for (const key of ["runId", "sourceSha", "gatlingVersion", "testId"]) {
    if (typeof run[key] !== "string" || !run[key].trim()) throw new Error(`Missing ${key}`);
  }
  if (!/^[a-f0-9]{40}$/i.test(string(run.sourceSha, "sourceSha")))
    throw new Error("sourceSha must be a full Git SHA");
  if (run.target !== target) throw new Error("Unapproved target");
  if (
    typeof run.profile !== "string" ||
    !Object.hasOwn(profiles, run.profile) ||
    !isDeepStrictEqual(
      [
        run.durationSeconds,
        record(run.injection, "injection").from,
        record(run.injection, "injection").to
      ],
      profiles[run.profile as Profile]
    )
  ) {
    throw new Error("Workload does not match a bounded profile");
  }
  const generator = record(run.generator, "generator");
  if (generator.count !== 1 || generator.location !== "US East - N. Virginia") {
    throw new Error("Expected one approved generator");
  }
  if (
    typeof run.completedWorkload !== "boolean" ||
    !Array.isArray(run.anomalies) ||
    !run.anomalies.every((value) => typeof value === "string" && value.trim())
  ) {
    throw new Error("Record completedWorkload and an explicit anomalies array");
  }
  if (
    typeof run.unexpectedStatusCodes !== "number" ||
    !Number.isInteger(run.unexpectedStatusCodes) ||
    run.unexpectedStatusCodes < 0
  ) {
    throw new Error("Record unexpectedStatusCodes");
  }
  const evidence = record(run.evidence, "evidence");
  const startedAt = evidence.startedAtUtc;
  if (
    typeof startedAt !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(startedAt) ||
    !Number.isFinite(Date.parse(startedAt)) ||
    new Date(startedAt).toISOString().replace(".000Z", "Z") !== startedAt
  ) {
    throw new Error("UTC start must be a real ISO timestamp with second precision");
  }
  if (
    !/^https:\/\/github\.com\/Monkno\/Quickpizza\/actions\/runs\/\d+$/.test(
      string(evidence.github, "GitHub execution evidence")
    )
  ) {
    throw new Error("Missing GitHub execution evidence");
  }
  if (
    evidence.gatling !==
    `https://cloud.gatling.io/o/pushpoint-co/simulations/${run.testId}/runs/${run.runId}`
  ) {
    throw new Error("Gatling evidence must match the test and run IDs");
  }
  const globalMetrics = validateMetrics(run.global, "global");
  if (
    !Array.isArray(run.requests) ||
    run.requests.length !== 2 ||
    new Set(run.requests.map((request: unknown) => record(request, "transaction").name)).size !== 2
  ) {
    throw new Error("Expected two uniquely named transactions");
  }
  const requests = run.requests.map((value: unknown): TransactionMetrics => {
    const request = record(value, "transaction");
    if (typeof request.name !== "string" || !request.name.trim())
      throw new Error("Missing transaction name");
    validateMetrics(request, request.name);
    return request as unknown as TransactionMetrics;
  });
  for (const key of ["count", "failed"] as const) {
    if (requests.reduce((sum, request) => sum + request[key], 0) !== globalMetrics[key]) {
      throw new Error(`Transaction ${key} must sum to global ${key}`);
    }
  }
  if (globalMetrics.maxMs !== Math.max(...requests.map((request) => request.maxMs))) {
    throw new Error("Global maximum must match the maximum transaction response time");
  }
  if (run.unexpectedStatusCodes > globalMetrics.failed)
    throw new Error("Unexpected statuses exceed failures");
  return run as unknown as RunSummary;
}

function outcome(run: RunSummary): RunOutcome {
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

export function compareResults(referenceValue: unknown, candidateValue: unknown): ComparisonResult {
  const reference = validateResult(referenceValue);
  const candidate = validateResult(candidateValue);
  const runOutcome = outcome(candidate);
  const reasons: string[] = [];
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
  ] as const) {
    if (!isDeepStrictEqual(reference[key], candidate[key])) reasons.push(`Incompatible ${key}`);
  }
  const names = (run: RunSummary) => run.requests.map((request) => request.name);
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
      name: index === 0 ? "Global" : reference.requests[index - 1].name,
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
    const result = compareResults(
      JSON.parse(readFileSync(args[0], "utf8")),
      JSON.parse(readFileSync(args[1], "utf8"))
    );
    console.log(JSON.stringify(result, null, 2));
    process.exitCode =
      result.runOutcome === "fail" || result.comparison === "candidate-regression"
        ? 1
        : result.comparison === "inconclusive"
          ? 2
          : 0;
  } catch (error) {
    console.error(
      `Result comparison rejected: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exitCode = 2;
  }
}
