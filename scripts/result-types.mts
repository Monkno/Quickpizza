export type Profile = "smoke" | "baseline" | "light-ramp";
export type RunOutcome = "pass" | "fail" | "inconclusive";
export type ComparisonOutcome = "inconclusive" | "candidate-regression" | "no-candidate-regression";

export interface ResponseMetrics {
  count: number;
  failed: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  maxMs: number;
}

export interface TransactionMetrics extends ResponseMetrics {
  name: string;
}

export interface RunSummary {
  schemaVersion: 1;
  runId: string;
  sourceSha: string;
  gatlingVersion: string;
  testId: string;
  target: string;
  profile: Profile;
  durationSeconds: number;
  injection: { from: number; to: number };
  generator: { count: number; location: string };
  completedWorkload: boolean;
  anomalies: string[];
  unexpectedStatusCodes: number;
  global: ResponseMetrics;
  requests: TransactionMetrics[];
  evidence: { startedAtUtc: string; github: string; gatling: string };
}

export interface MetricChange {
  name: string;
  p50ChangeMs: number;
  p95IncreasePercent: number | null;
  p99ChangeMs: number;
  errorIncreasePoints: number;
  candidateRegression: boolean;
}

export interface ComparisonResult {
  runOutcome: RunOutcome;
  comparison: ComparisonOutcome;
  reasons: string[];
  changes: MetricChange[];
}
