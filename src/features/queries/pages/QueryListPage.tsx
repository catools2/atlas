import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { listQueries } from "../../../shared/analytics/analyticsClient";
import type { QuerySummary } from "../../../shared/analytics/types";

/**
 * Every registered query, searchable.
 *
 * <p>This is the other half of "callers cannot supply SQL". The registry is not a hidden
 * implementation detail — a reader who wants to know where a number came from can find the
 * query, see which views it reads, and run it themselves with different parameters.
 */
export function QueryListPage() {
  const [queries, setQueries] = useState<QuerySummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();
  const search = params.get("q") ?? "";

  useEffect(() => {
    let live = true;
    listQueries()
      .then((all) => live && setQueries(all))
      .catch((e) => live && setError(e instanceof Error ? e.message : String(e)));
    return () => { live = false; };
  }, []);

  const shown = useMemo(() => {
    if (!queries) return [];
    const needle = search.trim().toLowerCase();
    if (!needle) return queries;
    // Title, id and the views it reads: "which queries touch mv_items" is the question people
    // actually arrive with.
    return queries.filter((q) =>
      `${q.title} ${q.id} ${q.views.join(" ")}`
        .toLowerCase()
        .includes(needle),
    );
  }, [queries, search]);

  if (error) return <p className="card p-4 text-sm">{error}</p>;
  if (!queries) return <p className="card p-4 text-sm text-ink-muted">Loading queries…</p>;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-semibold">Queries</h1>
        <span className="text-xs text-ink-muted">
          {shown.length === queries.length
            ? `${queries.length} registered`
            : `${shown.length} of ${queries.length}`}
        </span>
        <input
          className="ml-auto w-64 rounded border border-line bg-surface-strong px-2 py-1 text-xs"
          placeholder="Filter by title, id or view…"
          value={search}
          // Replaces: typing must not bury the previous page under one history entry per
          // keystroke.
          onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })}
        />
      </div>

      <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {shown.map((query) => (
          <li key={query.id}>
            <Link to={`/queries/${query.id}`} className="card block p-3">
              <h2 className="truncate text-sm font-medium" title={query.title}>{query.title}</h2>
              <p className="mt-1 font-mono text-[10px] text-ink-muted">{query.id}</p>
              <p className="mt-1 truncate text-xs text-ink-muted" title={query.views.join(", ")}>
                {query.views.length > 0 ? query.views.join(", ") : "no view"}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
