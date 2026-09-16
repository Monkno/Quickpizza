import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(resolve(repositoryRoot, path), "utf8");
const failures = [];

function requireText(content, expected, context) {
  if (!content.includes(expected)) {
    failures.push(`${context}: missing ${JSON.stringify(expected)}`);
  }
}

function rejectText(content, rejected, context) {
  if (content.includes(rejected)) {
    failures.push(`${context}: forbidden ${JSON.stringify(rejected)}`);
  }
}

function requireCount(content, expression, expected, context) {
  const actual = content.match(expression)?.length ?? 0;
  if (actual !== expected) {
    failures.push(`${context}: expected ${expected} matches for ${expression}, found ${actual}`);
  }
}

const simulation = read("src/quickPizza.gatling.ts");
const packageConfiguration = read(".gatling/package.conf");
const qualityWorkflow = read(".github/workflows/quality.yml");
const deployWorkflow = read(".github/workflows/gatling-deploy.yml");

requireText(
  simulation,
  'const APPROVED_BASE_URL = "https://quickpizza.grafana.com";',
  "simulation target"
);
requireText(simulation, "if (requestedBaseUrl !== APPROVED_BASE_URL)", "target allowlist");
requireText(simulation, "smoke: atOnceUsers(1)", "smoke profile");
requireText(simulation, "baseline: constantUsersPerSec(1).during(180)", "baseline profile");
requireText(
  simulation,
  '"light-ramp": rampUsersPerSec(0.5).to(2).during(60)',
  "light-ramp profile"
);
requireText(simulation, "Object.hasOwn(injectionProfiles, requestedProfile)", "profile allowlist");
requireText(simulation, ".disableWarmUp()", "warm-up control");
requireText(simulation, "global().failedRequests().count().is(0)", "error assertion");
requireText(simulation, "global().responseTime().percentile3().lt(2000)", "p95 assertion");
requireText(simulation, "global().responseTime().percentile4().lt(3000)", "p99 assertion");
requireCount(simulation, /http\("/g, 2, "anonymous request count");

requireText(packageConfiguration, 'name = "US East - N. Virginia"', "generator location");
requireText(packageConfiguration, "size = 1", "generator size");
requireText(packageConfiguration, "weight = 100", "generator allocation");
requireText(packageConfiguration, "useDedicatedIps = false", "dedicated IP policy");
requireText(packageConfiguration, 'baseUrl = "https://quickpizza.grafana.com"', "cloud target");
requireCount(packageConfiguration, /id = "test_/g, 3, "deployed cloud test count");

requireText(qualityWorkflow, "push:", "quality trigger");
requireText(qualityWorkflow, "pull_request:", "quality trigger");
rejectText(qualityWorkflow, "enterprise-start", "quality workflow");
rejectText(deployWorkflow, "enterprise-start", "deploy-only workflow");
requireText(deployWorkflow, "environment: performance", "deploy environment gate");

const cloudWorkflows = [
  {
    path: ".github/workflows/gatling-cloud-smoke.yml",
    confirmation: "RUN_ONE_CREDIT_SMOKE",
    simulation: "QuickPizza - Anonymous Smoke"
  },
  {
    path: ".github/workflows/gatling-cloud-baseline.yml",
    confirmation: "RUN_THREE_CREDIT_BASELINE",
    simulation: "QuickPizza - Anonymous Baseline"
  },
  {
    path: ".github/workflows/gatling-cloud-light-ramp.yml",
    confirmation: "RUN_TWO_CREDIT_LIGHT_RAMP",
    simulation: "QuickPizza - Anonymous Light Ramp"
  }
];

for (const workflow of cloudWorkflows) {
  const content = read(workflow.path);
  requireText(content, "workflow_dispatch:", `${workflow.path} trigger`);
  requireText(content, workflow.confirmation, `${workflow.path} confirmation`);
  requireText(content, "group: quickpizza-gatling-cloud-run", `${workflow.path} concurrency`);
  requireText(content, "cancel-in-progress: false", `${workflow.path} cancellation policy`);
  requireText(content, "environment: performance", `${workflow.path} environment gate`);
  requireText(
    content,
    `--enterprise-simulation="${workflow.simulation}"`,
    `${workflow.path} cloud test`
  );
  requireText(content, "--non-interactive", `${workflow.path} interaction mode`);
  requireText(content, "--wait-for-run-end", `${workflow.path} result wait`);
  rejectText(content, "schedule:", `${workflow.path} trigger`);
  rejectText(content, "pull_request:", `${workflow.path} trigger`);
  rejectText(content, "push:", `${workflow.path} trigger`);
}

if (failures.length > 0) {
  console.error("QuickPizza safety-policy verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("QuickPizza safety policy verified without target traffic or Gatling Cloud execution.");
