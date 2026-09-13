import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DataTable } from "../../features/qa/components/DataTable";
import { ChartKeyboardLayer } from "./ChartKeyboardLayer";
import { RowInspector } from "./RowInspector";
import { defaultResolver } from "./drill";
import type { QueryResult } from "./types";

function result(columns: string[], rows: unknown[][]): QueryResult {
  return {
    queryId: "q1",
    columns: columns.map((name) => ({ name, type: "text" })),
    rows,
    truncated: false,
    views: [],
    freshness: [],
  };
}

describe("a table cell that names an entity", () => {
  const wide = result(
    ["cycle_code", "executor", "total"],
    [["REG-42", "sam", 12]],
  );

  it("is a button of its own, so a wide row need not be guessed at", () => {
    render(<DataTable result={wide} onCellClick={vi.fn()} />);

    expect(screen.getByRole("button", { name: /cycle REG-42/i })).toBeInTheDocument();
  });

  it("does not also fire the row handler", () => {
    // Two answers for one click, and the row's - being less specific - would be the one
    // that lands.
    const onRowClick = vi.fn();
    const onCellClick = vi.fn();
    render(<DataTable result={wide} onRowClick={onRowClick} onCellClick={onCellClick} />);

    fireEvent.click(screen.getByRole("button", { name: /cycle REG-42/i }));

    expect(onCellClick).toHaveBeenCalledWith(
      { cycle_code: "REG-42", executor: "sam", total: 12 },
      "cycle_code",
    );
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("leaves columns that name nothing as plain text", () => {
    render(<DataTable result={wide} onCellClick={vi.fn()} />);

    // `executor` is not an entity the app has a page for, so making it look clickable would
    // promise something that does not exist.
    expect(screen.queryByRole("button", { name: /sam/i })).toBeNull();
  });

  it("stays inert when the page offers no cell handler", () => {
    render(<DataTable result={wide} />);

    expect(screen.queryByRole("button", { name: /cycle REG-42/i })).toBeNull();
  });
});

describe("a clickable row", () => {
  it.each([["Enter"], [" "]])("is activated by %s", (key) => {
    const onRowClick = vi.fn();
    // Scoped to the body: the column headers are buttons too (they sort).
    const { container } = render(
      <DataTable result={result(["a"], [["x"]])} onRowClick={onRowClick} />,
    );

    const row = container.querySelector('tbody tr[role="button"]')!;
    expect(row).toHaveAttribute("tabindex", "0");
    fireEvent.keyDown(row, { key });

    expect(onRowClick).toHaveBeenCalledWith({ a: "x" });
  });

  it("is not focusable when there is nothing to activate", () => {
    const { container } = render(<DataTable result={result(["a"], [["x"]])} />);

    expect(container.querySelector('tbody tr[role="button"]')).toBeNull();
    expect(container.querySelector("tbody tr")).not.toHaveAttribute("tabindex");
  });
});

describe("the chart keyboard layer", () => {
  const rows = [
    { cycle_code: "REG-1", total: 4 },
    { cycle_code: "REG-2", total: 7 },
  ];

  it("offers one focusable button per datum", () => {
    render(
      <ChartKeyboardLayer
        rows={rows}
        resolver={defaultResolver(null)}
        onDrill={vi.fn()}
        label="Executions by cycle"
        describeRow={(row) => String(row.cycle_code)}
      />,
    );

    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("announces what activating it will do, not just the value", () => {
    // A screen-reader user deserves the same affordance a hover tooltip gives everyone else.
    render(
      <ChartKeyboardLayer
        rows={rows}
        resolver={defaultResolver(null)}
        onDrill={vi.fn()}
        label="Executions by cycle"
        describeRow={(row) => String(row.cycle_code)}
      />,
    );

    expect(
      screen.getByRole("button", { name: /REG-1\. Open cycle REG-1/i }),
    ).toBeInTheDocument();
  });

  it("fires the same resolver the mouse would", () => {
    const onDrill = vi.fn();
    render(
      <ChartKeyboardLayer
        rows={rows}
        resolver={defaultResolver(null)}
        onDrill={onDrill}
        label="Executions by cycle"
        describeRow={(row) => String(row.cycle_code)}
      />,
    );

    fireEvent.click(screen.getAllByRole("button")[1]);

    expect(onDrill).toHaveBeenCalledWith(
      expect.objectContaining({ row: rows[1] }),
    );
  });

  it("renders nothing rather than an empty list when there is no data", () => {
    const { container } = render(
      <ChartKeyboardLayer
        rows={[]}
        resolver={defaultResolver(null)}
        onDrill={vi.fn()}
        label="Empty"
        describeRow={String}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});

describe("the row inspector", () => {
  it("labels every field, so the fallback is readable rather than raw", () => {
    render(<RowInspector row={{ execution_status: "pass", total_runs: 1200 }} />);

    expect(screen.getByText("Execution status")).toBeInTheDocument();
    expect(screen.getByText("pass")).toBeInTheDocument();
    expect(screen.getByText("1,200")).toBeInTheDocument();
  });

  it("drops empty fields rather than showing blanks", () => {
    render(<RowInspector row={{ kept: "yes", dropped: null }} />);

    expect(screen.queryByText("Dropped")).toBeNull();
  });

  it("says so when a mark carries no row at all", () => {
    render(<RowInspector row={{}} />);

    expect(screen.getByText(/no underlying row/i)).toBeInTheDocument();
  });
});
