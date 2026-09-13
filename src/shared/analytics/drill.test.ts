import { describe, expect, it } from "vitest";

import { fromCell, fromChart, fromMark, fromRow, payloadOf } from "./chartClick";
import { ROW_INSPECTOR, defaultResolver, describeDatum, labelFor } from "./drill";
import type { Datum } from "./drill";
import { entityIn } from "./entityKeys";
import type { QuerySummary } from "./types";

const source: Datum["source"] = { kind: "chart", queryId: "q1" };

function query(params: { name: string; kind: string }[]): QuerySummary {
  return {
    id: "q1",
    title: "A query",
    views: [],
    tables: [],
    params: params.map((p) => ({ ...p, allowed: [] })) as QuerySummary["params"],
  };
}

describe("the resolver's tiers", () => {
  it("tier 1: a row naming an entity goes to that entity's page", () => {
    const action = defaultResolver(null)({
      source,
      row: { cycle_code: "REG-42", pass: 10 },
    });

    expect(action.kind).toBe("navigate");
    expect(action).toMatchObject({ to: "/test-cycles?cycle=REG-42" });
  });

  it("tier 1: the most specific entity wins when a row names several", () => {
    // A row carrying both must not drill to the coarser one; the reader clicked the execution.
    const action = defaultResolver(null)({
      source,
      row: { cycle_code: "REG-42", execution_id: "991" },
    });

    expect(action).toMatchObject({ to: "/quality/executions/991" });
  });

  it("tier 1: values are URL-encoded, so a slash in a key cannot forge a path", () => {
    const action = defaultResolver(null)({ source, row: { repository: "group/sub/repo" } });

    expect(action).toMatchObject({ to: "/git/repositories?repository=group%2Fsub%2Frepo" });
  });

  it("tier 2: a column binding the panel's own query reopens it, narrowed", () => {
    const action = defaultResolver(query([{ name: "team", kind: "scalar" }]))({
      source,
      row: { team: "payments", total: 3 },
    });

    expect(action).toMatchObject({ kind: "dialog", drill: "team", drillValue: "payments" });
  });

  it("tier 2: an operator parameter is never bound from a row", () => {
    // Operators are substituted into SQL from a closed whitelist; a row value must never
    // reach that slot.
    const action = defaultResolver(query([{ name: "cycle_type", kind: "operator" }]))({
      source,
      row: { cycle_type: "LIKE'; DROP TABLE x; --" },
    });

    expect(action).toMatchObject({ drill: ROW_INSPECTOR });
  });

  it("tier 3: a row with neither falls back to showing the row itself", () => {
    const action = defaultResolver(null)({
      source,
      row: { bucket: "2026-01-01", automated: 12 },
      category: "2026-01-01",
    });

    expect(action).toMatchObject({ kind: "dialog", drill: ROW_INSPECTOR });
  });
});

describe("the no-dead-click invariant", () => {
  const resolver = defaultResolver(null);

  it.each([
    ["an entity row", { item_key: "TS-T1" }],
    ["an aggregate row", { bucket: "2026-01-01", total: 4 }],
    ["a single-column row", { anything: 1 }],
    ["a row of nulls", { a: null, b: null }],
    ["an empty row", {}],
  ])("%s still resolves to something actionable", (_name, row) => {
    // If any input can reach `none`, "every chart and table is clickable" is not true, and
    // the requirement quietly becomes "most of them are".
    const action = resolver({ source, row: row as Record<string, unknown> });

    expect(action.kind).not.toBe("none");
  });

  it("holds for every column name in isolation", () => {
    for (const column of ["cycle_code", "item_key", "spec_id", "unknown_column"]) {
      expect(resolver({ source, row: { [column]: "v" } }).kind).not.toBe("none");
    }
  });
});

describe("normalising what the chart library hands back", () => {
  it("unwraps a bar segment, which nests the row twice", () => {
    expect(payloadOf({ payload: { payload: { cycle_code: "REG-1" } } })).toEqual({
      cycle_code: "REG-1",
    });
  });

  it("unwraps a single-wrapped mark", () => {
    expect(payloadOf({ payload: { cycle_code: "REG-1" } })).toEqual({ cycle_code: "REG-1" });
  });

  it("accepts a bare row", () => {
    expect(payloadOf({ cycle_code: "REG-1" })).toEqual({ cycle_code: "REG-1" });
  });

  it("survives nothing at all", () => {
    expect(payloadOf(undefined)).toEqual({});
    expect(payloadOf(null)).toEqual({});
  });

  it("carries the clicked series through from a mark", () => {
    const datum = fromMark({ payload: { fail: 3 } }, source, "fail");

    expect(datum.seriesKey).toBe("fail");
  });

  it("claims no series for a chart-level click", () => {
    // The reader clicked an x position, not a series. Naming one would silently pick
    // whichever series Recharts happened to list first.
    const datum = fromChart(
      { activeLabel: "2026-01-01", activePayload: [{ dataKey: "pass", payload: { pass: 1 } }] },
      source,
    );

    expect(datum!.seriesKey).toBeUndefined();
    expect(datum!.category).toBe("2026-01-01");
  });

  it("returns nothing for a click on empty chart space", () => {
    expect(fromChart({ activePayload: [] }, source)).toBeNull();
    expect(fromChart(null, source)).toBeNull();
  });

  it("names the column for a cell click, so a wide row does not have to be guessed at", () => {
    const datum = fromCell({ cycle_code: "REG-1", executor: "sam" }, "executor", {
      kind: "table",
    });

    expect(datum.seriesKey).toBe("executor");
    expect(datum.category).toBe("sam");
  });

  it("takes the whole row for a row click", () => {
    expect(fromRow({ a: "x" }, { kind: "table" }).row).toEqual({ a: "x" });
  });
});

describe("naming things for the reader", () => {
  it("turns a column name into a label", () => {
    expect(labelFor("execution_status")).toBe("Execution status");
  });

  it("describes a clicked segment as category and series", () => {
    expect(describeDatum({ source, row: {}, category: "Mon", seriesKey: "fail" })).toBe(
      "Mon — Fail",
    );
  });

  it("falls back to something rather than an empty title", () => {
    expect(describeDatum({ source, row: {} })).toBe("Selected row");
  });
});

describe("the entity registry", () => {
  it("ignores empty values rather than linking to nowhere", () => {
    expect(entityIn({ cycle_code: "" })).toBeNull();
    expect(entityIn({ cycle_code: null })).toBeNull();
  });
});
