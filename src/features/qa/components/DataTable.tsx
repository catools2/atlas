import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { QueryResult } from "../../../shared/analytics/types";
import { formatValue } from "../../../shared/analytics/ChartTooltip";
import { ENTITY_KEYS } from "../../../shared/analytics/entityKeys";

interface DataTableProps {
  result: QueryResult;
  onRowClick?: (row: Record<string, unknown>) => void;
  /**
   * A click on one cell rather than the whole row.
   *
   * <p>Wide tables carry several entities per row — a cycle, its item, its executor — and a row
   * click has to guess which the reader meant. When a cell names an entity the app has a page
   * for, it wins; anything else falls through to the row.
   */
  onCellClick?: (row: Record<string, unknown>, column: string) => void;
  /** Column name whose value decides the row accent, for pass/fail style tables. */
  statusColumn?: string;
  /** Message for the no-rows case, when the page can say something more useful than the default. */
  emptyMessage?: string;
}

/** Status colour is never the only signal - the value itself is always in the cell. */
const STATUS_TONE: Record<string, string> = {
  pass: "text-state-success",
  fail: "text-state-danger",
  blocked: "text-state-warning",
  skipped: "text-ink-muted",
};

export function DataTable({
  result, onRowClick, onCellClick, statusColumn, emptyMessage,
}: DataTableProps) {
  const [sort, setSort] = useState<{ index: number; descending: boolean } | null>(null);

  const statusIndex = statusColumn
    ? result.columns.findIndex((c) => c.name === statusColumn)
    : -1;

  const rows = useMemo(() => {
    if (!sort) return result.rows;
    const factor = sort.descending ? -1 : 1;
    // Sorting here rather than in SQL: these result sets are already capped and in memory, and a
    // round trip to reorder a hundred rows the reader is looking at is a worse experience than
    // a comparison. Anything larger is capped server-side and says so.
    return [...result.rows].sort((a, b) => factor * compare(a[sort.index], b[sort.index]));
  }, [result.rows, sort]);

  function toggleSort(index: number) {
    setSort((current) =>
      current && current.index === index
        ? (current.descending ? null : { index, descending: true })
        : { index, descending: false });
  }

  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse text-left text-xs">
        <thead className="sticky top-0 z-10 bg-surface-strong/95 backdrop-blur-sm">
          <tr>
            {result.columns.map((c, index) => (
              <th key={c.name} className="whitespace-nowrap border-b border-line px-3 py-2 font-medium text-ink-muted"
                  aria-sort={sort?.index === index ? (sort.descending ? "descending" : "ascending") : "none"}>
                <button type="button" onClick={() => toggleSort(index)}
                        className="flex items-center gap-1 hover:text-ink">
                  {c.name}
                  {sort?.index === index
                    ? (sort.descending
                        ? <ArrowDown className="h-3 w-3" aria-hidden="true" />
                        : <ArrowUp className="h-3 w-3" aria-hidden="true" />)
                    : null}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const status = statusIndex >= 0 ? String(row[statusIndex] ?? "").toLowerCase() : "";
            const tone = Object.entries(STATUS_TONE).find(([k]) => status.includes(k))?.[1];
            const activate = onRowClick ? () => onRowClick(asRecord(result, row)) : undefined;
            const record = asRecord(result, row);
            return (
              <tr
                key={i}
                onClick={activate}
                // A clickable row has to be reachable without a mouse, and a row is not focusable
                // by default. tabIndex plus the two activation keys is the whole contract.
                tabIndex={activate ? 0 : undefined}
                role={activate ? "button" : undefined}
                onKeyDown={activate
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(); }
                    }
                  : undefined}
                className={`${activate ? "cursor-pointer focus:bg-white/[0.06] focus:outline-none" : ""} hover:bg-white/[0.03]`}
              >
                {row.map((cell, j) => {
                  const column = result.columns[j]?.name ?? "";
                  // A cell is only independently clickable when it names something more
                  // specific than the row does; otherwise it would be a second control that
                  // does the same thing, which is worse than one.
                  const cellTarget =
                    onCellClick && column in ENTITY_KEYS && cell !== null && cell !== "";
                  return (
                    <td
                      key={j}
                      className={`whitespace-nowrap border-b border-line/40 px-3 py-1.5 tabular-nums ${
                        j === statusIndex && tone ? tone : "text-ink"
                      }`}
                    >
                      {cellTarget ? (
                        <button
                          type="button"
                          className="underline decoration-dotted underline-offset-2 hover:text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                          // Stops the row handler also firing: two answers for one click, and
                          // the row's - being less specific - would be the one that lands.
                          onClick={(event) => {
                            event.stopPropagation();
                            onCellClick!(record, column);
                          }}
                          aria-label={`${ENTITY_KEYS[column].noun} ${formatValue(cell)}`}
                        >
                          {formatValue(cell)}
                        </button>
                      ) : (
                        formatValue(cell)
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      {result.rows.length === 0 ? (
        <p className="px-3 py-6 text-center text-xs text-ink-muted">
          {emptyMessage ?? "The query ran successfully and matched no rows."}
        </p>
      ) : null}
      {result.truncated ? (
        <p className="border-t border-line px-3 py-2 text-[10px] text-state-warning">
          The row cap cut this result short, so the table is not the whole answer. Narrow the
          filters to see all of it.
        </p>
      ) : null}
    </div>
  );
}

/** Numbers numerically, dates chronologically, everything else as text - and nulls last. */
function compare(a: unknown, b: unknown): number {
  if (a === null || a === undefined) return b === null || b === undefined ? 0 : 1;
  if (b === null || b === undefined) return -1;
  const left = Number(a);
  const right = Number(b);
  if (!Number.isNaN(left) && !Number.isNaN(right)) return left - right;
  return String(a).localeCompare(String(b), undefined, { numeric: true });
}

function asRecord(result: QueryResult, row: unknown[]): Record<string, unknown> {
  const record: Record<string, unknown> = {};
  result.columns.forEach((c, i) => { record[c.name] = row[i]; });
  return record;
}
