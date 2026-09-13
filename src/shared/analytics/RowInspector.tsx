import { labelFor } from "./drill";

/**
 * The row the reader clicked, as a labelled list.
 *
 * <p>This is the floor under "every mark is clickable". A chart over an aggregate may carry no
 * key the app has a page for and no column that binds a parameter — and the honest response to
 * that is not a dead click, it is showing the reader what they just clicked on.
 *
 * <p>Deliberately plain. It is a fallback, and dressing it up would invite pages to reach for it
 * instead of defining a real drill.
 */
export function RowInspector({ row }: { row: Record<string, unknown> }) {
  const entries = Object.entries(row).filter(([, value]) => value !== null && value !== undefined);

  if (entries.length === 0) {
    return <p className="muted">This mark carries no underlying row.</p>;
  }

  return (
    <dl className="row-inspector">
      {entries.map(([column, value]) => (
        <div key={column} className="row-inspector__entry">
          <dt>{labelFor(column)}</dt>
          <dd>{format(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function format(value: unknown): string {
  if (typeof value === "number") return value.toLocaleString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
