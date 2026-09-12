import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ModelExplorerPage } from "./pages/ModelExplorerPage";
import { QueuePage } from "./pages/QueuePage";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/** A fetch that answers each path from a table, and 404s anything the page should not ask for. */
function stubFetch(table: Record<string, { status?: number; body?: unknown; reason?: string }>) {
  const calls: string[] = [];
  vi.stubGlobal("fetch", vi.fn((url: string) => {
    calls.push(url);
    const match = Object.keys(table).find((key) => url.startsWith(key));
    const answer = match ? table[match] : { status: 404 };
    const status = answer.status ?? 200;
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      headers: new Headers({
        "content-type": "application/json",
        ...(answer.reason ? { "X-Metis-Reason": answer.reason } : {}),
      }),
      json: () => Promise.resolve(answer.body),
    } as unknown as Response);
  }));
  return calls;
}

function show(ui: React.ReactElement, path = "/") {
  return render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>);
}

const QUEUE = {
  ok: true,
  total: 2,
  by_workflow: { "model-build": 1, "intent-review": 1 },
  waiting: [
    {
      run_id: "model-build--athena-metric", workflow: "model-build", scope: "athena-metric",
      blocked_on: "model-approval", waiting_since: "2026-09-01T00:00:00+00:00",
      outstanding: ["8 transitions are unapproved"],
      next_command: "metis decide approve --journey athena-metric",
    },
    {
      run_id: "intent-review--archive", workflow: "intent-review", scope: "archive",
      blocked_on: "readiness", waiting_since: "2026-09-07T00:00:00+00:00",
    },
  ],
  means: "runs stopped at a gate, waiting for a person",
};

describe("the decisions queue", () => {
  it("shows what is waiting and links out to Métis to decide it", async () => {
    stubFetch({ "/metis/queue": { body: QUEUE } });
    show(<QueuePage />);

    expect(await screen.findByText("athena-metric")).toBeInTheDocument();
    expect(screen.getByText("model-approval")).toBeInTheDocument();
    expect(screen.getByText("metis decide approve --journey athena-metric")).toBeInTheDocument();

    const links = screen.getAllByRole("link", { name: /decide in métis/i });
    expect(links).toHaveLength(2);
    for (const link of links) {
      // Out to Métis's own scriptless page, where the decision is signed by whoever takes it.
      expect(link).toHaveAttribute("href", expect.stringContaining("/queue"));
      expect(link).toHaveAttribute("target", "_blank");
    }
  });

  it("offers no control that takes a decision", async () => {
    stubFetch({ "/metis/queue": { body: QUEUE } });
    show(<QueuePage />);
    await screen.findByText("athena-metric");

    // The rule this page exists under: an approval taken here would be recorded against the
    // gateway's service token rather than a person, so there is nothing here to approve WITH.
    const controls = [...screen.getAllByRole("button"), ...screen.getAllByRole("link")];
    for (const control of controls) {
      expect(control.textContent ?? "").not.toMatch(/approve|confirm|publish|reject/i);
    }
  });

  it("says the graph could not be read rather than showing an empty queue", async () => {
    // The distinction the 204 exists for. "Métis is unreachable" and "nobody owes a decision"
    // are opposite pieces of news and used to look identical on a page.
    stubFetch({
      "/metis/queue": { status: 204, reason: "no graph is configured: set METIS_NEO4J_PASSWORD" },
    });
    show(<QueuePage />);

    expect(await screen.findByText(/could not answer/i)).toBeInTheDocument();
    expect(screen.getByText(/METIS_NEO4J_PASSWORD/)).toBeInTheDocument();
    expect(screen.queryByText(/nothing is waiting/i)).not.toBeInTheDocument();
  });

  it("says nothing is waiting when nothing is, which is an answer", async () => {
    stubFetch({ "/metis/queue": { body: { ok: true, total: 0, waiting: [], by_workflow: {} } } });
    show(<QueuePage />);

    expect(await screen.findByText(/nothing is waiting on a person/i)).toBeInTheDocument();
    expect(screen.queryByText(/could not answer/i)).not.toBeInTheDocument();
  });

  it("narrows the read itself when a workflow is chosen", async () => {
    const calls = stubFetch({ "/metis/queue": { body: QUEUE } });
    show(<QueuePage />);
    await screen.findByText("athena-metric");

    fireEvent.click(screen.getByRole("button", { name: /model-build/ }));
    await waitFor(() =>
      expect(calls.some((url) => url.includes("workflow=model-build"))).toBe(true));
  });
});

