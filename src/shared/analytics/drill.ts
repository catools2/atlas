import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { entityIn } from "./entityKeys";
import type { QuerySummary } from "./types";

/**
 * What happens when you click a mark. One mechanism, for every chart and every table.
 *
 * <p>Before this, each page invented its own: `TestCyclesPage` had a pipe-encoded `drill`/
 * `drillValue` pair with a decoder of its own, `HomePage` navigated, the workspace pages did
 * nothing at all. Four encoders meant four ways for a shareable link to stop meaning what it
 * said, and a chart's behaviour depended on which page you were looking at.
 *
 * <h2>The choice rule</h2>
 *
 * Written down once, here, because "dialog or page?" answered case by case is how an app stops
 * feeling like one app:
 *
 * | Situation | Action |
 * |---|---|
 * | "Show me the rows behind this mark" — same entity, one level down | `dialog` |
 * | The mark selects *which* entity is on screen, and the page re-renders around it | `drill` |
 * | The answer lives on another page with a different vocabulary | `navigate` |
 * | The click narrows the current view without changing the question | `filter` |
 * | The datum carries nothing bindable | `none` |
 *
 * A dialog is for a detour: the reader is asking "who is in that bar", not leaving the chart, and
 * a page transition would cost them the filters, the scroll position and the chart they were
 * reading. A drill is for a change of subject that the same page can express.
 *
 * <h2>The floor</h2>
 *
 * {@link defaultResolver} always returns something actionable — see its own note. "Every chart
 * and table is clickable" is only true if there is no path through the resolver that ends in a
 * shrug.
 */

/** One clicked thing, normalised out of whatever the chart library handed us. */
export interface Datum {
  source: {
    kind: "chart" | "table" | "tile";
    /** Which panel it came from, when a dashboard is rendering many. */
    panelId?: string;
    /** The query behind it, which is what makes tier 2 possible. */
    queryId?: string;
  };
  /** The full row behind the mark, keyed by column name. */
  row: Record<string, unknown>;
  /** The stack or series segment, when the reader clicked a specific one. */
  seriesKey?: string;
  /** The x or category value, in its own units. */
  category?: unknown;
}

export type DrillAction =
  /** A different page. New crumb, new vocabulary. */
  | { kind: "navigate"; to: string; label: string }
  /** Same route, deeper. Pushes a param, so Back undoes exactly one step. */
  | { kind: "drill"; param: string; value: string; label: string }
  /** The rows behind the mark, over the page rather than instead of it. */
  | { kind: "dialog"; drill: string; drillValue: string; title: string }
  /** Narrow in place. Replaces, so it adds no history entry. */
  | { kind: "filter"; patch: Record<string, string | string[] | null> }
  /** Nothing to do, and the reason, so the UI can render the mark as inert rather than dead. */
  | { kind: "none"; reason: string };

export type DrillResolver = (datum: Datum) => DrillAction;

/**
 * The resolver of last resort, in three tiers. Never returns `none`.
 *
 * <p>1. The row names an entity the app has a page for → go there.
 * <p>2. The row has a column that binds a parameter of the panel's own query → open the same
 *    query again, narrowed by it. "The rows behind this mark", from the source that drew it.
 * <p>3. Neither → open the row itself.
 *
 * <p>Tier 3 is the whole reason the requirement is satisfiable. Without it, a chart over an
 * aggregate with no key and no bindable column has nothing to offer, and "every mark is
 * clickable" quietly becomes "most marks are clickable". Showing the reader the row they clicked
 * is always possible and is never useless.
 */
export function defaultResolver(query?: QuerySummary | null): DrillResolver {
  return (datum) => {
    const entity = entityIn(datum.row);
    if (entity) {
      return {
        kind: "navigate",
        to: entity.href,
        label: `Open ${entity.key.noun} ${entity.value}`,
      };
    }

    const bindable = query?.params.find(
      (param) => param.kind !== "operator" && param.name in datum.row,
    );
    if (bindable) {
      const value = datum.row[bindable.name];
      if (value !== null && value !== undefined && value !== "") {
        return {
          kind: "dialog",
          drill: bindable.name,
          drillValue: String(value),
          title: `${labelFor(bindable.name)}: ${String(value)}`,
        };
      }
    }

    return {
      kind: "dialog",
      drill: ROW_INSPECTOR,
      drillValue: "",
      title: describeDatum(datum),
    };
  };
}

/** The drill key tier 3 uses. A page seeing this renders the row rather than re-querying. */
export const ROW_INSPECTOR = "__row";

/** `execution_status` -> `Execution status`. */
export function labelFor(column: string): string {
  const words = column.replace(/_/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** A title for the row inspector: what the reader clicked, in their terms. */
export function describeDatum(datum: Datum): string {
  if (datum.seriesKey && datum.category !== undefined && datum.category !== null) {
    return `${String(datum.category)} — ${labelFor(datum.seriesKey)}`;
  }
  if (datum.category !== undefined && datum.category !== null) return String(datum.category);
  if (datum.seriesKey) return labelFor(datum.seriesKey);
  return "Selected row";
}

/**
 * Turns a resolved action into navigation.
 *
 * <p>`navigate` and `drill` push; `filter` replaces. That distinction is the reason dragging a
 * time window does not bury the previous page under twenty history entries, while drilling into
 * a cycle leaves exactly one step for Back to undo.
 */
export function useDrill(
  resolver: DrillResolver,
  apply: (patch: Record<string, string | string[] | null>, replace: boolean) => void,
): (datum: Datum) => DrillAction {
  const navigate = useNavigate();

  return useCallback(
    (datum: Datum) => {
      const action = resolver(datum);
      switch (action.kind) {
        case "navigate":
          navigate(action.to);
          break;
        case "drill":
          apply({ [action.param]: action.value }, false);
          break;
        case "dialog":
          apply({ drill: action.drill, drillValue: action.drillValue }, false);
          break;
        case "filter":
          apply(action.patch, true);
          break;
        case "none":
          break;
      }
      return action;
    },
    [resolver, apply, navigate],
  );
}
