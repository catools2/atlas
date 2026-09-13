/**
 * The browser's half of the gateway's session contract.
 *
 * The gateway owns identity: the browser holds a session cookie and never a token. Two
 * consequences land here, and both used to be somebody else's problem because nothing in front of
 * this app authenticated anyone.
 *
 * 1. **A cookie-authenticated write needs a CSRF token.** Spring Security issues one in a
 *    readable `XSRF-TOKEN` cookie and expects it echoed in a header; without that every POST this
 *    app makes is a 403.
 * 2. **A 401 now has two meanings.** The gateway answers `WWW-Authenticate: Session …` when the
 *    reader's session has ended — the reader signs in again and the app works. Métis answers
 *    `WWW-Authenticate: Bearer` when the one service token the gateway holds was refused — an
 *    in for the second one sends them round a loop that cannot terminate.
 */

const CSRF_COOKIE = "XSRF-TOKEN";
const CSRF_HEADER = "X-XSRF-TOKEN";

export function readCookie(name: string): string | null {
  // `document` is absent under SSR and in a worker; a missing cookie and no document are the
  // same answer here - there is no token to send.
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** Spread into a write's headers. Empty when there is no cookie, which the gateway answers 403. */
export function csrfHeaders(): Record<string, string> {
  const token = readCookie(CSRF_COOKIE);
  return token ? { [CSRF_HEADER]: token } : {};
}

export type Challenge =
  /** The reader's session ended. `login` is the gateway's own sign-in path, from the challenge. */
  | { kind: "session"; login: string }
  /** Métis refused the gateway's service token. Nothing the reader can do. */
  | { kind: "unknown" };

/** What a 401 is actually saying. */
export function challengeOf(response: Response): Challenge {
  const header = response.headers.get("WWW-Authenticate") ?? "";
  const scheme = header.split(/[\s,]/, 1)[0].toLowerCase();
  if (scheme === "session") {
    const login = /login="([^"]+)"/.exec(header)?.[1];
    return { kind: "session", login: login ?? DEFAULT_LOGIN };
  }
  return { kind: "unknown" };
}

/** Where to go when the challenge does not say. Matches the gateway's registration id. */
const DEFAULT_LOGIN = "/oauth2/authorization/athena";

export const SESSION_ENDED =
  "Your session has ended. Signing you in again…";

let signingIn = false;

/**
 * Send the browser to the gateway's sign-in, once.
 *
 * A page holds several panels and they fail together, so the guard matters: without it the first
 * expired-session response starts a navigation and the other six start it again, and the reader
 * watches the address bar flicker. Returns whether it navigated, so a caller can still surface a
 * message when navigation is unavailable — which is every test environment.
 */
export function signIn(login: string = DEFAULT_LOGIN): boolean {
  if (signingIn) return true;
  if (typeof window === "undefined" || typeof window.location?.assign !== "function") return false;
  signingIn = true;
  // `assign`, not `replace`: the page the reader was on stays in history, so coming back from
  // the identity provider lands them where they were rather than at the app's root.
  window.location.assign(login);
  return true;
}

/** Test seam. Nothing in the app calls this; a test that navigated once must be able to again. */
export function resetSignIn(): void {
  signingIn = false;
}
