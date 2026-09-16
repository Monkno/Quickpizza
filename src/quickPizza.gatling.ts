import {
  atOnceUsers,
  constantUsersPerSec,
  getParameter,
  global,
  group,
  jmesPath,
  pause,
  rampUsersPerSec,
  scenario,
  simulation,
  substring
} from "@gatling.io/core";
import { http, status } from "@gatling.io/http";

const APPROVED_BASE_URL = "https://quickpizza.grafana.com";
const DEFAULT_PROFILE = "smoke";

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

export default simulation((setUp) => {
  const requestedBaseUrl = normalizeBaseUrl(getParameter("baseUrl", APPROVED_BASE_URL));
  const requestedProfile = getParameter("profile", DEFAULT_PROFILE);

  if (requestedBaseUrl !== APPROVED_BASE_URL) {
    throw new Error(`Rejected unapproved target: ${requestedBaseUrl}`);
  }

  const injectionProfiles = {
    smoke: atOnceUsers(1),
    baseline: constantUsersPerSec(1).during(180),
    "light-ramp": rampUsersPerSec(0.5).to(2).during(60)
  };

  if (!Object.hasOwn(injectionProfiles, requestedProfile)) {
    throw new Error(`Rejected unsupported profile: ${requestedProfile}.`);
  }

  const approvedProfile = requestedProfile as keyof typeof injectionProfiles;

  const httpProtocol = http
    .baseUrl(APPROVED_BASE_URL)
    .acceptHeader("application/json, text/html;q=0.9")
    .contentTypeHeader("application/json")
    .userAgentHeader("QuickPizza-Gatling/1.0 (controlled shared-demo test)")
    .disableWarmUp();

  const journey = scenario("QuickPizza - Read anonymous public surfaces").exec(
    group("Open QuickPizza").on(
      http("GET homepage").get("/").check(status().is(200), substring("QuickPizza"))
    ),
    pause(1, 2),
    group("Load public configuration").on(
      http("GET public configuration")
        .get("/api/config")
        .check(status().is(200), jmesPath("@").ofMap().exists())
    )
  );

  setUp(journey.injectOpen(injectionProfiles[approvedProfile]))
    .assertions(
      global().failedRequests().count().is(0),
      global().responseTime().percentile3().lt(2000),
      global().responseTime().percentile4().lt(3000)
    )
    .protocols(httpProtocol);
});
