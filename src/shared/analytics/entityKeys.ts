/**
 * Columns that name a thing the app has a page for.
 *
 * <p>The drill resolver's first question is "does this row identify something I can navigate to".
 * That question needs one answer, in one place: a column called `cycle_code` means the same thing
 * whichever of 137 registered queries produced it, and every page deciding for itself is how two
 * charts end up disagreeing about what clicking a cycle does.
 *
 * <p>Adding an entry here makes every chart and table in the app drillable on that column at
 * once, which is the point.
 */

export interface EntityKey {
  /** Where it goes. `:value` is replaced with the cell's value, URL-encoded. */
  to: string;
  /** What the crumb and the tooltip call it. */
  noun: string;
}

/**
 * Column name -> destination. Checked in order, so a row carrying both `item_key` and
 * `cycle_code` drills to the more specific one.
 */
export const ENTITY_KEYS: Record<string, EntityKey> = {
  // Most specific first.
  execution_id: { to: "/quality/executions/:value", noun: "execution" },
  item_key: { to: "/test-cycles?item=:value", noun: "test" },
  cycle_code: { to: "/test-cycles?cycle=:value", noun: "cycle" },
  spec_id: { to: "/apis/specs/:value", noun: "specification" },
  repository: { to: "/git/repositories?repository=:value", noun: "repository" },
  pipeline: { to: "/pipelines/runs?pipeline=:value", noun: "pipeline" },
  namespace: { to: "/runtime/pods?namespace=:value", noun: "namespace" },
  app: { to: "/runtime/pods?app=:value", noun: "app" },
  action: { to: "/performance?action=:value", noun: "action" },
  target: { to: "/performance?target=:value", noun: "target" },
  query_id: { to: "/queries/:value", noun: "query" },
};

/** Checked in declaration order; `Object.keys` preserves it for string keys. */
const ORDER = Object.keys(ENTITY_KEYS);

export interface EntityMatch {
  column: string;
  value: string;
  key: EntityKey;
  href: string;
}

/** The most specific entity a row identifies, or null if it identifies none. */
export function entityIn(row: Record<string, unknown>): EntityMatch | null {
  for (const column of ORDER) {
    const raw = row[column];
    if (raw === null || raw === undefined || raw === "") continue;
    const value = String(raw);
    return {
      column,
      value,
      key: ENTITY_KEYS[column],
      href: ENTITY_KEYS[column].to.replace(":value", encodeURIComponent(value)),
    };
  }
  return null;
}
