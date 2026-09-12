import { useSearchParams } from "react-router-dom";
import { ArrowUpRight, Clock } from "lucide-react";
import { MetisBoundary } from "../../../shared/metis/MetisBoundary";
import { REVIEW_UI } from "../../../shared/metis/metisClient";
import type { Queue, QueueEntry } from "../../../shared/metis/metisClient";
import { useMetisRead } from "../../../shared/metis/useMetisRead";
import { StatTile } from "../../qa/components/StatTile";

/**
 * What is waiting on a person, across every run - the one question neither Athena nor Métis's own
 * surfaces answer for a team.
 *
 * **Every row leads out, and none of them decides.** A gate reached from here would be recorded
 * against the gateway's service token rather than the person who reached it, which is an audit
 * trail that names nobody and a way around the rule that a proposer may not approve their own
 * work. So the row carries the evidence and a door: the decision is taken in Métis's own review
 * UI, with the reader's own credential.
 *
 * `next_command` is shown verbatim because it is the engine's own resolution for that run, not a
 * sentence this page composed - for most of these the way out is a command, not a click.
 */
export function QueuePage() {
  const [params, setParams] = useSearchParams();
  const workflow = params.get("workflow") ?? "";

  // Filtered server-side: `/queue` takes the workflow, so a narrowed view is a narrowed read
  // rather than a full one the page throws most of away.
  const state = useMetisRead<Queue>(
    workflow ? `/queue?workflow=${encodeURIComponent(workflow)}` : "/queue");

  function setWorkflow(next: string) {
    const params2 = new URLSearchParams(params);
    if (next) params2.set("workflow", next);
    else params2.delete("workflow");
    setParams(params2, { replace: true });
  }

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <p className="eyebrow-label">Métis · reasoning plane</p>
        <h1 className="font-display text-xl font-semibold text-ink">Decisions waiting</h1>
        <p className="max-w-3xl text-xs text-ink-muted">
          Runs stopped at a gate. Nothing here has failed and nothing is in progress — each one is
          a decision somebody owes. Decisions are taken in Métis, signed by whoever takes them;
          this page gets you there with the evidence in hand.
        </p>
      </header>

      <MetisBoundary state={state} empty="Nothing is waiting on a person.">
        {(queue) => {
          const entries = queue.waiting ?? [];
          const byWorkflow = queue.by_workflow ?? {};
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatTile label="Waiting" value={queue.total ?? entries.length}
                          hint="runs stopped at a gate" />
                <StatTile label="Workflows" value={Object.keys(byWorkflow).length}
                          hint="that have something waiting" />
                <StatTile label="Oldest" value={oldest(entries)}
                          hint="time the first one has been waiting"
                          tone={staleness(entries)} />
              </div>

              {Object.keys(byWorkflow).length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <FilterChip label="All" count={queue.total ?? entries.length}
                              active={!workflow} onClick={() => setWorkflow("")} />
                  {Object.entries(byWorkflow).map(([name, count]) => (
                    <FilterChip key={name} label={name} count={count}
                                active={workflow === name} onClick={() => setWorkflow(name)} />
                  ))}
                </div>
              ) : null}

              {entries.length === 0 ? (
                <p className="card p-4 text-xs text-ink-muted">
                  Nothing is waiting on a person{workflow ? ` in ${workflow}` : ""}.
                </p>
              ) : (
                <ul className="m-0 grid list-none gap-2 p-0">
                  {entries.map((entry) => <Row key={entry.run_id} entry={entry} />)}
                </ul>
              )}

              {queue.means ? (
                <p className="text-[11px] text-ink-muted">{queue.means}</p>
              ) : null}
            </div>
          );
        }}
      </MetisBoundary>
    </section>
  );
}

function Row({ entry }: { entry: QueueEntry }) {
  const outstanding = entry.outstanding ?? [];
  return (
    <li className="card min-w-0 space-y-2 p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="min-w-0 space-y-0.5">
          <p className="font-display text-sm font-semibold text-ink">{entry.scope}</p>
          <p className="break-words text-[11px] text-ink-muted">
            <span className="text-ink">{entry.workflow}</span>
            {" · blocked on "}
            <span className="text-state-warning">{entry.blocked_on}</span>
            {" · "}
            <span className="font-mono">{entry.run_id}</span>
          </p>
        </div>
        <p className="flex items-center gap-1 text-[11px] text-ink-muted">
          <Clock className="h-3 w-3" aria-hidden="true" />
          {waitingFor(entry.waiting_since)}
        </p>
      </div>

      {entry.detail ? <p className="break-words text-xs text-ink-muted">{entry.detail}</p> : null}

      {outstanding.length > 0 ? (
        <ul className="m-0 list-none space-y-1 break-words border-l-2 border-line pl-3 text-[11px] text-ink-muted">
          {outstanding.map((item, index) => <li key={index}>{item}</li>)}
        </ul>
      ) : null}

      {entry.next_command ? (
        <pre className="overflow-x-auto rounded-md bg-surface-muted/60 px-2 py-1.5 text-[11px] text-ink-muted">
          <code>{entry.next_command}</code>
        </pre>
      ) : null}

      {/* Out, never in: a decision belongs to the person who takes it, under their own
          credential, on Métis's own scriptless page. */}
      <a href={`${REVIEW_UI}/queue`} target="_blank" rel="noreferrer"
         className="inline-flex items-center gap-1 text-[11px] text-ink-muted transition hover:text-ink">
        Decide in Métis
        <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
      </a>
    </li>
  );
}

function FilterChip({ label, count, active, onClick }: {
  label: string; count: number; active: boolean; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
            className={`rounded-full border px-2 py-0.5 text-[11px] transition ${
              active ? "border-line-strong text-ink" : "border-line text-ink-muted hover:text-ink"}`}>
      {label}
      <span className="ml-1 tabular-nums opacity-60">{count}</span>
    </button>
  );
}

/** Days, not an ISO instant: what a reader needs from this column is how long it has been sitting. */
export function waitingFor(since?: string): string {
  if (!since) return "unknown";
  const started = new Date(since);
  if (Number.isNaN(started.getTime())) return since;
  const hours = Math.floor((Date.now() - started.getTime()) / 3_600_000);
  if (hours < 1) return "under an hour";
  if (hours < 48) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function oldestHours(entries: QueueEntry[]): number | null {
  const times = entries
    .map((e) => (e.waiting_since ? new Date(e.waiting_since).getTime() : NaN))
    .filter((t) => !Number.isNaN(t));
  if (times.length === 0) return null;
  return Math.floor((Date.now() - Math.min(...times)) / 3_600_000);
}

function oldest(entries: QueueEntry[]): string {
  const hours = oldestHours(entries);
  // Never a zero: no timestamps is not "waiting no time at all".
  if (hours === null) return "—";
  return hours < 48 ? `${hours}h` : `${Math.floor(hours / 24)}d`;
}

/** Colour is a second signal only - the figure beside it says the same thing. */
function staleness(entries: QueueEntry[]): "neutral" | "warning" | "danger" {
  const hours = oldestHours(entries);
  if (hours === null) return "neutral";
  if (hours >= 24 * 7) return "danger";
  if (hours >= 24 * 2) return "warning";
  return "neutral";
}
