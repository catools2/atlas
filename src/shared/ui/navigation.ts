/**
 * What each route's URL means, in one place.
 *
 * The top bar has to render a breadcrumb and a set of filter chips for whichever page is
 * mounted, and there are two ways to arrange that: pages publish their state upward through a
 * context, or the bar derives it from the URL. This is the second.
 *
 * The URL is already the single source of truth for both filters and drill position, so deriving
 * from it needs no extra state, cannot fall out of step with the page, and - the practical
 * reason - avoids pages writing into a shared store while rendering, which is the usual way this
 * shape turns into an update loop.
 *
 * The defaults live here rather than in the pages so that the param schema has one owner. Pages
 * import them; nothing here imports a page.
 */

import { matchPath } from "react-router-dom";

import { chipsFor, titleFor } from "./titleCache";

export type FilterDefaults = Record<string, string | string[]>;

export const HOME_DEFAULTS = {
  range: "30d", from: "", to: "", version: "", project: "", team: [] as string[],
};

export const CYCLES_DEFAULTS = {
  range: "30d", from: "", to: "",
  version: "", project: "", team: [] as string[], status: "", search: "",
  cycle: "", item: "", by: "priority", drill: "", drillValue: "",
};

export const PERF_DEFAULTS = {
  range: "7d", from: "", to: "",
  environment: "", project: "", actionType: "", search: "",
  action: "", target: "",
};

export const CORRELATION_DEFAULTS = {
  range: "24h", from: "", to: "",
  repository: [] as string[], author: "", pipeline: "", version: "",
  environment: "", namespace: "", app: "", status: "", search: "",
};

/** Params that select a chart's view rather than narrowing data - never counted as filters. */
export const DISPLAY_ONLY = ["by"] as const;

interface RouteSpec {
  title: string;
  defaults: FilterDefaults;
  /** Params that are drill steps, outermost first. Each becomes a breadcrumb. */
  drill: string[];
  /** Filter params, with the label the chip should carry. */
  chips: Record<string, string>;
  /**
   * The route one level up, as a pattern key.
   *
   * <p>Ancestors are declared rather than derived from path segments, because the two are not
   * the same: `/reports/portfolio` sits under `/reports`, but `/quality/executions` has no
   * `/quality` page to go back to.
   */
  parent?: string;
  /**
   * The crumb's label when the title alone will not do — a detail page named after the record
   * it is showing. Falls back to the id, which is always present, so a crumb is never blank.
   */
  label?: (params: Record<string, string>, pathname: string) => string;
}

const TIME_CHIP = { range: "Window" };

