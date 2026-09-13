import type { Datum, DrillAction } from "../../../../shared/analytics/drill";
import type { QueryResult, Viz } from "../../../../shared/analytics/types";

/**
 * What every viz component receives. One shape, so the registry can be a plain map.
 *
 * <p>Each component's only jobs are to draw the rows and to hand a {@link Datum} back when
 * something is clicked. None of them decides what a click *means* — that is the resolver's job,
 * and keeping it out of here is why adding a chart type does not also mean inventing a new
 * drill behaviour.
 */
/**
 * Everything a viz knows about the figure it is drawing, other than the rows.
 *
 * <p>This used to be a whole panel specification - grid position, query list, collapsed state,
 * the lot - because the renderer walked an imported dashboard document. Report pages are ordinary
 * React, so a viz is handed only what it actually draws with. Position is the page's business and
 * is expressed in JSX; nothing here has a `grid`.
 */
export interface FigureMeta {
  /** Stable identifier, used for keys and for the drill datum's source. The query id. */
  id: string;
  title: string;
  viz: Viz;
  display?: {
    unit?: string;
    decimals?: number;
    min?: number;
    max?: number;
    thresholds?: unknown;
  };
  /** Bar charts only: stack rather than group. The one Grafana option any viz here reads. */
  stacked?: boolean;
}

export interface VizProps {
  figure: FigureMeta;
  result: QueryResult;
  /** Rows as records, already joined to their column names. */
  rows: Record<string, unknown>[];
  /** Pixel height Grafana would have drawn, so charts can fill their box. */
  height: number;
  onDrill: (datum: Datum) => DrillAction;
}

/** Columns that are the x axis rather than a measure. */
export const TIME_COLUMNS = ["time", "bucket", "day", "date", "occurred", "created_on"];

/** The first column that looks like a category or an instant. */
export function categoryColumn(result: QueryResult): string {
  const named = result.columns.find((c) => TIME_COLUMNS.includes(c.name.toLowerCase()));
  if (named) return named.name;
  const text = result.columns.find((c) => !isNumeric(c.type));
  return (text ?? result.columns[0])?.name ?? "";
}

/** Everything that is not the category: the series to draw. */
export function seriesColumns(result: QueryResult, category: string): string[] {
  return result.columns.filter((c) => c.name !== category).map((c) => c.name);
}

export function isNumeric(type: string): boolean {
  return /int|numeric|decimal|real|double|float|bigint|money/i.test(type);
}

export function toNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}
