import type { ComponentType } from "react";

import type { Viz } from "../../../../shared/analytics/types";
import { BarGaugePanel } from "./BarGaugePanel";
import { BarPanel, GaugePanel, PiePanel, TimeseriesPanel } from "./ChartPanels";
import { StatPanel, TablePanel } from "./SimplePanels";
import type { VizProps } from "./vizProps";

/**
 * Viz name to component. The whole renderer, in one map.
 *
 * <p>A figure names a viz; this decides what draws it. Adding a chart type is an entry here and
 * a component — no change to the figure frame, the query plumbing or the drill contract,
 * because none of them knows what a viz is.
 *
 * <p>`row` and `text` are absent: both were Grafana layout constructs, and a report page says
 * those things in JSX instead. `heatmap` and `stateTimeline` are absent because no query in the
 * registry produces them. An unknown viz degrades to a table rather than to a blank, which is
 * honest and usually still readable.
 */
export const VIZ: Partial<Record<Viz, ComponentType<VizProps>>> = {
  timeseries: TimeseriesPanel,
  bar: BarPanel,
  barGauge: BarGaugePanel,
  pie: PiePanel,
  gauge: GaugePanel,
  stat: StatPanel,
  table: TablePanel,
};

/** What draws this viz, falling back to a table. */
export function vizComponent(viz: Viz): ComponentType<VizProps> {
  return VIZ[viz] ?? TablePanel;
}

export type { VizProps };
