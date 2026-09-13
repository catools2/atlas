import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import { listQueries, runQuery } from "../../../shared/analytics/analyticsClient";
import { DataTable } from "../../qa/components/DataTable";
import { FreshnessBadge } from "../../../shared/analytics/FreshnessBadge";
import { TruncationNote } from "../../../shared/analytics/TruncationNote";
import { fromCell, fromRow } from "../../../shared/analytics/chartClick";
import { defaultResolver, useDrill } from "../../../shared/analytics/drill";
import { rememberTitle } from "../../../shared/ui/titleCache";
import type { QueryResult, QuerySummary } from "../../../shared/analytics/types";
import { ParamForm, toRequest } from "../ParamForm";

/**
 * One query: what it reads, what it takes, and what it returns.
 *
 * <p>The landing target for a panel's "open in query explorer" and, later, for an agent citing
 * a figure. Both amount to the same question — *where did this number come from* — and the
 * answer should be a page you can arrive at by link, with the parameters already filled in.
 */
export function QueryDetailPage() {
  const { id = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState<QuerySummary | null>(null);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let live = true;
    listQueries()
      .then((all) => live && setQuery(all.find((q) => q.id === id) ?? null))
      .catch((e) => live && setError(e instanceof Error ? e.message : String(e)));
    return () => { live = false; };
  }, [id]);

  useEffect(() => {
    if (query) rememberTitle(`/queries/${id}`, query.title);
  }, [query, id]);

  // Parameters live in the URL, so a filled-in query explorer is a shareable link - which is
  // the whole point of it being the target of a citation.
  const values = useMemo(() => {
    const out: Record<string, string> = {};
    for (const [key, value] of params.entries()) out[key] = value;
    return out;
  }, [params]);

  const drill = useDrill(defaultResolver(query), (patch, replace) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, Array.isArray(value) ? value.join(",") : value);
    }
    setParams(next, { replace });
  });

  async function run() {
    if (!query) return;
    setRunning(true);
    setError(null);
    try {
      setResult(await runQuery(query.id, toRequest(query.params, values)));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  }

  if (!query && !error) return <p className="card p-4 text-sm text-ink-muted">Loading…</p>;
  if (!query) return <p className="card p-4 text-sm">{error ?? `No query ${id}.`}</p>;

  return (
    <div className="flex flex-col gap-3">
      <header className="flex flex-wrap items-baseline gap-2">
        <h1 className="text-lg font-semibold">{query.title}</h1>
        <code className="text-[10px] text-ink-muted">{query.id}</code>
        {result ? <FreshnessBadge freshness={result.freshness} /> : null}
      </header>

      <section className="card flex flex-col gap-3 p-3">
        <ParamForm
          params={query.params}
          values={values}
          onChange={(name, value) => {
            const next = new URLSearchParams(params);
            if (value) next.set(name, value); else next.delete(name);
            setParams(next, { replace: true });
          }}
        />
        <div className="flex items-center gap-2">
          <button type="button" className="btn-primary" onClick={run} disabled={running}>
            {running ? "Running…" : "Run"}
          </button>
          <p className="text-xs text-ink-muted">
            Reads {query.views.length > 0 ? query.views.join(", ") : "no view"}
          </p>
        </div>
      </section>

      {error ? <p className="card p-3 text-sm text-state-danger">{error}</p> : null}

      {result ? (
        <section className="card overflow-hidden p-0">
          <DataTable
            result={result}
            onRowClick={(row) => drill(fromRow(row, { kind: "table", queryId: query.id }))}
            onCellClick={(row, column) =>
              drill(fromCell(row, column, { kind: "table", queryId: query.id }))}
          />
          <TruncationNote truncated={result.truncated} rows={result.rows.length} />
        </section>
      ) : null}

    </div>
  );
}
