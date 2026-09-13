import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GatePanel } from "./components/GatePanel";
import { StagePipeline } from "./components/StagePipeline";
import type { Stage } from "../../shared/atlas/atlasClient";

const validateStage = vi.fn();
const recordGate = vi.fn();

vi.mock("../../shared/atlas/atlasClient", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../shared/atlas/atlasClient")>()),
  validateStage: (...a: unknown[]) => validateStage(...a),
  recordGate: (...a: unknown[]) => recordGate(...a),
}));

const stage = (over: Partial<Stage> = {}): Stage => ({
  name: "Analysis", ordinal: 6, skills: ["atlassian-analyzer", "risk-product"],
  requiredArtifacts: [], validationChecks: ["Gap report traces to evidence"],
  validationRules: [], chainModeSkip: false, nextWorkflow: null, autoAdvance: false,
  ...over,
});

describe("the stage pipeline", () => {
  it("shows the manifest's own ordinal, never a renumbered 1..n", () => {
    // test-designer runs 1,3,4,6,7,14,15 — a stepper that renumbers them would assert this
    // workflow has seven consecutive stages. It does not.
    render(<StagePipeline stages={[stage({ ordinal: 14, name: "Test Case Publishing" })]} />);

    expect(screen.getByText("14")).toBeInTheDocument();
  });

  it("greys a declared skill that did not run", () => {
    // The useful read on a run: a stage that passed while skipping half its work.
    const { container } = render(
      <StagePipeline stages={[stage({ status: "passed", skillsExecuted: ["risk-product"] })]} />,
    );

    const ran = screen.getByTitle("ran");
    const didNot = screen.getByTitle("declared, did not run");
    expect(ran).toHaveTextContent("risk-product");
    expect(didNot).toHaveTextContent("atlassian-analyzer");
    expect(didNot.className).toMatch(/opacity-40/);
    expect(container).toBeTruthy();
  });

  it("does not claim a skill was skipped when nothing ran yet", () => {
    render(<StagePipeline stages={[stage()]} />);

    expect(screen.getAllByTitle("declared")).toHaveLength(2);
  });

  it("flags a stage the chain skips", () => {
    render(<StagePipeline stages={[stage({ chainModeSkip: true })]} />);

    expect(screen.getByText("chain-skip")).toBeInTheDocument();
  });
});

describe("the gate panel", () => {
  const props = {
    workflowCode: "test-designer", scopeId: "sample-1", onRecorded: vi.fn(),
  };

  it("separates what the server checked from what a person must judge", async () => {
    validateStage.mockResolvedValue({
      passed: false,
      rules: [{ type: "json_schema", target: "x", check: "Scenarios are well formed",
                passed: false, detail: "missing" }],
      checks: ["Gap report traces to evidence"], messages: [],
    });
    render(<GatePanel {...props} stage={stage()} />);

    fireEvent.click(screen.getByRole("button", { name: /re-check/i }));

    await waitFor(() => expect(screen.getByText(/Checked by the server/i)).toBeInTheDocument());
    expect(screen.getByText(/For you to judge/i)).toBeInTheDocument();
    expect(screen.getByText("Scenarios are well formed")).toBeInTheDocument();
  });

  it("says plainly when a stage has nothing machine-checkable", async () => {
    // Approving then rests entirely on the reader, and they should know that.
    validateStage.mockResolvedValue({ passed: true, rules: [], checks: [], messages: [] });
    render(<GatePanel {...props} stage={stage({ validationChecks: [] })} />);

    fireEvent.click(screen.getByRole("button", { name: /re-check/i }));

    await waitFor(() =>
      expect(screen.getByText(/declares no machine-checkable rules/i)).toBeInTheDocument());
  });

  it("requires a note when the prose checks were not acknowledged", () => {
    render(<GatePanel {...props} stage={stage()} />);

    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });

  it("allows continuing once the checks are acknowledged", () => {
    render(<GatePanel {...props} stage={stage()} />);

    fireEvent.click(screen.getByRole("checkbox"));

    expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled();
  });

  it("allows continuing without acknowledging if a reason is given", () => {
    render(<GatePanel {...props} stage={stage()} />);

    fireEvent.change(screen.getByPlaceholderText(/required/i), {
      target: { value: "checked manually against the ticket" },
    });

    expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled();
  });

  it("surfaces the server's refusal rather than a generic failure", async () => {
    // The server re-runs the rules at approval time; its message names what failed, and that
    // is the only part the approver can act on.
    recordGate.mockRejectedValue(new Error("cannot approve: scenarios.json is missing scope_id"));
    render(<GatePanel {...props} stage={stage({ validationChecks: [] })} />);

    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() =>
      expect(screen.getByText(/missing scope_id/i)).toBeInTheDocument());
  });

  it("records a block without requiring anything", async () => {
    recordGate.mockResolvedValue({ status: "ok" });
    render(<GatePanel {...props} stage={stage()} />);

    fireEvent.click(screen.getByRole("button", { name: /block/i }));

    await waitFor(() =>
      expect(recordGate).toHaveBeenCalledWith("test-designer", "sample-1",
        expect.objectContaining({ decision: "failed" })));
  });
});
