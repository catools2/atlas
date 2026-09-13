/** Shapes returned by athena-boot-analytics. */

export type ParamKind = "scalar" | "list" | "instant" | "operator";

export interface ParamSpec {
  name: string;
  kind: ParamKind;
  /** For `operator` params, the only values the server will accept. */
  allowed: string[];
}

export interface QuerySummary {
  id: string;
  title: string;
  views: string[];
  tables: string[];
  params: ParamSpec[];
}

export interface QueryColumn {
  name: string;
  type: string;
}

export interface ViewFreshness {
  view: string;
  /** Null when unknown - a plain view, or a refresh that has not run or did not succeed. */
  refreshedAt: string | null;
  materialized: boolean;
}

export interface QueryResult {
  queryId: string;
  columns: QueryColumn[];
  rows: unknown[][];
  /** True when the row cap cut the result short, so the panel can say so. */
  truncated: boolean;
  views: string[];
  freshness: ViewFreshness[];
}

export type Viz =
  | "timeseries" | "bar" | "barGauge" | "pie" | "table"
  | "stat" | "gauge" | "text" | "row" | "heatmap" | "stateTimeline";

// The dashboard specification types - PanelQuery, PanelSpec, VariableSpec, DashboardSpec and
// DashboardSummary - lived here while the console rendered imported Grafana documents. Reports
// are hand-written pages now: a figure names its query, its viz and its span in JSX, so there
// is no document to describe and nothing left to type. `Viz` survives because a figure still
// says which chart it wants.
