/**
 * Says when a result was cut short.
 *
 * <p>The analytics service caps a result at 50,000 rows and flags it. A truncated **table**
 * shows its last row and the reader can infer there may be more; a truncated **chart** just
 * draws a shorter line, and looks exactly like a quiet week.
 *
 * <p>So this is not a table footer — it belongs on anything that renders a capped result.
 */
export function TruncationNote({ truncated, rows }: { truncated: boolean; rows: number }) {
  if (!truncated) return null;

  return (
    <p className="px-2 py-1 text-[10px] text-state-warning" role="status">
      Showing the first {rows.toLocaleString()} rows. Narrow the filters to see the rest.
    </p>
  );
}
