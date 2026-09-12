import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, CircleDot } from "lucide-react";
import { MetisBoundary } from "../../../shared/metis/MetisBoundary";
import type {
  CoverageReport, JourneyList, Model, ModelState, ModelTransition, Unmeasured,
} from "../../../shared/metis/metisClient";
import { useMetisRead } from "../../../shared/metis/useMetisRead";

/**
 * A journey's states, transitions and guards, with the coverage figure beside them.
 *
 * This is the view that has never had a picture: the model lives in a graph, and reading it meant
 * a tool call per question. Three reads make it a page - the journeys that exist, one model in
 * detail, and the report that says what could not be measured.
 *
 * **No figure is drawn without its caveat** (C-11). Métis prunes null, empty and false from its
 * payloads, so an unmeasured figure and a zero arrive looking identical; `coverage_report` exists
 * to name the difference, and a figure it lists as unmeasured is rendered as *not measured* here
 * rather than as a number. Coverage is what is tested, never what is working, and no verdict is
 * computed on this page - Métis deliberately computes none either.
 */
export function ModelExplorerPage() {
  const [params, setParams] = useSearchParams();
  const journey = params.get("journey") ?? "";
  const surface = params.get("surface") || "api";

  const journeys = useMetisRead<JourneyList>("/journeys");
  const query = `?surface=${encodeURIComponent(surface)}`;
  const model = useMetisRead<Model>(
    journey ? `/models/${encodeURIComponent(journey)}${query}&detail=true` : null);
  const report = useMetisRead<CoverageReport>(
    journey ? `/models/${encodeURIComponent(journey)}/report${query}` : null);

  function select(next: string, nextSurface: string) {
    const updated = new URLSearchParams(params);
    updated.set("journey", next);
    if (nextSurface !== "api") updated.set("surface", nextSurface);
    else updated.delete("surface");
    setParams(updated);
  }

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <p className="eyebrow-label">Métis · reasoning plane</p>
        <h1 className="font-display text-xl font-semibold text-ink">Model explorer</h1>
        <p className="max-w-3xl text-xs text-ink-muted">
          What the graph holds for one journey: its states, the transitions between them with the
          guards that govern them, and how much of that is covered — with whatever could not be
          measured named beside it.
        </p>
      </header>

      <MetisBoundary state={journeys} empty="No journey is in the graph yet.">
        {(list) => {
          const available = list.journeys ?? [];
          if (available.length === 0) {
            return (
              <p className="card p-4 text-xs text-ink-muted">
                The graph holds no model. Land one with <code>metis land</code>, and it appears here.
              </p>
            );
          }
          return (
            <div className="flex flex-wrap items-center gap-1.5">
              {available.map((item) => {
                const active = journey === item.journey && surface === item.surface;
                return (
                  <button key={`${item.journey}-${item.surface}`} type="button"
                          aria-pressed={active}
                          onClick={() => select(item.journey, item.surface)}
                          className={`rounded-full border px-2 py-0.5 text-[11px] transition ${
                            active ? "border-line-strong text-ink"
                                   : "border-line text-ink-muted hover:text-ink"}`}>
                    {item.journey}
                    <span className="ml-1 opacity-60">{item.surface}</span>
                  </button>
                );
              })}
            </div>
          );
        }}
      </MetisBoundary>

      {!journey ? (
        <p className="card p-4 text-xs text-ink-muted">Pick a journey to see its model.</p>
      ) : (
        <div className="space-y-4">
          <MetisBoundary state={report} empty="No report for this journey.">
            {(data) => <CoveragePanel report={data} />}
          </MetisBoundary>

          <MetisBoundary state={model} empty="No model for this journey.">
            {(data) => <ModelPanels model={data} />}
          </MetisBoundary>
        </div>
      )}
    </section>
  );
}

/** The unmeasured entries, by the figure each one is about. */
function unmeasuredByFigure(report: CoverageReport): Map<string, Unmeasured> {
  const entries = Array.isArray(report.unmeasured) ? report.unmeasured : [];
  return new Map(entries.map((entry) => [entry.figure, entry]));
}

