import type { ComponentType } from "react";

import { DefectsReport } from "./pages/DefectsReport";
import { EnvironmentHealthReport } from "./pages/EnvironmentHealthReport";
import { DatabaseExecutionReport } from "./pages/DatabaseExecutionReport";
import { InventoryTrendReport } from "./pages/InventoryTrendReport";
import { PlaywrightReport } from "./pages/PlaywrightReport";
import { QaDashboardReport } from "./pages/QaDashboardReport";
import { RegressionStatisticsReport } from "./pages/RegressionStatisticsReport";
import { TeamRegressionReport } from "./pages/TeamRegressionReport";
import { TeamsOverallRegressionReport } from "./pages/TeamsOverallRegressionReport";

export interface ReportEntry {
  path: string;
  title: string;
  /** One line for the index card. */
  blurb: string;
  component: ComponentType;
}

/**
 * Every report the console serves.
 *
 * <p>Nine pages, each a real React component under `pages/`. They were scaffolded once from the
 * Grafana exports so that 124 figures and their query ids were transcribed rather than typed,
 * and the scaffold was then deleted: these are ordinary source files now, and changing a title,
 * a section or a layout is an edit to the page.
 *
 * <p>Nothing here is loaded from a JSON specification and nothing is fetched from
 * No dashboard specification is loaded here. A page binds canonical registry query ids, and the
 * analytics service answers them.
 */
export const REPORTS: ReportEntry[] = [
  {
    path: "/dashboards/qa-dashboard",
    title: "QA Dashboard",
    blurb: "Size of the test estate, how fast it is growing, and the debt it carries.",
    component: QaDashboardReport,
  },
  {
    path: "/dashboards/regression",
    title: "Regression Statistics",
    blurb: "How a regression cycle went, by execution track, and what it cost in defects.",
    component: RegressionStatisticsReport,
  },
  {
    path: "/dashboards/team-regression",
    title: "Team Regression Statistics",
    blurb: "One team's regression picture for a selected version.",
    component: TeamRegressionReport,
  },
  {
    path: "/dashboards/teams-regression",
    title: "Teams Overall Regression Statistics",
    blurb: "The same regression view, aggregated across teams.",
    component: TeamsOverallRegressionReport,
  },
  {
    path: "/dashboards/defects",
    title: "Defects Statistics",
    blurb: "Where defects are, who is finding them, and whether the rate is changing.",
    component: DefectsReport,
  },
  {
    path: "/dashboards/playwright",
    title: "Playwright Automation",
    blurb: "What the Playwright suite covers and how its last runs went.",
    component: PlaywrightReport,
  },
  {
    path: "/dashboards/environment-health",
    title: "Environment Healthcheck",
    blurb: "Whether an environment is healthy now, and how it compares with another.",
    component: EnvironmentHealthReport,
  },
  {
    path: "/dashboards/inventory-trend",
    title: "Cumulative Test Inventory by Team",
    blurb: "How a team's inventory and automation debt moved over time.",
    component: InventoryTrendReport,
  },
  {
    path: "/dashboards/database-execution",
    title: "Database Execution Status",
    blurb: "The most recent database pipeline run, by component.",
    component: DatabaseExecutionReport,
  },
];

/**
 * External dashboards that are outside the Athena query registry.
 *
 * <p>Shown on the index rather than omitted. All four are backed entirely by InfluxDB and
 * Prometheus — 38 panels between them and **zero** queries in the Athena registry — so there is
 * nothing for a page to bind to. Leaving them off the list silently would make the console look
 * complete while four dashboards' worth of questions had quietly become unanswerable.
 */
export const NOT_AVAILABLE = [
  { title: "Specialized Batch Jobs Statistics", reason: "InfluxDB" },
  { title: "Specialized Batch Steps Statistics", reason: "InfluxDB" },
  { title: "Specialized Data Volume", reason: "InfluxDB" },
  { title: "Perf :: Rest Reports", reason: "InfluxDB" },
];

