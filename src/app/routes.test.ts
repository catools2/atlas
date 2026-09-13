import { matchPath } from "react-router-dom";
import { describe as describeSuite, expect, it } from "vitest";

// ?raw so the test reads the router's actual source rather than a copy of it.
import appSource from "./App.jsx?raw";
import { describe as describeRoute } from "../shared/ui/navigation";
import { ROUTE_TABLE, samplePath } from "./routes";

/**
 * The guard behind "every page has a breadcrumb".
 *
 * <p>A one-time sweep is true on the day it is done. This makes adding a route without
 * registering it a build failure, which is the only version of the rule that survives contact
 * with a hurried change.
 */
describeSuite("every route", () => {
  it.each(ROUTE_TABLE.map((entry) => [entry.path, samplePath(entry)]))(
    "%s renders a breadcrumb trail",
    (path, sample) => {
      const view = describeRoute(sample, "");

      expect(view, `${path} is not registered in navigation.ts ROUTES`).not.toBeNull();
      expect(view!.crumbs.length, `${path} produced an empty trail`).toBeGreaterThan(0);
      expect(view!.crumbs.every((c) => c.label.trim().length > 0)).toBe(true);
    },
  );

  it.each(ROUTE_TABLE.map((entry) => [entry.path, samplePath(entry)]))(
    "%s has a non-empty title",
    (_path, sample) => {
      expect(describeRoute(sample, "")!.title.trim()).not.toBe("");
    },
  );
});

describeSuite("nested routes", () => {
  it("carry a clickable trail back to their parent", () => {
    const view = describeRoute("/apis/specs/4821", "")!;

    expect(view.crumbs.map((c) => c.label)).toEqual(["API specs", "4821"]);
    expect(view.crumbs[0].to).toBe("/apis/specs");
    // The last crumb is where we already are, so it is not a link.
    expect(view.crumbs[view.crumbs.length - 1].to).toBeUndefined();
  });

  it("name the record rather than the route when they can", () => {
    // Cold, with nothing published yet: the id is always available, so a crumb is never blank.
    expect(describeRoute("/quality/executions/99", "")!.crumbs[1].label).toBe("99");
  });

  it("turn a report slug into something readable", () => {
    const view = describeRoute("/reports/delivery-quality", "")!;

    expect(view.crumbs.map((c) => c.label)).toEqual(["Reports", "Delivery quality"]);
  });
});

describeSuite("an unregistered path", () => {
  it("is reported as unknown rather than guessed at", () => {
    expect(describeRoute("/nope", "")).toBeNull();
  });
});

describeSuite("the route table and the router", () => {
  /** Paths as the router actually declares them, normalised to leading-slash form. */
  function routerPaths(): string[] {
    return [...String(appSource).matchAll(/path="([^"]+)"/g)]
      .map((m) => m[1])
      .filter((p) => p !== "*")
      .map((p) => (p.startsWith("/") ? p : `/${p}`));
  }

  it("every route the router serves resolves to a registered spec", () => {
    // Coverage, not equality: `/reports/:report` legitimately answers for six literal report
    // routes, and duplicating them here is exactly how the two lists drift apart.
    const unregistered = routerPaths().filter((p) => describeRoute(p, "") === null);

    expect(unregistered, "routes with no breadcrumb spec").toEqual([]);
  });

  it("the table claims no route the router does not serve", () => {
    // Also coverage, in the other direction: `/reports/:report` is not declared verbatim by
    // the router, but it answers for six paths that are. What must not happen is an entry
    // that matches nothing at all - a breadcrumb for a page you cannot reach.
    const router = [...routerPaths(), "/"];
    const fictional = ROUTE_TABLE.map((entry) => entry.path).filter(
      (path) => !router.some((served) => served === path || matchPath({ path, end: true }, served)),
    );

    expect(fictional, "ROUTE_TABLE entries the router no longer declares").toEqual([]);
  });
});
