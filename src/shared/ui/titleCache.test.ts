import { beforeEach, describe, expect, it, vi } from "vitest";

import { describe as describeRoute } from "./navigation";
import { rememberChips, rememberTitle, resetTitles, subscribe } from "./titleCache";

describe("a detail crumb", () => {
  beforeEach(() => resetTitles());

  it("shows the id before the page knows anything", () => {
    // Never blank, never wrong - just briefly less specific than it will be.
    expect(describeRoute("/apis/specs/4821", "")!.crumbs[1].label).toBe("4821");
  });

  it("upgrades to the record's name once the page publishes it", () => {
    rememberTitle("/apis/specs/4821", "Payments v3");

    expect(describeRoute("/apis/specs/4821", "")!.crumbs[1].label).toBe("Payments v3");
  });

  it("keeps each path's title to itself", () => {
    rememberTitle("/apis/specs/4821", "Payments v3");

    expect(describeRoute("/apis/specs/9999", "")!.crumbs[1].label).toBe("9999");
  });

  it("ignores an empty title rather than blanking the crumb", () => {
    rememberTitle("/apis/specs/4821", "");
    rememberTitle("/apis/specs/4821", null);

    expect(describeRoute("/apis/specs/4821", "")!.crumbs[1].label).toBe("4821");
  });
});

describe("subscribers", () => {
  beforeEach(() => resetTitles());

  it("are told when a title lands, so the bar repaints", () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);

    rememberTitle("/apis/specs/1", "One");

    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });

  it("are not told when nothing changed", () => {
    rememberTitle("/apis/specs/1", "One");
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);

    // A page re-rendering with the same data must not repaint the bar on every render.
    rememberTitle("/apis/specs/1", "One");

    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });
});

describe("chip labels a route cannot name statically", () => {
  beforeEach(() => resetTitles());

  it("are used once the page publishes them", () => {
    rememberChips("/test-cycles", { team: "Squad" });

    const view = describeRoute("/test-cycles", "?team=payments");

    expect(view!.chips.find((c) => c.key === "team")!.label).toBe("Squad");
  });
});
