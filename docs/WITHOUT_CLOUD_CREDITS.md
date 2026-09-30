# Working without Gatling Enterprise credits

Enterprise credits fund cloud runs. They are not required to maintain the repository or execute
Gatling locally. See Gatling's [JavaScript SDK installation guide](https://docs.gatling.io/tutorials/test-as-code/javascript/installation-guide/)
and [Enterprise credit model](https://docs.gatling.io/reference/run-tests/credits/).

| Work                                                            | Command or evidence                                          | Target traffic           | Enterprise credits |
| --------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------ | ------------------ |
| Format, strict type checks, offline tests, Gatling bundle build | `npm run quality`                                            | None                     | None               |
| Check the tools and tests' TypeScript contracts                 | `npm run typecheck:tooling`                                  | None                     | None               |
| Review compatible recorded results                              | `npm run results:compare -- reference.json candidate.json`   | None                     | None               |
| Inspect the existing campaign                                   | Versioned Markdown/JSON records and available native reports | None                     | No new run         |
| Execute the bounded local protocol smoke                        | `npm run smoke`, only after its existing authorization gates | Two public-demo requests | None               |
| Execute distributed/cloud profiles                              | Manual Enterprise workflows                                  | Bounded profile traffic  | Required           |

The public target, three approved profiles, anonymous journey, and cloud safety controls remain
unchanged. This update ran only the offline validation path. Local execution is not the same
as zero traffic: Gatling uses your computer as the generator, so it still contacts the selected
target and needs the same scope/authorization review. It produces its HTML report under
`target/gatling/` without calling `enterprise-start`.

## Useful improvements while credits are exhausted

The comparator, safety verifier, and test suite now use real TypeScript contracts. Strict checking
covers all of them in CI; JSON enters as `unknown` and is validated before being treated as a
`RunSummary`. Node's native execution avoids another runner dependency. The `.mts` extension
preserves their ES-module behavior without changing the simulation package's module mode.

Further work can add offline malformed-evidence cases, refine documented scenarios and assertions,
or analyze compatible historical observations. A local isolated target can support new simulation
development in a separate scope. None of this replenishes the Enterprise balance or authorizes
load against the shared demo. Distributed cloud execution needs available credits again.

Build downloads come from package/runtime distribution servers; the offline validation path
does not send application traffic to QuickPizza.
