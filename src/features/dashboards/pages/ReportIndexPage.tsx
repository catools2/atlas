import { Link } from "react-router-dom";

import { NOT_AVAILABLE, REPORTS } from "../reports";

/** Every report the console serves, and the four it cannot. */
export function ReportIndexPage() {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map((report) => (
          <Link key={report.path} to={report.path} className="card p-3">
            <h2 className="text-sm font-medium">{report.title}</h2>
            <p className="mt-1 text-xs text-ink-muted">{report.blurb}</p>
          </Link>
        ))}
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Not available here</h2>
        <p className="max-w-3xl text-xs text-ink-muted">
          These four Grafana dashboards read InfluxDB and Prometheus rather than the Athena
          warehouse, so none of their figures has a query this console can run. They are listed
          rather than omitted: a gap you can see is better than one you cannot.
        </p>
        <ul className="flex flex-wrap gap-2">
          {NOT_AVAILABLE.map((item) => (
            <li
              key={item.title}
              className="rounded border border-line px-2 py-1 text-xs text-ink-muted"
            >
              {item.title} <span className="opacity-60">· {item.reason}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