const JOURNEYS = { ok: true, journeys: [{ journey: "athena-metric", surface: "api" }] };

const MODEL = {
  ok: true,
  model_id: "athena-metric-api",
  states: [
    { id: "athena-metric-api::Metric", name: "Metric", is_initial: true, lifecycle_state: "Quarantine" },
    { id: "athena-metric-api::MetricAll", name: "MetricAll", lifecycle_state: "Quarantine" },
  ],
  transitions: [{
    id: "athena-metric-api::276f0a68", source: "athena-metric-api::Metric",
    trigger: "GET /metric/{id}", target: "athena-metric-api::MetricPresent",
    guard: "id exists", outcome_status: "success",
  }],
};

const REPORT = {
  ok: true,
  model_id: "athena-metric-api",
  criterion: "all-transitions",
  coverage: { covered: 0, uncovered: 8 },
  validation: { checked: 8, blocking: 0, advisory: 7, generation: "not blocked" },
  unmeasured: [{
    figure: "covered", kind: "structural", cause: "no_executions",
    reason: "no execution has been ingested for this model",
  }],
  means: "coverage, not outcome (C-11). No verdict is computed.",
};

describe("the model explorer", () => {
  it("draws a journey's states, transitions and guards", async () => {
    stubFetch({
      "/metis/journeys": { body: JOURNEYS },
      "/metis/models/athena-metric/report": { body: REPORT },
      "/metis/models/athena-metric": { body: MODEL },
    });
    show(<ModelExplorerPage />, "/models?journey=athena-metric");

    // The state list, and the one transition between two of its states, with its guard.
    expect((await screen.findAllByText("Metric")).length).toBeGreaterThan(0);
    expect(screen.getByText("MetricAll")).toBeInTheDocument();
    const transitions = within(screen.getByRole("table"));
    expect(transitions.getByText("GET /metric/{id}")).toBeInTheDocument();
    expect(transitions.getByText("id exists")).toBeInTheDocument();
    expect(transitions.getByText("MetricPresent")).toBeInTheDocument();
    expect(screen.getByLabelText("initial state")).toBeInTheDocument();
  });

  it("renders an unmeasured figure as not measured, never as a zero", async () => {
    stubFetch({
      "/metis/journeys": { body: JOURNEYS },
      "/metis/models/athena-metric/report": { body: REPORT },
      "/metis/models/athena-metric": { body: MODEL },
    });
    show(<ModelExplorerPage />, "/models?journey=athena-metric");

    // C-11. Métis prunes empty and false, so an unmeasured figure and a zero arrive identical;
    // `covered: 0` beside "8 uncovered" would read as "nothing is covered" when the truth is
    // that nothing was measured.
    const covered = (await screen.findByText("Covered")).closest("div")!;
    expect(covered).toHaveTextContent("not measured");
    expect(covered).not.toHaveTextContent(/^Covered0/);

    expect(screen.getAllByText(/could not be measured/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/no execution has been ingested/i)).toBeInTheDocument();
    // And no verdict anywhere: the figure is what is tested, not what is working.
    expect(screen.getByText(/no verdict is computed/i)).toBeInTheDocument();
  });

  it("reads the model only once a journey is chosen", async () => {
    const calls = stubFetch({ "/metis/journeys": { body: JOURNEYS } });
    show(<ModelExplorerPage />, "/models");

    expect(await screen.findByText(/pick a journey/i)).toBeInTheDocument();
    expect(calls.some((url) => url.includes("/models/"))).toBe(false);
  });
});
