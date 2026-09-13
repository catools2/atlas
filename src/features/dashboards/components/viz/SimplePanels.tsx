import { DataTable } from "../../../qa/components/DataTable";
import { STATUS_COLORS } from "../../../../shared/analytics/palette";
import { fromCell, fromRow } from "../../../../shared/analytics/chartClick";
import { labelFor } from "../../../../shared/analytics/drill";
import { categoryColumn, seriesColumns, toNumber } from "./vizProps";
import type { VizProps } from "./vizProps";

/** The viz types that are not charts: a table, a single number, and prose. */

export function TablePanel({ figure, result, onDrill }: VizProps) {
  const source = { kind: "table" as const, panelId: String(figure.id) };
  const statusColumn = result.columns.find((c) => /status|outcome|result/i.test(c.name))?.name;

  // The same table component the bespoke pages use, so a dashboard table sorts, drills and
  // reports truncation exactly like every other table in the app.
  return (
    <DataTable
      result={result}
      statusColumn={statusColumn}
      onRowClick={(row) => onDrill(fromRow(row, source))}
      onCellClick={(row, column) => onDrill(fromCell(row, column, source))}
    />
  );
}

export function StatPanel({ figure, result, rows, onDrill }: VizProps) {
  const category = categoryColumn(result);
  const measure = seriesColumns(result, category)[0] ?? result.columns[0]?.name ?? "";
  const value = toNumber(rows[0]?.[measure]);
  const tone = thresholdTone(value, figure.display?.thresholds);

  return (
    <button
      type="button"
      className="flex h-full w-full flex-col items-start justify-center gap-1 rounded px-2 text-left focus:outline-none focus:ring-1 focus:ring-accent"
      onClick={() => rows[0] && onDrill(fromRow(rows[0], { kind: "tile", panelId: String(figure.id) }))}
    >
      <span className="text-2xl font-semibold tabular-nums" style={tone ? { color: tone } : undefined}>
        {value.toLocaleString(undefined, { maximumFractionDigits: figure.display?.decimals ?? 0 })}
        {figure.display?.unit === "percent" ? "%" : null}
      </span>
      <span className="text-xs text-ink-muted">{labelFor(measure)}</span>
    </button>
  );
}

/** Threshold colour, when a panel declares one. The number is always shown regardless. */
function thresholdTone(value: number, thresholds: unknown): string | undefined {
  const steps = (thresholds as { steps?: { value: number | null; color: string }[] })?.steps;
  if (!Array.isArray(steps)) return undefined;
  let tone: string | undefined;
  for (const step of steps) {
    if (step.value === null || value >= step.value) tone = NAMED[step.color] ?? undefined;
  }
  return tone;
}

/** Grafana's palette names, mapped onto ours so a dashboard's intent survives the import. */
const NAMED: Record<string, string> = {
  green: STATUS_COLORS.good,
  "semi-dark-green": STATUS_COLORS.good,
  yellow: STATUS_COLORS.warning,
  orange: STATUS_COLORS.serious,
  red: STATUS_COLORS.critical,
  "semi-dark-red": STATUS_COLORS.critical,
};
