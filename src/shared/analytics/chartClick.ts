import type { Datum } from "./drill";

/**
 * Recharts hands a click back differently for every chart type. This is the one place that knows.
 *
 * <p>A `<Bar onClick>` receives the datum; a chart-level `onClick` receives a state object with
 * `activeLabel` and `activePayload`; a `<Pie onClick>` receives the slice. Each is *nearly* the
 * row and none is exactly it, so every call site that reads `.payload` by hand is a place that
 * breaks on a Recharts upgrade or on a chart type nobody tried.
 */

/** The row behind a mark, whichever shape the library used to wrap it. */
export function payloadOf(mark: unknown): Record<string, unknown> {
  const wrapped = (mark as { payload?: Record<string, unknown> })?.payload;
  // Nested twice for a stacked bar: the segment wraps the bar, which wraps the row.
  const inner = (wrapped as { payload?: Record<string, unknown> })?.payload;
  return inner ?? wrapped ?? (mark as Record<string, unknown>) ?? {};
}

/**
 * Stops a segment click also firing the chart-level handler.
 *
 * <p>Both are wired on purpose — see {@link fromChart} — so without this a click on a segment
 * resolves twice and the second answer, being less specific, wins.
 */
export function stop(event: unknown): void {
  (event as { stopPropagation?: () => void } | undefined)?.stopPropagation?.();
}

/** A click on one bar, slice or segment: the most specific thing the reader can hit. */
export function fromMark(
  mark: unknown,
  source: Datum["source"],
  seriesKey?: string,
): Datum {
  const row = payloadOf(mark);
  return {
    source,
    row,
    seriesKey,
    category: firstCategory(row),
  };
}

/**
 * A click anywhere on the plot area.
 *
 * <p>Wired alongside the per-mark handlers rather than instead of them, for two reasons. A
 * zero-height bar segment cannot be hit at all, so some days are otherwise unreachable. And on
 * a line chart the marks are dots, which are commonly `dot={false}` and therefore not there —
 * making the series individually clickable is not possible, so the x position is the answer.
 */
export function fromChart(state: unknown, source: Datum["source"]): Datum | null {
  const chart = state as {
    activeLabel?: unknown;
    activePayload?: { dataKey?: string; payload?: Record<string, unknown> }[];
  } | null;
  if (!chart?.activePayload?.length) return null;

  const first = chart.activePayload[0];
  return {
    source,
    row: first?.payload ?? {},
    // Deliberately no seriesKey: the reader clicked an x position, not a series. Claiming one
    // would silently pick whichever series Recharts happened to list first.
    category: chart.activeLabel,
  };
}

/** A click on a table row. */
export function fromRow(row: Record<string, unknown>, source: Datum["source"]): Datum {
  return { source, row, category: firstCategory(row) };
}

/**
 * A click on a specific cell.
 *
 * <p>Wide tables carry several entities per row — a cycle, its item, its executor — and a row
 * click has to guess which one the reader meant. A cell click does not.
 */
export function fromCell(
  row: Record<string, unknown>,
  column: string,
  source: Datum["source"],
): Datum {
  return { source, row, seriesKey: column, category: row[column] };
}

/** The label a reader would recognise: the first non-numeric column in the row. */
function firstCategory(row: Record<string, unknown>): unknown {
  for (const value of Object.values(row)) {
    if (typeof value === "string" && value !== "") return value;
  }
  return undefined;
}
