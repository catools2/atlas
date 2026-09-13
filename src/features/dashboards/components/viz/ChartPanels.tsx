import {
  Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, Pie, PieChart,
  RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

import { ChartTooltip } from "../../../../shared/analytics/ChartTooltip";
import { CHART_INK, seriesColor } from "../../../../shared/analytics/palette";
import { fromChart, fromMark } from "../../../../shared/analytics/chartClick";
import { labelFor } from "../../../../shared/analytics/drill";
import { categoryColumn, seriesColumns, toNumber } from "./vizProps";
import type { VizProps } from "./vizProps";

/**
 * The Recharts-backed viz types.
 *
 * <p>Kept together because they share one decision: **how a click becomes a datum**. Each chart
 * type reports clicks differently, and the difference is not cosmetic — see
 * `chartClick.ts`. Spreading these across five files would spread that with them.
 */

/** More than this and the legend is longer than the chart, and the colours stop being telling. */
const MAX_SERIES = 7;

function limited(names: string[]): string[] {
  return names.length <= MAX_SERIES ? names : names.slice(0, MAX_SERIES);
}

const AXIS = { stroke: CHART_INK.axis, fontSize: 11 } as const;

export function TimeseriesPanel({ figure, result, rows, height, onDrill }: VizProps) {
  const category = categoryColumn(result);
  const series = limited(seriesColumns(result, category));
  const source = { kind: "chart" as const, panelId: String(figure.id) };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart
        data={rows}
        margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
        // Chart-level, not per-point: a line's dots are commonly not rendered at all, so there
        // is nothing to hit. The x position is what the reader is pointing at.
        onClick={(state) => {
          const datum = fromChart(state, source);
          if (datum) onDrill(datum);
        }}
      >
        <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
        <XAxis dataKey={category} {...AXIS} />
        <YAxis {...AXIS} width={44} />
        <Tooltip content={<ChartTooltip />} />
        {series.length > 1 ? <Legend wrapperStyle={{ fontSize: 11 }} /> : null}
        {series.map((name) => (
          <Line
            key={name}
            type="monotone"
            dataKey={name}
            name={labelFor(name)}
            stroke={seriesColor(name, series)}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function BarPanel({ figure, result, rows, height, onDrill }: VizProps) {
  const category = categoryColumn(result);
  const series = limited(seriesColumns(result, category));
  const source = { kind: "chart" as const, panelId: String(figure.id) };
  // Long labels are unreadable rotated; past a handful of categories, turn the chart instead.
  const horizontal = rows.length > 8
    || rows.some((r) => String(r[category] ?? "").length > 14);
  const stacked = Boolean(figure.stacked);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={rows}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
        // The fallback for a segment of zero height, which cannot be clicked at all - without
        // it, days with no data are simply unreachable.
        onClick={(state) => {
          const datum = fromChart(state, source);
          if (datum) onDrill(datum);
        }}
      >
        <CartesianGrid stroke={CHART_INK.grid} vertical={horizontal} horizontal={!horizontal} />
        {horizontal
          ? <><XAxis type="number" {...AXIS} /><YAxis type="category" dataKey={category} width={110} {...AXIS} /></>
          : <><XAxis dataKey={category} {...AXIS} /><YAxis {...AXIS} width={44} /></>}
        <Tooltip content={<ChartTooltip />} />
        {series.length > 1 ? <Legend wrapperStyle={{ fontSize: 11 }} /> : null}
        {series.map((name) => (
          <Bar
            key={name}
            dataKey={name}
            name={labelFor(name)}
            stackId={stacked ? "a" : undefined}
            fill={seriesColor(name, series)}
            isAnimationActive={false}
            onClick={(mark, _index, event) => {
              // Otherwise the chart-level handler answers too, and its answer - being less
              // specific - is the one that lands.
              (event as { stopPropagation?: () => void })?.stopPropagation?.();
              onDrill(fromMark(mark, source, name));
            }}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PiePanel({ figure, result, rows, height, onDrill }: VizProps) {
  const category = categoryColumn(result);
  const measure = seriesColumns(result, category)[0];
  const source = { kind: "chart" as const, panelId: String(figure.id) };
  const keys = rows.map((r) => String(r[category] ?? ""));
  if (!measure) return <p className="muted">No numeric column to chart.</p>;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Tooltip content={<ChartTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Pie
          data={rows}
          dataKey={measure}
          nameKey={category}
          // A donut rather than a pie: the centre hole gives the eye a baseline, and angle
          // comparisons are easier against one.
          innerRadius="45%"
          outerRadius="75%"
          isAnimationActive={false}
          onClick={(mark) => onDrill(fromMark(mark, source, measure))}
        >
          {rows.map((_row, index) => (
            <Cell key={index} fill={seriesColor(keys[index], keys)} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

export function GaugePanel({ figure, result, rows, height, onDrill }: VizProps) {
  const category = categoryColumn(result);
  const measure = seriesColumns(result, category)[0] ?? result.columns[0]?.name;
  const value = toNumber(rows[0]?.[measure]);
  const max = figure.display?.max ?? 100;
  const source = { kind: "chart" as const, panelId: String(figure.id) };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadialBarChart
        data={[{ name: labelFor(measure ?? "value"), value, fill: seriesColor(measure ?? "", [measure ?? ""]) }]}
        innerRadius="65%"
        outerRadius="95%"
        // An open arc, so the gap reads as "not full" rather than as a missing slice.
        startAngle={210}
        endAngle={-30}
        onClick={() => rows[0] && onDrill(fromMark(rows[0], source, measure))}
      >
        <YAxis type="number" domain={[figure.display?.min ?? 0, max]} tick={false} axisLine={false} />
        <RadialBar dataKey="value" cornerRadius={4} isAnimationActive={false} background />
        <Tooltip content={<ChartTooltip />} />
      </RadialBarChart>
    </ResponsiveContainer>
  );
}