export const ROUTES: Record<string, RouteSpec> = {
  "/": {
    title: "Overview",
    defaults: HOME_DEFAULTS,
    drill: [],
    chips: { ...TIME_CHIP, version: "Version", project: "Project", team: "Team" },
  },
  "/test-cycles": {
    title: "Test cycles",
    defaults: CYCLES_DEFAULTS,
    drill: ["cycle", "item"],
    chips: {
      ...TIME_CHIP, version: "Version", project: "Project", team: "Team",
      status: "Status", search: "Search",
    },
  },
  "/performance": {
    title: "Performance",
    defaults: PERF_DEFAULTS,
    drill: ["action", "target"],
    chips: {
      ...TIME_CHIP, environment: "Environment", project: "Project",
      actionType: "Type", search: "Action",
    },
  },
  "/correlation": {
    title: "Change & run",
    defaults: CORRELATION_DEFAULTS,
    drill: [],
    chips: {
      ...TIME_CHIP, repository: "Repository", author: "Author", pipeline: "Pipeline",
      version: "Version", environment: "Environment", namespace: "Namespace",
      app: "App", status: "Outcome", search: "Search",
    },
  },
  "/agent": { title: "Ask Athena", defaults: {}, drill: [], chips: {} },

  // Workspaces. These read the domain services through the gateway rather than the analytics
  // registry, so they carry their own filter vocabulary rather than the shared one.
  // Atlas workflows and the runs of them.
  "/atlas/workflows": { title: "Workflows", defaults: {}, drill: [], chips: {} },
  "/atlas/workflows/:code": {
    title: "Workflow",
    defaults: {},
    drill: ["stage"],
    chips: {},
    parent: "/atlas/workflows",
    label: (params, pathname) => titleFor(pathname) ?? params.code,
  },
  "/atlas/runs": { title: "Runs", defaults: {}, drill: [], chips: {} },
  "/atlas/runs/:workflow/:scope": {
    title: "Run",
    defaults: {},
    // A stage and an artifact are drill steps, so each breadcrumbs and Back undoes one.
    drill: ["stage", "artifact"],
    chips: {},
    parent: "/atlas/runs",
    label: (params, pathname) => titleFor(pathname) ?? params.scope,
  },

  // The query registry, browsable. Where a figure came from is a page, not a mystery.
  "/queries": { title: "Queries", defaults: {}, drill: [], chips: { q: "Search" } },
  "/queries/:id": {
    title: "Query",
    defaults: {},
    drill: [],
    chips: {},
    parent: "/queries",
    label: (params, pathname) => titleFor(pathname) ?? params.id,
  },

  // The reports. Each is a real page, so its crumb is a literal rather than a title looked
  // up once a dashboard specification has been fetched.
  "/dashboards": { title: "Reports", defaults: {}, drill: [], chips: {} },
  "/dashboards/qa-dashboard": {
    title: "QA Dashboard",
    defaults: {},
    drill: [],
    chips: { range: "Window" },
    parent: "/dashboards",
  },
  "/dashboards/regression": {
    title: "Regression Statistics",
    defaults: {},
    drill: [],
    chips: { range: "Window" },
    parent: "/dashboards",
  },
  "/dashboards/team-regression": {
    title: "Team Regression Statistics",
    defaults: {},
    drill: [],
    chips: { range: "Window" },
    parent: "/dashboards",
  },
  "/dashboards/teams-regression": {
    title: "Teams Overall Regression",
    defaults: {},
    drill: [],
    chips: { range: "Window" },
    parent: "/dashboards",
  },
  "/dashboards/defects": {
    title: "Defects Statistics",
    defaults: {},
    drill: [],
    chips: { range: "Window" },
    parent: "/dashboards",
  },
  "/dashboards/playwright": {
    title: "Playwright Automation",
    defaults: {},
    drill: [],
    chips: { range: "Window" },
    parent: "/dashboards",
  },
  "/dashboards/environment-health": {
    title: "Environment Healthcheck",
    defaults: {},
    drill: [],
    chips: { range: "Window" },
    parent: "/dashboards",
  },
  "/dashboards/inventory-trend": {
    title: "Cumulative Test Inventory by Team",
    defaults: {},
    drill: [],
    chips: { range: "Window" },
    parent: "/dashboards",
  },
  "/dashboards/database-execution": {
    title: "Database Execution Status",
    defaults: {},
    drill: [],
    chips: { range: "Window" },
    parent: "/dashboards",
  },
  "/overview": { title: "Overview", defaults: {}, drill: [], chips: {} },
  "/metrics/executions": { title: "Metrics", defaults: {}, drill: [], chips: {} },
  "/pipelines/runs": { title: "Pipeline runs", defaults: {}, drill: [], chips: {} },
  "/runtime/pods": { title: "Runtime pods", defaults: {}, drill: [], chips: {} },
  "/git/repositories": { title: "Repositories", defaults: {}, drill: [], chips: {} },

  "/apis/specs": { title: "API specs", defaults: {}, drill: [], chips: {} },
  "/apis/specs/:id": {
    title: "API spec",
    defaults: {},
    drill: [],
    chips: {},
    parent: "/apis/specs",
    label: (params, pathname) => titleFor(pathname) ?? params.id,
  },

  "/quality/executions": { title: "Test executions", defaults: {}, drill: [], chips: {} },
  "/quality/executions/:id": {
    title: "Execution",
    defaults: {},
    drill: [],
    chips: {},
    parent: "/quality/executions",
    label: (params, pathname) => titleFor(pathname) ?? params.id,
  },

  // One pattern rather than six entries: the report list already names them, and duplicating
  // it here is how the two drift apart.
  "/reports": { title: "Reports", defaults: {}, drill: [], chips: {} },
  "/reports/:report": {
    title: "Report",
    defaults: {},
    drill: [],
    chips: {},
    parent: "/reports",
    label: (params, pathname) => titleFor(pathname) ?? titleCase(params.report),
  },
};

