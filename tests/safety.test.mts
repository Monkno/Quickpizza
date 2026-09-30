import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { verifySafety } from "../scripts/verify-safety.mts";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const cloud = ".github/workflows/gatling-cloud-smoke.yml";

test("versioned repository passes without executing Gatling", () => {
  assert.deepEqual(verifySafety(read), []);
});

const mutations: [string, string, string, string][] = [
  [
    "cloud start after failed confirmation",
    cloud,
    "        id: cloud_smoke",
    "        id: cloud_smoke\n        if: always()"
  ],
  [
    "ignored cloud assertions",
    cloud,
    "        id: cloud_smoke",
    "        id: cloud_smoke\n        continue-on-error: true"
  ],
  ["shell-masked cloud failure", cloud, "--wait-for-run-end", "--wait-for-run-end || true"],
  [
    "skipped confirmation",
    cloud,
    "      - name: Validate explicit run confirmation",
    "      - name: Validate explicit run confirmation\n        if: false"
  ],
  [
    "ignored confirmation error",
    cloud,
    "      - name: Validate explicit run confirmation",
    "      - name: Validate explicit run confirmation\n        continue-on-error: true"
  ],
  [
    "overwritten confirmation",
    cloud,
    "          if [",
    "          RUN_CONFIRMATION=RUN_ONE_CREDIT_SMOKE\n          if ["
  ],
  [
    "unapproved target",
    "src/quickPizza.gatling.ts",
    'const APPROVED_BASE_URL = "https://quickpizza.grafana.com";',
    'const APPROVED_BASE_URL = "https://example.com";'
  ],
  ["higher ramp", "src/quickPizza.gatling.ts", ".to(2).during(60)", ".to(20).during(60)"],
  [
    "extra anonymous request",
    "src/quickPizza.gatling.ts",
    'http("GET homepage")',
    'http("extra request").get("/"), http("GET homepage")'
  ],
  ["automatic cloud trigger", cloud, "  workflow_dispatch:", "  push:\n  workflow_dispatch:"],
  [
    "schedule hidden behind YAML flow syntax",
    cloud,
    "  workflow_dispatch:",
    '  schedule: [{cron: "0 * * * *"}]\n  workflow_dispatch:'
  ],
  [
    "missing environment with a misleading comment",
    cloud,
    "    environment: performance",
    "    # environment: performance"
  ],
  ["unbounded timeout", cloud, "timeout-minutes: 10", "timeout-minutes: 100"],
  [
    "confirmation accepts mismatches",
    cloud,
    'if [ "$RUN_CONFIRMATION" !=',
    'if [ "$RUN_CONFIRMATION" ='
  ],
  ["commented-out confirmation exit", cloud, "            exit 1", "            # exit 1"],
  [
    "missing concurrency with misleading text",
    cloud,
    "  group: quickpizza-gatling-cloud-run",
    "  # group: quickpizza-gatling-cloud-run"
  ],
  [
    "duplicate YAML job key",
    cloud,
    "    timeout-minutes: 10",
    "    timeout-minutes: 10\n    timeout-minutes: 100"
  ],
  [
    "automatic protocol smoke",
    ".github/workflows/protocol-smoke.yml",
    "  workflow_dispatch:",
    "  push:\n  workflow_dispatch:"
  ],
  [
    "cloud run in quality",
    ".github/workflows/quality.yml",
    "run: npm run quality",
    "run: npx gatling enterprise-start"
  ]
];

for (const [name, path, before, after] of mutations) {
  test(`safety policy rejects ${name}`, () => {
    assert.ok(read(path).includes(before), "mutation must exercise the current source");
    const failures = verifySafety((file) =>
      file === path ? read(file).replace(before, after) : read(file)
    );
    assert.ok(failures.length > 0, "unsafe repository must fail validation");
  });
}
