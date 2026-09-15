import {
  atOnceUsers,
  getParameter,
  global,
  group,
  jmesPath,
  pause,
  scenario,
  simulation,
  substring
} from "@gatling.io/core";
import { http, status } from "@gatling.io/http";

const APPROVED_BASE_URL = "https://quickpizza.grafana.com";
const APPROVED_PROFILE = "smoke";

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

export default simulation((setUp) => {
  const requestedBaseUrl = normalizeBaseUrl(getParameter("baseUrl", APPROVED_BASE_URL));
  const requestedProfile = getParameter("profile", APPROVED_PROFILE);

  if (requestedBaseUrl !== APPROVED_BASE_URL) {
    throw new Error(`Rejected unapproved target: ${requestedBaseUrl}`);
  }

  if (requestedProfile !== APPROVED_PROFILE) {
    throw new Error(
      `Rejected unsupported profile: ${requestedProfile}. Only '${APPROVED_PROFILE}' is implemented.`
    );
  }

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

  setUp(journey.injectOpen(atOnceUsers(1)))
    .assertions(
      global().failedRequests().count().is(0),
      global().responseTime().percentile3().lt(2000),
      global().responseTime().percentile4().lt(3000)
    )
    .protocols(httpProtocol);
});