/** `delivery-quality` -> `Delivery quality`, until the page publishes its real title. */
function titleCase(slug: string | undefined): string {
  if (!slug) return "Report";
  const words = slug.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export interface Crumb {
  label: string;
  /** Absent on the last crumb, which is where we already are. */
  to?: string;
}

export interface Chip {
  key: string;
  label: string;
  value: string;
}

/**
 * Params that are not filters: where the reader is (drill position, an open dialog) and which
 * view a chart is showing. They belong in the URL and none of them narrows the data, so counting
 * them would make "Clear 4 filters" claim a view is narrower than it is.
 */
export function notFilters(pathname: string): string[] {
  const spec = resolve(pathname)?.spec;
  return [...DISPLAY_ONLY, ...(spec?.drill ?? []), "drill", "drillValue"];
}

/**
 * Find the spec for a pathname, exact keys first, then patterns.
 *
 * <p>Most specific wins: `/apis/specs` must not be answered by `/apis/:id`. Exact keys are
 * tried first and patterns are ordered by segment count descending, which is enough given the
 * shapes here — and much easier to reason about than a scoring function.
 */
const PATTERN_KEYS = Object.keys(ROUTES)
  .filter((key) => key.includes(":"))
  .sort((a, b) => b.split("/").length - a.split("/").length);

interface Resolved {
  spec: RouteSpec;
  /** The key it matched under, which is what `parent` points at. */
  key: string;
  params: Record<string, string>;
}

export function resolve(pathname: string): Resolved | null {
  const exact = ROUTES[pathname];
  if (exact) return { spec: exact, key: pathname, params: {} };

  for (const key of PATTERN_KEYS) {
    const match = matchPath({ path: key, end: true }, pathname);
    if (match) {
      const params: Record<string, string> = {};
      for (const [name, value] of Object.entries(match.params)) {
        if (value) params[name] = value;
      }
      return { spec: ROUTES[key], key, params };
    }
  }
  return null;
}

/**
 * The path a parent crumb should link to.
 *
 * <p>A parent may itself be a pattern (`/reports/:report` under `/reports` is not, but a deeper
 * tree would be), so its own params are filled from the child's.
 */
function hrefFor(key: string, params: Record<string, string>): string {
  return key.replace(/:(\w+)/g, (_, name) => params[name] ?? `:${name}`);
}

export interface RouteView {
  title: string;
  crumbs: Crumb[];
  chips: Chip[];
}

/** Everything the top bar needs, read from the current location. */
export function describe(pathname: string, search: string): RouteView | null {
  const resolved = resolve(pathname);
  if (!resolved) return null;
  const { spec, key, params: pathParams } = resolved;

  const params = new URLSearchParams(search);
  const active = spec.drill.filter((k) => params.get(k));

  // Ancestors first, outermost last-in so the trail reads left to right. Each is a link,
  // because a crumb you cannot click is just decoration.
  const crumbs: Crumb[] = [];
  const seen = new Set<string>([key]);
  for (let parentKey = spec.parent; parentKey; ) {
    const parent = ROUTES[parentKey];
    if (!parent || seen.has(parentKey)) break; // a cycle in the table must not hang the bar
    seen.add(parentKey);
    crumbs.unshift({ label: parent.title, to: hrefFor(parentKey, pathParams) });
    parentKey = parent.parent;
  }

  // This route's own crumb. A detail page names the record it is showing; everything else
  // uses its title.
  const ownLabel = spec.label ? spec.label(pathParams, pathname) : spec.title;
  crumbs.push({
    label: ownLabel,
    // Keeps the filters and drops the drill, so it returns to the list rather than resetting
    // the view the reader had set up.
    to: active.length > 0 ? pathname + withoutDrill(params, spec.drill) : undefined,
  });

  active.forEach((key, index) => {
    const deeper = active.slice(index + 1);
    crumbs.push({
      label: params.get(key)!,
      to: deeper.length > 0 ? pathname + withoutDrill(params, deeper) : undefined,
    });
  });

  const chips: Chip[] = [];
  // A report page declares its own filters, so their chip labels arrive from the page rather
  // than from this table.
  const labels = { ...spec.chips, ...chipsFor(pathname) };
  for (const [key, label] of Object.entries(labels)) {
    const raw = params.get(key);
    if (!raw) continue;
    const fallback = spec.defaults[key];
    const fallbackText = Array.isArray(fallback) ? fallback.join(",") : fallback;
    if (raw === fallbackText) continue;
    chips.push({
      key,
      label,
      // A custom window is two more params; the chip says so rather than showing an ISO instant.
      value: key === "range" && raw === "custom" ? describeCustom(params) : raw.replace(/,/g, ", "),
    });
  }

  return { title: ownLabel, crumbs, chips };
}

/** Removing a chip also clears whatever else that filter is made of. */
export function chipParams(key: string): string[] {
  return key === "range" ? ["range", "from", "to"] : [key];
}

function withoutDrill(params: URLSearchParams, keys: string[]): string {
  const next = new URLSearchParams(params);
  for (const key of keys) next.delete(key);
  // A drill dialog belongs to the level it was opened from, so it closes with it.
  next.delete("drill");
  next.delete("drillValue");
  const text = next.toString();
  return text ? `?${text}` : "";
}

function describeCustom(params: URLSearchParams): string {
  const from = params.get("from");
  const to = params.get("to");
  if (!from || !to) return "custom";
  const short = (iso: string) => {
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString();
  };
  return from && to && short(from) === short(to) ? short(from) : `${short(from)} – ${short(to)}`;
}
