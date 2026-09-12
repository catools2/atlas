/**
 * Reads from Métis, the reasoning plane, through the gateway's `/metis` route.
 *
 * **Reads only, and that is a rule rather than a gap.** Métis gates its decisions on an identity
 * that must appear in the audit record, and everything forwarded from the gateway carries one
 * service token - so an approval taken from this app would be recorded as `gateway-service` for
 * every approver, which destroys the audit trail and the rule that a proposer may not approve
 * their own work. The gateway enforces it with a GET-only allowlist; this module has no verb that
 * could reach a decision route even if the route were open. People decide in Métis's own review
 * UI, with their own credential, on a page that runs no script.
 */

import { challengeOf, SESSION_ENDED, signIn } from "../api/session";

const METIS_ROOT = "/metis";

/**
 * Where a person goes to actually take a decision. `metis api` and `metis ui` are two processes:
 * this app reads the first and can only ever link to the second.
 */
export const REVIEW_UI =
  (import.meta.env?.VITE_METIS_REVIEW_UI as string | undefined) ?? "http://127.0.0.1:8731";

export class MetisError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "MetisError";
    this.status = status;
  }
}

/**
 * The two answers a Métis read can give, kept apart.
 *
 * `answer` is "I looked". `unavailable` is "I could not look" - a 204, which the API returns when
 * the graph is unreachable or unconfigured, with its reason in a header because a 204 may not
 * carry a body. Collapsing them is the specific failure the API's 204/200 split exists to
 * prevent: an unreachable database and an empty graph would otherwise both render as an empty
 * screen, and only one of them is an answer about the system.
 */
export type MetisRead<T> =
  | { kind: "answer"; data: T }
  | { kind: "unavailable"; reason: string };

const NO_REASON =
  "Métis could not answer this read. Its graph is unreachable or not configured.";

export async function read<T>(path: string, signal?: AbortSignal): Promise<MetisRead<T>> {
  const response = await fetch(`${METIS_ROOT}${path}`, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (response.status === 204) {
    return { kind: "unavailable", reason: response.headers.get("X-Metis-Reason") || NO_REASON };
  }

  if (response.status === 401 || response.status === 403) {
    // Two different 401s arrive on this path and the repair is different for each. The gateway
    // challenges with `Session` when the READER is not signed in; Métis challenges with `Bearer`
    // when the SERVICE TOKEN was refused, and telling a reader to sign in for that one sends them
    // round a loop that cannot terminate.
    const challenge = challengeOf(response);
    if (challenge.kind === "session") {
      signIn(challenge.login);
      throw new MetisError(SESSION_ENDED, response.status);
    }
    throw new MetisError(
      "The gateway's Métis credential was refused. Check METIS_API_TOKEN where the gateway runs.",
      response.status);
  }

  if (response.status === 404 || response.status === 405) {
    throw new MetisError(
      "The gateway has no route for this read. Only GETs on /metis/** are forwarded.",
      response.status);
  }

  if (!response.ok) {
    throw new MetisError(`Métis answered ${response.status}.`, response.status);
  }

  return { kind: "answer", data: (await response.json()) as T };
}

/** True for the DOMException fetch raises when a request is aborted, which is never an error. */
export function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function isTimeout(error: unknown): boolean {
  return error instanceof DOMException && error.name === "TimeoutError";
}

// ---------------------------------------------------------------------------
// The shapes these pages read. Only the fields drawn are named; Métis prunes
// null, empty and false from its payloads, so every one of these is optional
// and an absent field is never the same as a zero.
// ---------------------------------------------------------------------------

export interface Journey {
  journey: string;
  surface: string;
}

export interface JourneyList {
  journeys?: Journey[];
}

export interface QueueEntry {
  run_id: string;
  workflow: string;
  scope: string;
  blocked_on: string;
  waiting_since?: string;
  outstanding?: string[];
  detail?: string;
  next_command?: string;
}

export interface Queue {
  waiting?: QueueEntry[];
  total?: number;
  by_workflow?: Record<string, number>;
  means?: string;
}

export interface ModelState {
  id: string;
  name: string;
  is_initial?: boolean;
  lifecycle_state?: string;
}

export interface ModelTransition {
  id: string;
  source?: string;
  trigger?: string;
  target?: string;
  guard?: string;
  outcome_status?: string;
  lifecycle_state?: string;
  source_state_unresolved?: boolean;
}

export interface Model {
  model_id?: string;
  states?: ModelState[];
  transitions?: ModelTransition[];
  skipped?: { id: string; reason: string }[];
}

export interface Unmeasured {
  figure: string;
  kind: string;
  cause?: string;
  reason?: string;
}

export interface CoverageReport {
  model_id?: string;
  criterion?: string;
  component?: string;
  version?: string;
  commit?: string;
  coverage?: {
    covered?: number;
    uncovered?: number;
    uncovered_detail?: { transition_id: string; reason: string }[];
  };
  validation?: {
    checked?: number;
    blocking?: number;
    unverifiable?: number;
    advisory?: number;
    generation?: string;
  };
  /** A list when something could not be measured, and a sentence when everything could. */
  unmeasured?: Unmeasured[] | string;
  confidence_capped_by?: string;
  means?: string;
}
