import type { ViewFreshness } from "./types";

/**
 * How old the numbers are.
 *
 * <p>Materialized views are snapshots. Eighteen of them are refreshed by a scheduled job, and
 * when that job fails the views keep answering — with last week's numbers, at full confidence.
 * Nothing in the data says so.
 *
 * <p>This is the difference between a dashboard and a lie. A reader deciding whether to ship
 * needs to know they are looking at figures from two days ago, and the chart itself will never
 * tell them.
 */
export function FreshnessBadge({ freshness }: { freshness: ViewFreshness[] }) {
  const materialized = freshness.filter((f) => f.materialized);
  if (materialized.length === 0) return null;

  // The oldest, because a panel is only as current as its stalest source.
  let oldest: ViewFreshness | null = null;
  let unknown = false;
  for (const view of materialized) {
    if (!view.refreshedAt) { unknown = true; continue; }
    if (!oldest?.refreshedAt || view.refreshedAt < oldest.refreshedAt) oldest = view;
  }

  if (!oldest) {
    return <Badge tone="muted" title={names(materialized)}>refresh time unknown</Badge>;
  }

  const ageMs = Date.now() - Date.parse(oldest.refreshedAt!);
  const hours = ageMs / 3_600_000;
  // The job runs every 4 hours, so anything past two intervals has missed one.
  const stale = hours > 8;

  return (
    <Badge
      tone={stale ? "warn" : "muted"}
      title={stale ? `${oldest.view} last refreshed ${format(hours)} ago` : names(materialized)}
    >
      {unknown ? "partly unknown · " : ""}
      {format(hours)} old
    </Badge>
  );
}

function names(views: ViewFreshness[]): string {
  return views.map((v) => v.view).join(", ");
}

function format(hours: number): string {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`;
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

function Badge({
  tone, title, children,
}: { tone: "muted" | "warn"; title: string; children: React.ReactNode }) {
  return (
    <span
      title={title}
      className={`rounded-full border px-1.5 py-0.5 text-[10px] tabular-nums ${
        tone === "warn"
          ? "border-state-warning/40 text-state-warning"
          : "border-line text-ink-muted/70"
      }`}
    >
      {children}
    </span>
  );
}
