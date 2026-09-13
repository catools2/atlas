/**
 * Every route this app serves, as data.
 *
 * <p>The router, the navigation and the breadcrumb registry all need to agree about what routes
 * exist. Three hand-maintained lists agree right up until somebody adds a route to one of them,
 * so there is one list and the others read it.
 *
 * <p>This is deliberately data and not JSX: a test can iterate it, which is what turns
 * "breadcrumbs on every page" from a sweep that was true once into something the build enforces.
 */

export interface RouteEntry {
  /** The router path, relative to the `/ui` basename. */
  path: string;
  /** A concrete example for the patterned ones, so tests can exercise them. */
  sample?: string;
  /** Grouping for the nav; absent means it is reachable but not listed. */
  navGroup?: "analytics" | "workspaces" | "reports" | "agent" | "atlas";
}

export const ROUTE_TABLE: RouteEntry[] = [
  { path: "/", navGroup: "analytics" },
  { path: "/test-cycles", navGroup: "analytics" },
  { path: "/performance", navGroup: "analytics" },
  { path: "/correlation", navGroup: "analytics" },
  { path: "/overview", navGroup: "analytics" },
  { path: "/dashboards", navGroup: "analytics" },
  { path: "/atlas/workflows", navGroup: "atlas" },
  { path: "/atlas/workflows/:code", sample: "/atlas/workflows/test-designer" },
  { path: "/atlas/runs", navGroup: "atlas" },
  { path: "/atlas/runs/:workflow/:scope", sample: "/atlas/runs/test-designer/sample-1" },
  { path: "/queries", navGroup: "analytics" },
  { path: "/queries/:id", sample: "/queries/regressionstatistics__reported_defects__panel_51" },
  { path: "/dashboards/qa-dashboard" },
  { path: "/dashboards/regression" },
  { path: "/dashboards/team-regression" },
  { path: "/dashboards/teams-regression" },
  { path: "/dashboards/defects" },
  { path: "/dashboards/playwright" },
  { path: "/dashboards/environment-health" },
  { path: "/dashboards/inventory-trend" },
  { path: "/dashboards/database-execution" },

  { path: "/metrics/executions", navGroup: "workspaces" },
  { path: "/pipelines/runs", navGroup: "workspaces" },
  { path: "/runtime/pods", navGroup: "workspaces" },
  { path: "/git/repositories", navGroup: "workspaces" },
  { path: "/apis/specs", navGroup: "workspaces" },
  { path: "/apis/specs/:id", sample: "/apis/specs/4821" },
  { path: "/quality/executions", navGroup: "workspaces" },
  { path: "/quality/executions/:id", sample: "/quality/executions/99" },

  { path: "/reports", navGroup: "reports" },
  { path: "/reports/:report", sample: "/reports/portfolio" },

  { path: "/agent", navGroup: "agent" },
];

/** A concrete pathname for a route, for tests and for nav links. */
export function samplePath(entry: RouteEntry): string {
  return entry.sample ?? entry.path;
}
