import type { Datum, DrillAction, DrillResolver } from "./drill";

/**
 * The same data as the chart, reachable by keyboard.
 *
 * <p>Recharts draws SVG. Its marks take a mouse click but are not focusable, and making them so
 * means either forking the library or scattering `tabIndex` into internals that change between
 * versions. So the chart keeps the mouse and this keeps everything else: a visually hidden list
 * of the same rows, each a real `<button>` wired to the same resolver.
 *
 * <p>It is three things for the price of one — the keyboard route, the screen-reader rendering of
 * a chart that is otherwise an opaque image, and a hedge against Recharts changing its payload
 * shape, since these buttons never touch it.
 *
 * <p>Hidden with `.visually-hidden` rather than `display: none`, which would take it out of the
 * accessibility tree and the tab order along with it — the entire point.
 */
export function ChartKeyboardLayer({
  rows,
  resolver,
  onDrill,
  label,
  describeRow,
}: {
  rows: Record<string, unknown>[];
  resolver: DrillResolver;
  onDrill: (datum: Datum) => DrillAction;
  /** What the chart shows, e.g. "Executions by day". */
  label: string;
  /** How to name one row, so the announcement is the datum and not the JSON. */
  describeRow: (row: Record<string, unknown>) => string;
}) {
  if (rows.length === 0) return null;

  return (
    <ul className="visually-hidden" aria-label={`${label} — data points`}>
      {rows.map((row, index) => {
        const datum: Datum = { source: { kind: "chart" }, row };
        const action = resolver(datum);
        const inert = action.kind === "none";

        return (
          <li key={index}>
            <button
              type="button"
              disabled={inert}
              // Says what will happen, not just what the value is - a screen reader user
              // deserves the same affordance a hover tooltip gives everyone else.
              aria-label={
                inert
                  ? `${describeRow(row)}. ${action.reason}`
                  : `${describeRow(row)}. ${actionLabel(action)}`
              }
              onClick={() => onDrill(datum)}
            >
              {describeRow(row)}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function actionLabel(action: DrillAction): string {
  switch (action.kind) {
    case "navigate":
      return action.label;
    case "drill":
      return action.label;
    case "dialog":
      return `Opens ${action.title}`;
    case "filter":
      return "Narrows the current view";
    case "none":
      return action.reason;
  }
}
