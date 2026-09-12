# Atlas

One frontend over two backends.

**Métis is the reasoning plane** — it recovers a behaviour model from code,
compares it against what somebody said the system should do, and generates test
cases from the part that survives human review. **Athena is the data plane** —
pre-aggregated quality analytics, so a figure gets cited rather than re-derived.

They are one product from a user's point of view, and this repo is that point of
view. It was extracted from `catools2/athena`, where it lived as
`athena-frontend/`; the seven commits that touched it are preserved here and the
Athena backend history is not.

> Not to be confused with the `atlas` that Métis was ported from. Métis's
> `parity.py` compares against that one by name and `test_independence.py` guards
> against coupling to it. This repo is the frontend.

## Running it

```bash
npm ci
npm run dev      # vite, port 5173
npm test         # vitest, 43 tests across 4 files
npm run build    # → dist/
npm run preview  # serves dist/ on port 4173 — build first
```

`dist/` is build output and is **not** tracked here. It was tracked in the
monorepo, where nothing consumed it: no Dockerfile, compose mount or helm chart
references it, and the gateway reaches the preview server over HTTP instead.

## How it is served

Athena's gateway owns the route and the contract did not change in the move:

```
athena-gateway/src/main/resources/application.yml
  athena.frontend.uri: ${ATHENA_FRONTEND_URI:http://localhost:4173}
  /  and  /ui  →  302 /ui/
  /ui/**       →  this app
```

So `athena-gateway` needs no edit for the UI route. Point `ATHENA_FRONTEND_URI`
at wherever this runs.

Métis is reached through the same gateway, on a route it *did* need:

```
  /metis/**  →  ${METIS_API_URI:http://127.0.0.1:8732}   StripPrefix=1
               predicate  Method=GET          — an allowlist, see below
               filter     SetRequestHeader Authorization: Bearer ${METIS_API_TOKEN}
```

Two environment variables, in two different places:

| Variable | Set where | What it is |
|---|---|---|
| `METIS_API_TOKEN` | the **gateway** | the one service token Métis sees. Never reaches the browser. |
| `METIS_API_URI` | the **gateway** | where `metis api` is listening. |
| `VITE_METIS_REVIEW_UI` | **this app**, at build time | where `metis ui` is listening — the page a queue row links *out* to. Defaults to `http://127.0.0.1:8731`. |

Start the API Métis serves those reads from with `metis api` (loopback and port
8732 by default), pointing `METIS_API_TOKENS` at a file of
`sha256<TAB>name<TAB>role` lines. Without it every read but `/healthz` answers
401, and this app says so rather than showing an empty page.

## The one rule that is not a preference

**Reads through the gateway; decisions never.**

Métis's review UI is deliberately scriptless — its CSP omits `script-src` so the
operator's credential never enters anything a page can read, and every decision
produces an audit record naming the person who took it. If this app grew an
"approve from here" button, the gateway would forward it under a single service
token and every approval in the audit trail would name that one account,
destroying the rule that a proposer may not approve their own work.

So a queue row links **out** to Métis's own review UI to decide. This app's job
is to get people to the gate with the evidence in hand, not to move the gate.

The gateway enforces it rather than trusting this app to behave: `Method=GET` on
the `/metis/**` route is an allowlist, and every Métis read is a GET while all
three of its gated decisions are POSTs. A decision route is unreachable through
the gateway even for a caller holding a valid identity.

The same applies to what gets rendered: **a coverage figure always carries its
`unmeasured` count.** A number with no caveat beside it is a claim Métis does not
make.

## Layout

```
src/app/          shell, providers, routing
src/features/     one directory per area — qa, reports, pipelines, apis,
                  catalog, governance, metrics, git, runtime, agent, home,
                  overview, metis (decisions queue, model explorer)
src/shared/       ui/ (AppShell, TopBar, navigation, DetailDialog)
                  analytics/ (filters, useQuery)
                  metis/ (metisClient, useMetisRead, MetisBoundary)
                  api/  agent/
src/styles/       main.css — tailwind plus the hand-written chrome
```
