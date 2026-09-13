import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { listQueries } from "../../../shared/analytics/analyticsClient";
import { useTimeWindow } from "../../../shared/analytics/filters";
import type { QuerySummary } from "../../../shared/analytics/types";
import { rememberChips, rememberTitle } from "../../../shared/ui/titleCache";

interface ReportContext {
  /** Parameters every figure on the page starts from: the time window plus the page's filters. */
  params: Record<string, unknown>;
  /** Query metadata by id, for the drill resolver. Empty until the catalogue loads. */
  queries: Record<string, QuerySummary>;
  apply: (patch: Record<string, string | string[] | null>, replace: boolean) => void;
}

const Context = createContext<ReportContext | null>(null);

export function useReportContext(): ReportContext {
  const context = useContext(Context);
  if (!context) {
    throw new Error("A <Figure> must be inside a <ReportPage>.");
  }
  return context;
}

/** A named filter the page puts in the URL and passes to every figure. */
export interface ReportFilter {
  /** Query parameter name, e.g. `version`. Used verbatim as the URL key and the bind name. */
  name: string;
  label: string;
  /** Fixed choices. Omit for a free-text box. */
  options?: string[];
  /** Value used when the URL says nothing. */
  fallback?: string;
  /** True when the query binds a list rather than a scalar. */
  multi?: boolean;
}

export interface ReportPageProps {
  path: string;
  title: string;
  lede?: string;
  filters?: ReportFilter[];
  children: React.ReactNode;
}

/**
 * The frame every report page uses.
 *
 * <p>Owns three things so that a page does not have to: the URL-backed filters, the shared time
 * window, and the query catalogue that the drill resolver needs. Everything else on a page is
 * ordinary JSX the reader can edit.
 *
 * <p>The time window binds to `timeFrom`/`timeTo`, which is what the generated queries declare
 * for Grafana's `$__timeFrom()`/`$__timeTo()` macros — so one range control governs every figure
 * on the page rather than each carrying its own.
 */
export function ReportPage({ path, title, lede, filters = [], children }: ReportPageProps) {
  const [search, setSearch] = useSearchParams();
  const [queries, setQueries] = useState<Record<string, QuerySummary>>({});

  useEffect(() => {
    let live = true;
    listQueries()
      .then((all) => {
        if (!live) return;
        setQueries(Object.fromEntries(all.map((q) => [q.id, q])));
      })
      // The catalogue only supplies drill metadata. Losing it costs the resolver its first tier,
      // not the page - so it is not worth an error screen over the numbers.
      .catch(() => undefined);
    return () => { live = false; };
  }, []);

  useEffect(() => {
    rememberTitle(path, title);
    rememberChips(path, Object.fromEntries(filters.map((f) => [f.name, f.label])));
  }, [path, title, filters]);

  const window = useTimeWindow({
    range: search.get("range") ?? "30d",
    from: search.get("from") ?? "",
    to: search.get("to") ?? "",
  });

  const apply = useCallback(
    (patch: Record<string, string | string[] | null>, replace: boolean) => {
      const next = new URLSearchParams(search);
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, Array.isArray(value) ? value.join(",") : value);
      }
      setSearch(next, { replace });
    },
    [search, setSearch],
  );

  const params = useMemo(() => {
    const out: Record<string, unknown> = {
      timeFrom: window.timeFrom,
      timeTo: window.timeTo,
    };
    for (const filter of filters) {
      const raw = search.get(filter.name) ?? filter.fallback ?? null;
      if (raw === null || raw === "") {
        out[filter.name] = null;
      } else if (filter.multi) {
        out[filter.name] = raw.split(",").filter(Boolean);
      } else {
        out[filter.name] = raw;
      }
    }
    return out;
  }, [window, filters, search]);

  const context = useMemo(() => ({ params, queries, apply }), [params, queries, apply]);

  return (
    <Context.Provider value={context}>
      <div className="flex flex-col gap-4">
        <header className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold">{title}</h1>
          {lede ? <p className="max-w-3xl text-sm text-ink-muted">{lede}</p> : null}
        </header>

        {filters.length > 0 ? (
          <div className="flex flex-wrap items-end gap-2">
            {filters.map((filter) => (
              <FilterControl
                key={filter.name}
                filter={filter}
                value={search.get(filter.name) ?? filter.fallback ?? ""}
                onChange={(value) => apply({ [filter.name]: value || null }, true)}
              />
            ))}
          </div>
        ) : null}

        {children}
      </div>
    </Context.Provider>
  );
}

function FilterControl({
  filter, value, onChange,
}: {
  filter: ReportFilter;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = `filter-${filter.name}`;
  return (
    <label className="flex flex-col gap-0.5 text-[11px] text-ink-muted" htmlFor={id}>
      {filter.label}
      {filter.options ? (
        <select
          id={id}
          className="rounded border border-line bg-surface-strong px-2 py-1 text-xs text-ink"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">All</option>
          {filter.options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          className="rounded border border-line bg-surface-strong px-2 py-1 text-xs text-ink"
          value={value}
          placeholder={filter.multi ? "comma separated" : ""}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}

/** A titled group of figures. Twelve-column grid; each figure declares its own span. */
export function ReportSection({
  title, lede, children,
}: {
  title: string;
  lede?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <header>
        <h2 className="text-sm font-semibold">{title}</h2>
        {lede ? <p className="mt-0.5 max-w-3xl text-xs text-ink-muted">{lede}</p> : null}
      </header>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">{children}</div>
    </section>
  );
}
