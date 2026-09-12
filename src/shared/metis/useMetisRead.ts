import { useCallback, useEffect, useState } from "react";
import { isAbort, isTimeout, read } from "./metisClient";
import type { MetisRead } from "./metisClient";

/**
 * Métis answers its reads out of a graph, and a coverage report joins four of them. 30s is the
 * same ceiling the analytics panels use: past it the service is not answering rather than
 * thinking, and without a ceiling that case renders as a spinner nobody can act on.
 */
const TIMEOUT_MS = 30_000;

export interface MetisState<T> {
  answer: T | null;
  /** Set when Métis answered 204: it could not look, and this says why. */
  unavailable: string | null;
  error: string | null;
  loading: boolean;
  retry: () => void;
}

/**
 * One Métis read, with its lifecycle.
 *
 * The request is aborted on cleanup rather than ignored, for the reason `useQuery` gives: a
 * discarded response still holds one of the browser's six connections per origin until the server
 * answers, and the explorer issues three reads at once.
 */
export function useMetisRead<T>(path: string | null): MetisState<T> {
  const [state, setState] = useState<{
    answer: T | null; unavailable: string | null; error: string | null; loading: boolean;
  }>({ answer: null, unavailable: null, error: null, loading: path !== null });
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    if (path === null) {
      setState({ answer: null, unavailable: null, error: null, loading: false });
      return;
    }

    const controller = new AbortController();
    const expiry = setTimeout(
      () => controller.abort(new DOMException(`No answer in ${TIMEOUT_MS / 1000}s`, "TimeoutError")),
      TIMEOUT_MS);

    setState((current) => ({ ...current, loading: true }));

    read<T>(path, controller.signal)
      .then((result: MetisRead<T>) => {
        if (result.kind === "unavailable") {
          setState({ answer: null, unavailable: result.reason, error: null, loading: false });
          return;
        }
        setState({ answer: result.data, unavailable: null, error: null, loading: false });
      })
      .catch((error: unknown) => {
        if (isTimeout(error) || isTimeout(controller.signal.reason)) {
          setState({
            answer: null, unavailable: null, loading: false,
            error: "Métis did not answer in time. It may be restarting.",
          });
          return;
        }
        // An abort is this hook's own cleanup, not a failure.
        if (isAbort(error) || controller.signal.aborted) return;
        setState({
          answer: null, unavailable: null, loading: false,
          error: (error as Error).message,
        });
      })
      .finally(() => clearTimeout(expiry));

    return () => {
      clearTimeout(expiry);
      controller.abort();
    };
  }, [path, attempt]);

  return { ...state, retry };
}