function CoveragePanel({ report }: { report: CoverageReport }) {
  const missing = useMemo(() => unmeasuredByFigure(report), [report]);
  const coverage = report.coverage ?? {};
  const validation = report.validation ?? {};
  const measuredNothing = Array.isArray(report.unmeasured) ? report.unmeasured : [];
  const uncoveredReasons = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of report.coverage?.uncovered_detail ?? []) {
      counts.set(row.reason, (counts.get(row.reason) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [report]);

  return (
    <div className="card space-y-3 p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-sm font-semibold text-ink">
          Coverage{report.criterion ? <span className="ml-1 text-[11px] font-normal text-ink-muted">
            {report.criterion}</span> : null}
        </h2>
        {report.model_id ? (
          <p className="font-mono text-[11px] text-ink-muted">{report.model_id}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Figure label="Covered" value={coverage.covered} unmeasured={missing.get("covered")} />
        <Figure label="Uncovered" value={coverage.uncovered} unmeasured={missing.get("coverage")} />
        <Figure label="Checked" value={validation.checked} unmeasured={missing.get("validation")} />
        <Figure label="Blocking findings" value={validation.blocking}
                unmeasured={missing.get("validation")} />
      </div>

      {/* An uncovered count on its own invites the wrong repair. `excluded_unapproved` is not a
          missing test - it is a model nobody has approved yet, and the way out is a decision
          rather than test writing. */}
      {uncoveredReasons.length > 0 ? (
        <p className="text-[11px] text-ink-muted">
          <span className="text-ink">Uncovered because:</span>{" "}
          {uncoveredReasons.map(([reason, count]) => `${reason} (${count})`).join(", ")}
        </p>
      ) : null}

      {/* The list in full, not only the figures it happened to touch: an absence nothing above
          happens to render is still something the reader is entitled to know about. */}
      {measuredNothing.length > 0 ? (
        <div className="space-y-1 rounded-md border border-line bg-surface-muted/40 p-2">
          <p className="flex items-center gap-1 text-[11px] font-medium text-state-warning">
            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
            {measuredNothing.length} figure{measuredNothing.length === 1 ? "" : "s"} could not be measured
          </p>
          <ul className="m-0 list-none space-y-0.5 p-0 text-[11px] text-ink-muted">
            {measuredNothing.map((entry) => (
              <li key={entry.figure}>
                <span className="text-ink">{entry.figure}</span>
                <span className="opacity-60"> · {entry.kind}</span>
                {entry.reason ? ` — ${entry.reason}` : null}
              </li>
            ))}
          </ul>
        </div>
      ) : typeof report.unmeasured === "string" ? (
        <p className="text-[11px] text-ink-muted">{report.unmeasured}</p>
      ) : null}

      {report.confidence_capped_by ? (
        <p className="text-[11px] text-ink-muted">
          <span className="text-ink">Confidence capped by:</span> {report.confidence_capped_by}
        </p>
      ) : null}
      {report.means ? <p className="text-[11px] text-ink-muted">{report.means}</p> : null}
    </div>
  );
}

/**
 * One figure. A figure Métis could not measure is rendered as *not measured*, never as a number:
 * a zero and an absence are different answers, and this is the one place the difference is easy
 * to destroy.
 */
function Figure({ label, value, unmeasured }: {
  label: string; value?: number; unmeasured?: Unmeasured;
}) {
  if (unmeasured || value === undefined) {
    return (
      <div className="card p-3">
        <p className="eyebrow-label">{label}</p>
        <p className="font-display text-2xl font-semibold text-ink-muted">—</p>
        <p className="mt-0.5 text-[10px] text-state-warning">
          not measured{unmeasured?.cause ? ` · ${unmeasured.cause}` : ""}
        </p>
      </div>
    );
  }
  return (
    <div className="card p-3">
      <p className="eyebrow-label">{label}</p>
      <p className="font-display text-2xl font-semibold tabular-nums text-ink">{value}</p>
    </div>
  );
}

function ModelPanels({ model }: { model: Model }) {
  const states = model.states ?? [];
  const transitions = model.transitions ?? [];

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <div className="card space-y-2 p-3">
        <h2 className="font-display text-sm font-semibold text-ink">
          States <span className="text-[11px] font-normal text-ink-muted">{states.length}</span>
        </h2>
        <ul className="m-0 list-none space-y-1 p-0">
          {states.map((state) => <StateRow key={state.id} state={state} />)}
        </ul>
      </div>

      <div className="card space-y-2 p-3">
        <h2 className="font-display text-sm font-semibold text-ink">
          Transitions <span className="text-[11px] font-normal text-ink-muted">{transitions.length}</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[11px]">
            <thead>
              <tr className="text-ink-muted">
                <th className="border-b border-line px-2 py-1 font-medium">From</th>
                <th className="border-b border-line px-2 py-1 font-medium">Trigger</th>
                <th className="border-b border-line px-2 py-1 font-medium">To</th>
                <th className="border-b border-line px-2 py-1 font-medium">Guard</th>
                <th className="border-b border-line px-2 py-1 font-medium">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {transitions.map((transition) => (
                <TransitionRow key={transition.id} transition={transition} />
              ))}
            </tbody>
          </table>
        </div>
        {model.skipped && model.skipped.length > 0 ? (
          <p className="text-[11px] text-state-warning">
            {model.skipped.length} element{model.skipped.length === 1 ? "" : "s"} skipped on load —
            {" "}{model.skipped[0].reason}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function StateRow({ state }: { state: ModelState }) {
  return (
    <li className="flex items-baseline justify-between gap-2 border-b border-line/60 pb-1 text-[11px] last:border-0">
      <span className="flex items-center gap-1 text-ink">
        {state.is_initial ? (
          <CircleDot className="h-3 w-3 text-state-success" aria-label="initial state" />
        ) : null}
        {state.name}
      </span>
      {state.lifecycle_state ? (
        <span className="text-ink-muted">{state.lifecycle_state}</span>
      ) : null}
    </li>
  );
}

function TransitionRow({ transition }: { transition: ModelTransition }) {
  return (
    <tr className="align-top">
      <td className="border-b border-line/60 px-2 py-1 text-ink-muted">
        {short(transition.source)}
        {transition.source_state_unresolved ? (
          // Named rather than dropped: an unresolved source is a hole in the model, and a blank
          // cell would read as "no source", which is a different thing entirely.
          <span className="ml-1 text-state-warning" title="source state unresolved">unresolved</span>
        ) : null}
      </td>
      <td className="border-b border-line/60 px-2 py-1 font-mono text-ink">{short(transition.trigger)}</td>
      <td className="border-b border-line/60 px-2 py-1 text-ink-muted">{short(transition.target)}</td>
      <td className="border-b border-line/60 px-2 py-1 text-ink-muted">{transition.guard ?? "—"}</td>
      <td className="border-b border-line/60 px-2 py-1 text-ink-muted">
        {transition.outcome_status ?? "unclassified"}
      </td>
    </tr>
  );
}

/**
 * Ids in a recovered model are fully-qualified method signatures, and a table of them is
 * unreadable. The qualifier is dropped for display only - the full value stays in the title.
 */
export function short(value?: string): string {
  if (!value) return "—";
  const tail = value.includes("::") ? value.slice(value.lastIndexOf("::") + 2) : value;
  return tail.length > 48 ? `${tail.slice(0, 47)}…` : tail;
}
