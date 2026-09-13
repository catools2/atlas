/**
 * Titles that only the page knows, made available to the breadcrumb.
 *
 * <p>A crumb for `/apis/specs/4821` should read "Payments v3", but the top bar cannot know that
 * without fetching — and fetching there would duplicate the request the page is already making.
 *
 * <p>So the page tells it. A module-level map, read through `useSyncExternalStore` so a write
 * re-renders the bar, and written from an effect rather than during render. That last part is the
 * whole reason this is not a context: a page publishing view state upward during render is how
 * this shape turns into an update loop.
 *
 * <p>A cold deep link shows the id and upgrades to the title when the fetch lands, which is the
 * right order — the crumb is never blank and never wrong, just briefly less specific.
 */

const titles = new Map<string, string>();
const chips = new Map<string, Record<string, string>>();
const listeners = new Set<() => void>();

function announce(): void {
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Called from an effect once a page knows what it is showing. */
export function rememberTitle(pathname: string, title: string | null | undefined): void {
  if (!title) return;
  if (titles.get(pathname) === title) return; // no-op writes must not re-render the bar
  titles.set(pathname, title);
  announce();
}

export function titleFor(pathname: string): string | undefined {
  return titles.get(pathname);
}

/**
 * Labels for filter chips a route cannot name statically.
 *
 * <p>A dashboard's variables are only known once its spec is fetched, so `v_team` has no label
 * until then. Same mechanism, same reason.
 */
export function rememberChips(pathname: string, labels: Record<string, string>): void {
  const existing = chips.get(pathname);
  if (existing && JSON.stringify(existing) === JSON.stringify(labels)) return;
  chips.set(pathname, labels);
  announce();
}

export function chipsFor(pathname: string): Record<string, string> {
  return chips.get(pathname) ?? {};
}

/** Tests only: the map outlives a component, so it has to be clearable between cases. */
export function resetTitles(): void {
  titles.clear();
  chips.clear();
  announce();
}
