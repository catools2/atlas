import { seriesColor } from "../../../../shared/analytics/palette";
import { fromRow } from "../../../../shared/analytics/chartClick";
import { labelFor } from "../../../../shared/analytics/drill";
import { categoryColumn, seriesColumns, toNumber } from "./vizProps";
import type { VizProps } from "./vizProps";

/**
 * A labelled bar per row, drawn in CSS.
 *
 * <p>46 panels in the corpus are bar gauges, and not one of them needs a charting library: this
 * is a label, a track and a fill. Rendering them with Recharts would cost an SVG layout pass per
 * panel for a shape that `flex` already describes, and would make each bar unfocusable into the
 * bargain.
 *
 * <p>The value is always printed next to the bar. Length alone is a comparison; the number is
 * the fact, and a reader should not have to measure pixels to get it.
 */
export function BarGaugePanel({ figure, result, rows, onDrill }: VizProps) {
  const category = categoryColumn(result);
  const measures = seriesColumns(result, category).filter((name) =>
    rows.some((row) => typeof row[name] === "number" || !Number.isNaN(Number(row[name]))),
  );
  const measure = measures[0];
  if (!measure) return <p className="muted">No numeric column to gauge.</p>;

  const values = rows.map((row) => toNumber(row[measure]));
  // Scale to the data unless the panel declares a range; a gauge whose longest bar is 3% of
  // its track reads as "nothing is happening" when the truth may be the opposite.
  const max = figure.display?.max ?? Math.max(1, ...values);
  const min = figure.display?.min ?? 0;
  const keys = rows.map((row) => String(row[category] ?? ""));

  return (
    <ul className="flex flex-col gap-1">
      {rows.map((row, index) => {
        const value = values[index];
        const pct = Math.max(0, Math.min(100, ((value - min) / (max - min || 1)) * 100));
        const label = keys[index] || labelFor(measure);
        return (
          <li key={index}>
            <button
              type="button"
              className="group grid w-full grid-cols-[minmax(6rem,9rem)_1fr_auto] items-center gap-2 rounded px-1 py-0.5 text-left focus:outline-none focus:ring-1 focus:ring-accent"
              onClick={() => onDrill(fromRow(row, { kind: "chart", panelId: String(figure.id) }))}
            >
              <span className="truncate text-xs text-ink-muted">{label}</span>
              <span className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
                <span
                  className="block h-full rounded-full transition-[width]"
                  style={{ width: `${pct}%`, background: seriesColor(label, keys) }}
                />
              </span>
              <span className="tabular-nums text-xs">{format(value, figure.display?.decimals)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function format(value: number, decimals?: number): string {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: decimals ?? (Number.isInteger(value) ? 0 : 1),
  });
}
