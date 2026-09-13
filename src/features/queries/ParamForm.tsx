import type { ParamSpec } from "../../shared/analytics/types";

/**
 * A form built from a query's declared parameters.
 *
 * <p>The registry already says what each query takes and what kind it is, so the form is
 * generated rather than written — 137 queries, and nobody is hand-authoring 137 forms.
 *
 * <p>The `operator` kind is the one that matters. It is the single place where text is
 * substituted into SQL rather than bound, which is exactly why the server enumerates the
 * values it will accept — and why this renders a closed `<select>` and never a text box.
 */
export function ParamForm({
  params, values, onChange,
}: {
  params: ParamSpec[];
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
}) {
  if (params.length === 0) {
    return <p className="text-xs text-ink-muted">This query takes no parameters.</p>;
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      {params.map((param) => (
        <label key={param.name} className="flex flex-col gap-1 text-xs">
          <span className="text-ink-muted">
            {param.name}
            <span className="ml-1 text-ink-muted/60">({param.kind})</span>
          </span>
          <Field
            param={param}
            value={values[param.name] ?? ""}
            onChange={(value) => onChange(param.name, value)}
          />
        </label>
      ))}
    </div>
  );
}

function Field({
  param, value, onChange,
}: {
  param: ParamSpec;
  value: string;
  onChange: (value: string) => void;
}) {
  const className =
    "rounded border border-line bg-surface-strong px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-accent";

  switch (param.kind) {
    case "operator":
      // Closed by construction: the only values here are the ones the server whitelisted.
      return (
        <select className={className} value={value} onChange={(e) => onChange(e.target.value)}>
          {param.allowed.map((allowed) => (
            <option key={allowed} value={allowed}>{allowed}</option>
          ))}
        </select>
      );

    case "instant":
      return (
        <input
          type="datetime-local"
          className={className}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "list":
      return (
        <input
          className={`${className} w-56`}
          value={value}
          // An empty list means "do not filter" rather than "match nothing" - the registry
          // translates Grafana's All sentinel to cardinality(:x) = 0 for exactly this.
          placeholder="comma,separated — empty means all"
          onChange={(e) => onChange(e.target.value)}
        />
      );

    default:
      return (
        <input
          className={`${className} w-44`}
          value={value}
          placeholder="empty means all"
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

/** Form values as the API expects them: lists split, blanks dropped to null. */
export function toRequest(
  params: ParamSpec[],
  values: Record<string, string>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const param of params) {
    const raw = (values[param.name] ?? "").trim();
    if (param.kind === "list") {
      out[param.name] = raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : [];
    } else if (param.kind === "operator") {
      // Never blank: a missing operator would leave a {{slot}} unfilled in the SQL.
      out[param.name] = raw || param.allowed[0];
    } else {
      out[param.name] = raw || null;
    }
  }
  return out;
}
