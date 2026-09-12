import { Loader2, RotateCw, Unplug } from "lucide-react";
import type { MetisState } from "./useMetisRead";

/**
 * The five states a Métis panel can be in, told apart.
 *
 * One more than the analytics panels have, and it is the one that matters: **`unavailable` is
 * Métis saying it could not look.** The API spends a 204 and a header to keep that distinct from
 * an empty answer, and a page that rendered both as "nothing here" would spend it for nothing -
 * an unreachable graph would read as a system with no work waiting in it.
 */
export function MetisBoundary<T>({
  state, children, empty = "Nothing to show.", className = "",
}: {
  state: MetisState<T>;
  children: (answer: T) => React.ReactNode;
  empty?: string;
  className?: string;
}) {
  if (state.error) {
    return (
      <Centered className={className}>
        <div className="px-4 text-center">
          <p className="text-xs text-state-danger">{state.error}</p>
          <button
            type="button"
            onClick={state.retry}
            className="mt-2 inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-[11px] text-ink-muted transition hover:border-line-strong hover:text-ink"
          >
            <RotateCw className="h-3 w-3" aria-hidden="true" />
            Try again
          </button>
        </div>
      </Centered>
    );
  }

  if (state.unavailable) {
    return (
      <Centered className={className}>
        <div className="px-4 text-center">
          <p className="flex items-center justify-center gap-1.5 text-xs text-state-warning">
            <Unplug className="h-3 w-3" aria-hidden="true" />
            Métis could not answer this read.
          </p>
          {/* The reason is the operator's repair instruction and travels verbatim - Métis writes
              it for a person and names the specific thing that is missing. */}
          <p className="mt-1 text-[11px] text-ink-muted">{state.unavailable}</p>
          <button
            type="button"
            onClick={state.retry}
            className="mt-2 inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-[11px] text-ink-muted transition hover:border-line-strong hover:text-ink"
          >
            <RotateCw className="h-3 w-3" aria-hidden="true" />
            Try again
          </button>
        </div>
      </Centered>
    );
  }

  if (!state.answer) {
    return state.loading ? (
      <Centered className={className}>
        <p className="flex items-center gap-1.5 text-xs text-ink-muted">
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
          Loading…
        </p>
      </Centered>
    ) : (
      <Centered className={className}>
        <p className="text-xs text-ink-muted">{empty}</p>
      </Centered>
    );
  }

  return (
    <div className={`${state.loading ? "opacity-60 transition-opacity" : ""} ${className}`}
         aria-busy={state.loading || undefined}>
      {children(state.answer)}
    </div>
  );
}

function Centered({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex min-h-[120px] items-center justify-center ${className}`}
         role="status" aria-live="polite">
      {children}
    </div>
  );
}
