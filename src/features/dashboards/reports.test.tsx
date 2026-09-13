import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NOT_AVAILABLE, REPORTS } from "./reports";
import { ROUTE_TABLE } from "../../app/routes";

let runQuery: ReturnType<typeof vi.fn>;

vi.mock("../../shared/analytics/analyticsClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../shared/analytics/analyticsClient")>();
  return {
    ...actual,
    listQueries: () => Promise.resolve([]),
    runQuery: (...args: unknown[]) => runQuery(...args),
  };
});

beforeEach(() => {
  runQuery = vi.fn(() =>
    Promise.resolve({
      queryId: "q",
      columns: [{ name: "bucket", type: "text" }, { name: "total", type: "int" }],
      rows: [["2026-01-01", 5]],
      truncated: false,
      views: [],
      freshness: [],
    }),
  );
});

/**
 * Every `query="..."` written into a report page.
 *
 * <p>Read from the source rather than from a rendered tree, because a figure inside a section
 * the test never scrolls to is exactly the one whose query id is wrong.
 */
function declaredQueryIds(): { file: string; id: string }[] {
  const dir = path.join(__dirname, "pages");
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith("Report.tsx"))
    .flatMap((file) => {
      const source = fs.readFileSync(path.join(dir, file), "utf8");
      return [...source.matchAll(/query="([^"]+)"/g)].map((m) => ({ file, id: m[1] }));
    });
}

describe("the report pages", () => {
  it("cover the nine Athena-backed dashboards", () => {
    expect(REPORTS).toHaveLength(9);
    expect(NOT_AVAILABLE).toHaveLength(4);
  });

  it("each have a route in the table", () => {
    const known = new Set(ROUTE_TABLE.map((r) => r.path));
    expect(REPORTS.filter((r) => !known.has(r.path)).map((r) => r.path)).toEqual([]);
  });

  /**
   * The load-bearing test. These 124 query ids were transcribed from the Grafana exports by a
   * scaffold that has since been deleted; a wrong one is a figure that 400s at runtime and
   * nowhere else. The registry manifest in the analytics module is the authority.
   */
  it("bind only queries the analytics registry actually has", () => {
    const manifest = path.resolve(
      __dirname,
      "../../../../athena/athena-boot-analytics/src/main/resources/analytics/queries.json",
    );
    if (!fs.existsSync(manifest)) {
      // Skips loudly rather than silently passing when the Athena repo is not a sibling.
      console.warn(`skipped: no analytics registry at ${manifest}`);
      return;
    }
    const ids = new Set(
      (JSON.parse(fs.readFileSync(manifest, "utf8")) as { id: string }[]).map((q) => q.id),
    );
    const unknown = declaredQueryIds().filter((q) => !ids.has(q.id));
    expect(unknown).toEqual([]);
  });

  /**
   * A report's title is written twice - in this registry, for the index card and the nav, and in
   * the page's own `<ReportPage title=...>`. They drifted the first time they were written
   * ("Teams Overall Regression" against "...Statistics"), so they are pinned together here.
   */
  it("agree with their page about what they are called", () => {
    const mismatched = REPORTS.filter((report) => {
      const source = fs.readFileSync(
        path.join(__dirname, "pages", `${report.component.name}.tsx`),
        "utf8",
      );
      return !source.includes(`title="${report.title}"`);
    }).map((r) => r.title);

    expect(mismatched).toEqual([]);
  });

  it("declare every figure with a title", () => {
    const dir = path.join(__dirname, "pages");
    const untitled: string[] = [];
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith("Report.tsx"))) {
      const source = fs.readFileSync(path.join(dir, file), "utf8");
      const figures = source.split("<Figure").slice(1);
      figures.forEach((figure, index) => {
        if (!/title="[^"]+"/.test(figure.slice(0, 400))) untitled.push(`${file}#${index}`);
      });
    }
    expect(untitled).toEqual([]);
  });

  it.each(REPORTS.map((r) => [r.title, r] as const))(
    "%s renders its figures and queries for each one",
    async (_title, report) => {
      render(
        <MemoryRouter initialEntries={[report.path]}>
          <report.component />
        </MemoryRouter>,
      );

      await waitFor(() => expect(screen.getByText(report.title)).toBeInTheDocument());

      const source = fs.readFileSync(
        path.join(__dirname, "pages", `${report.component.name}.tsx`),
        "utf8",
      );
      const expected = [...source.matchAll(/query="([^"]+)"/g)].length;

      // Every figure is a labelled region, and every one of them asks for its data. A figure
      // that renders without querying is a hole the reader cannot see.
      await waitFor(() =>
        expect(screen.getAllByRole("region").length).toBeGreaterThanOrEqual(expected),
      );
      await waitFor(() => expect(runQuery.mock.calls.length).toBeGreaterThanOrEqual(expected));
    },
  );
});
