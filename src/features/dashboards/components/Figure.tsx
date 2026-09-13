import { useMemo } from "react";
import { Link } from "react-router-dom";

import { toRecords } from "../../../shared/analytics/analyticsClient";
import { defaultResolver, useDrill } from "../../../shared/analytics/drill";
import type { DrillResolver } from "../../../shared/analytics/drill";
import type { QuerySummary, Viz } from "../../../shared/analytics/types";
import { ChartKeyboardLayer } from "../../../shared/analytics/ChartKeyboardLayer";
import { ErrorBoundary } from "../../../shared/ui/ErrorBoundary";
import { FreshnessBadge } from "../../../shared/analytics/FreshnessBadge";
import { TruncationNote } from "../../../shared/analytics/TruncationNote";
import { useQuery } from "../../../shared/analytics/useQuery";
import { vizComponent } from "./viz";
import { useReportContext } from "./ReportPage";

/**
 * What a figure needs to draw itself beyond its rows.
 *
 * <p>These came from Grafana's `fieldConfig.defaults` when the reports were first scaffolded.
 * They are ordinary props now, so changing a unit or a threshold is an edit to a page rather
 * than a re-import.
 */
export interface FigureDisplay {
  unit?: string;
  decimals?: number;
  min?: number;
  max?: number;
  thresholds?: unknown;
}

export interface FigureProps extends FigureDisplay {
  /** Bar charts only: stack the series instead of grouping them side by side. */
  stacked?: boolean;
  /** Registry query id, e.g. `teamregressionstatistics__automation_debt__panel_40`. The only way a figure gets data. */
  query: string;
  title: string;
  viz: Viz;
  /** One line telling the reader what they are looking at. */
  note?: string;
  /** Columns out of 12. */
  span?: number;
  /** Extra or overriding query parameters, beyond what the page's filters supply. */
  params?: Record<string, unknown>;
  /** Drawing height in px. */
  height?: number;
}

/**
 * One chart or table on a report page.
 *
 * <p>This is the whole data path. A report page arranges `Figure`s and supplies filters; it
 * never fetches anything itself, so every number on every page comes from a registered query by
 * id and there is exactly one definition of each figure.
 *
 * <p>Note it calls {@link useQuery} **once**, directly. The previous spec-driven renderer had a
 * reducer and a child-component-per-query, because a panel spec could declare any number of
 * queries and `queries.map(useQuery)` is an illegal hook. A hand-written page does not have that
 * problem: a figure is one query, written down. Two figures is two `Figure`s.
 */
export function Figure({
  query, title, viz, note, span = 6, params, height = 260,
  unit, decimals, min, max, thresholds, stacked,
}: FigureProps) {
  const context = useReportContext();
  const bound = useMemo(
    () => ({ ...context.params, ...params }),
    [context.params, params],
  );

  const state = useQuery(query, bound);
  const rows = useMemo(
    () => (state.result ? toRecords(state.result) : []),
    [state.result],
  );

  const summary: QuerySummary | null = context.queries[query] ?? null;
  const resolver: DrillResolver = useMemo(() => defaultResolver(summary), [summary]);
  const onDrill = useDrill(resolver, context.apply);

  const Viz = vizComponent(viz);
  const figure = {
    id: query,
    title,
    viz,
    display: { unit, decimals, min, max, thresholds },
    stacked: Boolean(stacked),
  };

  return (
    <section
      className="card flex flex-col overflow-hidden p-0"
      style={{ gridColumn: `span ${span} / span ${span}` }}
      aria-label={title}
    >
      <header className="flex items-center gap-2 border-b border-line px-2.5 py-1.5">
        <h3 className="truncate text-xs font-medium" title={note ?? title}>
          {title}
        </h3>
        <span className="ml-auto flex items-center gap-1">
          {state.result ? <FreshnessBadge freshness={state.result.freshness} /> : null}
          {/* Where this figure's numbers come from. "I do not believe that number" is a
              reasonable reaction to a report, and it deserves an answer one click away. */}
          <Link
            to={`/queries/${query}`}
            className="rounded border border-line px-1.5 py-0.5 text-[10px] text-ink-muted/70 hover:text-ink"
            title="Open the query behind this figure"
            onClick={(event) => event.stopPropagation()}
          >
            source
          </Link>
        </span>
      </header>

      {note ? (
        <p className="border-b border-line/60 px-2.5 py-1 text-[11px] text-ink-muted">{note}</p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto" style={{ minHeight: height }}>
        {/* A viz can throw on a shape it did not expect, and one bad figure must not blank the
            page around it. QueryBoundary catches a failed request, which is a different thing. */}
        <ErrorBoundary fallback={<Inert>This figure could not be drawn.</Inert>}>
          {state.error ? (
            <Inert>{state.error}</Inert>
          ) : state.loading && !state.result ? (
            <Inert>Loading…</Inert>
          ) : !state.result || state.result.rows.length === 0 ? (
            <Inert>No data for the selected filters.</Inert>
          ) : (
            <>
              <Viz
                figure={figure}
                result={state.result}
                rows={rows}
                height={height}
                onDrill={onDrill}
              />
              {/* Recharts marks are not focusable, so the same data is offered as buttons. */}
              {viz !== "table" ? (
                <ChartKeyboardLayer
                  rows={rows}
                  resolver={resolver}
                  onDrill={onDrill}
                  label={title}
                  describeRow={(row) => Object.values(row).slice(0, 2).join(": ")}
                />
              ) : null}
            </>
          )}
        </ErrorBoundary>
      </div>

      {state.result ? (
        <TruncationNote truncated={state.result.truncated} rows={state.result.rows.length} />
      ) : null}
    </section>
  );
}

function Inert({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex h-full items-center justify-center px-3 py-6 text-center text-xs text-ink-muted">
      {children}
    </p>
  );
}
