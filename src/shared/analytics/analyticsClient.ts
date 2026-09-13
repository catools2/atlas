import { challengeOf, csrfHeaders, SESSION_ENDED, signIn } from "../api/session";
import type { QueryResult, QuerySummary } from "./types";

/**
 * The analytics service, which serves queries and nothing else.
 *
 * <p>It used to also serve dashboard specifications and accept edits to them. Those endpoints are
 * gone, along with the specifications themselves: the console has hand-written report pages under
 * `features/dashboards/pages/`, each naming the queries it needs. That leaves this service with
 * one job — run a query, read-only, and return rows. `runQuery` names one that is already
 * registered; `runSql` sends one built here or by the agent, which the service accepts only if
 * it is a single read-only statement.
 */
const ANALYTICS_ROOT = "/analytics";

export class AnalyticsError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AnalyticsError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${ANALYTICS_ROOT}${path}`, {
    ...init,
    headers: { Accept: "application/json", ...(init?.headers ?? {}) },
  });

  if (response.status === 401) {
    // Not a failed query. The gateway owns identity now, so an expired session reaches every
    // panel at once; reporting it as "the analytics service is broken" would send the reader
    // looking for an outage that is not there.
    const challenge = challengeOf(response);
    if (challenge.kind === "session") signIn(challenge.login);
    throw new AnalyticsError(SESSION_ENDED, 401);
  }

  if (!response.ok) {
    // The service answers 400 with {"error": "..."} for anything the caller got wrong;
    // surfacing that beats a generic failure message in a panel.
    let detail = `Request failed with ${response.status}`;
    try {
      const body = await response.json();
      if (body && typeof body.message === "string") detail = body.message;
      else if (body && typeof body.error === "string") detail = body.error;
    } catch {
      /* non-JSON error body */
    }
    throw new AnalyticsError(detail, response.status);
  }
  return response.json() as Promise<T>;
}

export const listQueries = () => request<QuerySummary[]>("/queries");

/**
 * `signal` is not optional in practice - a caller that drops the result still holds a browser
 * connection until the server answers, and the browser only opens six per origin. A page with
 * seven panels that navigates away twice can therefore starve the panels that come next.
 */
export const runQuery = (
  queryId: string,
  params: Record<string, unknown>,
  signal?: AbortSignal,
) =>
  request<QueryResult>(`/queries/${encodeURIComponent(queryId)}/run`, {
    method: "POST",
    // A write under a session cookie carries the CSRF token the gateway issued, or it is a 403.
    headers: { "Content-Type": "application/json", ...csrfHeaders() },
    body: JSON.stringify(params),
    signal,
  });

/**
 * Run a caller-built SQL statement - a single read-only `SELECT`/`WITH`, which Athena enforces
 * and rejects anything else. For any console surface that builds its own query rather than
 * naming a registered one; the agent's `run_sql` tool reaches the same endpoint.
 */
export const runSql = (
  sql: string,
  params: Record<string, unknown> = {},
  signal?: AbortSignal,
) =>
  request<QueryResult>("/queries/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...csrfHeaders() },
    body: JSON.stringify({ sql, params }),
    signal,
  });

/** True for the DOMException fetch raises when a request is aborted, which is never an error. */
export function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

/**
 * True for an abort the caller raised as a deadline rather than as cleanup. The two arrive
 * through the same channel and mean opposite things - one is "never mind", the other is "the
 * service is not answering" - so they are told apart by the reason's name.
 */
export function isTimeout(error: unknown): boolean {
  return error instanceof DOMException && error.name === "TimeoutError";
}

/** Column-oriented view of a result, which is what the chart components want. */
export function toRecords(result: QueryResult): Record<string, unknown>[] {
  return result.rows.map((row) => {
    const record: Record<string, unknown> = {};
    result.columns.forEach((column, index) => {
      record[column.name] = row[index];
    });
    return record;
  });
}
