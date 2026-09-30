import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { parse } from "yaml";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export function verifySafety(read) {
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

  function verifyWorkflow(path, triggers, cloudTest, maximumTimeout = 10) {
    let workflow;
    try {
      workflow = parse(read(path), { uniqueKeys: true });
    } catch (error) {
      failures.push(`${path}: invalid YAML: ${error.message}`);
      return;
    }
    const events =
      typeof workflow?.on === "string"
        ? [workflow.on]
        : Array.isArray(workflow?.on)
          ? workflow.on
          : Object.keys(workflow?.on ?? {});
    if (JSON.stringify(events.toSorted()) !== JSON.stringify(triggers.toSorted())) {
      failures.push(`${path}: expected only ${triggers.join(", ")} triggers`);
    }
    const jobs = Object.values(workflow?.jobs ?? {});
    if (jobs.length !== 1) failures.push(`${path}: expected exactly one job`);
    for (const job of jobs) {
      if (triggers.includes("workflow_dispatch")) {
        if (job.environment !== "performance")
          failures.push(`${path}: missing performance environment`);
        if (
          !Number.isInteger(job["timeout-minutes"]) ||
          job["timeout-minutes"] > maximumTimeout ||
          job["timeout-minutes"] < 1
        ) {
          failures.push(`${path}: timeout must be between 1 and ${maximumTimeout} minutes`);
        }
      }
      const commands = (job.steps ?? []).map((step) => step.run ?? "").join("\n");
      const starts = commands.match(/\benterprise-start\b/g)?.length ?? 0;
      if (starts !== (cloudTest ? 1 : 0))
        failures.push(`${path}: unexpected cloud start count ${starts}`);
      if (cloudTest) {
        const guard = (job.steps ?? []).findIndex(
          (step) =>
            step.if === undefined &&
            (step["continue-on-error"] === undefined || step["continue-on-error"] === false) &&
            (step.shell === undefined || step.shell === "bash") &&
            step.env?.RUN_CONFIRMATION === "${{ inputs.confirmation }}" &&
            new RegExp(
              `^\\s*if \\[ "\\$RUN_CONFIRMATION" != "${cloudTest.confirmation}" \\]; then\\s*\\n\\s*echo "[^"\\n]*"\\s*\\n\\s*exit 1\\s*\\n\\s*fi\\s*$`
            ).test(step.run ?? "")
        );
        const start = (job.steps ?? []).findIndex((step) => step.run?.includes("enterprise-start"));
        const startStep = job.steps?.[start];
        if (
          startStep?.if !== undefined ||
          (startStep?.["continue-on-error"] !== undefined &&
            startStep["continue-on-error"] !== false) ||
          (job["continue-on-error"] !== undefined && job["continue-on-error"] !== false)
        ) {
          failures.push(
            `${path}: cloud execution must respect previous failures and assertion failures`
          );
        }
        if (guard < 0 || guard >= start)
          failures.push(`${path}: confirmation must reject before cloud execution`);
        if (
          workflow.concurrency?.group !== "quickpizza-gatling-cloud-run" ||
          workflow.concurrency?.["cancel-in-progress"] !== false
        ) {
          failures.push(`${path}: cloud runs must share the non-cancelling concurrency lock`);
        }
        const confirmationInput = workflow.on?.workflow_dispatch?.inputs?.confirmation;
        if (confirmationInput?.required !== true || confirmationInput?.type !== "string") {
          failures.push(`${path}: confirmation must be a required string input`);
        }
        const command = job.steps?.[start]?.run ?? "";
        if (
          !command.trim().startsWith("npx gatling enterprise-start ") ||
          /[;|&\r\n]|\$\(/.test(command.trim())
        ) {
          failures.push(
            `${path}: cloud execution must be one direct command without retry or error masking`
          );
        }
        if (
          !command.includes(`--enterprise-simulation="${cloudTest.simulation}"`) ||
          !command.includes("--non-interactive") ||
          !command.includes("--wait-for-run-end")
        ) {
          failures.push(
            `${path}: cloud command must run the approved test and wait for assertions`
          );
        }
      }
    }
  }

  verifyWorkflow(".github/workflows/quality.yml", ["push", "pull_request"]);
  verifyWorkflow(".github/workflows/gatling-deploy.yml", ["workflow_dispatch"]);
  verifyWorkflow(".github/workflows/protocol-smoke.yml", ["workflow_dispatch"], undefined, 5);

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
  requireText(
    simulation,
    "Object.hasOwn(injectionProfiles, requestedProfile)",
    "profile allowlist"
  );
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
      simulation: "QuickPizza - Anonymous Smoke",
      maximumTimeout: 10
    },
    {
      path: ".github/workflows/gatling-cloud-baseline.yml",
      confirmation: "RUN_THREE_CREDIT_BASELINE",
      simulation: "QuickPizza - Anonymous Baseline",
      maximumTimeout: 12
    },
    {
      path: ".github/workflows/gatling-cloud-light-ramp.yml",
      confirmation: "RUN_TWO_CREDIT_LIGHT_RAMP",
      simulation: "QuickPizza - Anonymous Light Ramp",
      maximumTimeout: 12
    }
  ];

  for (const workflow of cloudWorkflows) {
    verifyWorkflow(workflow.path, ["workflow_dispatch"], workflow, workflow.maximumTimeout);
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

  return failures;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const failures = verifySafety((path) => readFileSync(resolve(repositoryRoot, path), "utf8"));
  if (failures.length > 0) {
    console.error("QuickPizza safety-policy verification failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log(
    "QuickPizza safety policy verified without target traffic or Gatling Cloud execution."
  );
}
