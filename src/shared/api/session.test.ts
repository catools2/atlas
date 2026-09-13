import { afterEach, describe, expect, it, vi } from "vitest";
import {challengeOf, csrfHeaders, resetSignIn, signIn } from "./session";

afterEach(() => {
  document.cookie = "XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  resetSignIn();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/** A location whose navigation can be observed. jsdom will not actually navigate. */
function watchNavigation() {
  const assign = vi.fn();
  vi.stubGlobal("location", { assign, href: "http://localhost/ui/", origin: "http://localhost" });
  return assign;
}


describe("the CSRF token", () => {
  it("is echoed from the cookie the gateway issued", () => {
    document.cookie = "XSRF-TOKEN=abc-123";
    expect(csrfHeaders()).toEqual({ "X-XSRF-TOKEN": "abc-123" });
  });

  it("is absent rather than empty when there is no cookie", () => {
    // An empty header value would be a token the gateway rejects, which is a 403 that looks like
    // a permission problem instead of a missing cookie.
    expect(csrfHeaders()).toEqual({});
  });
});

describe("reading a 401's challenge", () => {
  it("names the gateway's session and the door out of it", () => {
    const response = new Response(null, {
      status: 401,
      headers: { "WWW-Authenticate": 'Session realm="athena", login="/oauth2/authorization/athena"' },
    });
    expect(challengeOf(response)).toEqual({
      kind: "session", login: "/oauth2/authorization/athena",
    });
  });


  it("does not guess when there is no challenge at all", () => {
    expect(challengeOf(new Response(null, { status: 401 }))).toEqual({ kind: "unknown" });
  });
});

describe("signing in again", () => {
  it("navigates once however many panels noticed", () => {
    const assign = watchNavigation();

    signIn("/oauth2/authorization/athena");
    signIn("/oauth2/authorization/athena");
    signIn("/oauth2/authorization/athena");

    // Seven panels fail together when a session ends. Seven navigations is a flickering address
    // bar and, on a slow provider, a race between redirects.
    expect(assign).toHaveBeenCalledTimes(1);
  });
});

