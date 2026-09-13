import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { listRuns } from "../../../shared/atlas/atlasClient";
import type { RunSummary } from "../../../shared/atlas/atlasClient";

/** Every run on disk. */
export function RunListPage() {
  const [runs, setRuns] = useState<RunSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    listRuns()
      .then((r) => live && setRuns(r))
      .catch((e) => live && setError(e instanceof Error ? e.message : String(e)));
    return () => { live = false; };
  }, []);

  if (error) return <p className="card p-4 text-sm">{error}</p>;
  if (!runs) return <p className="card p-4 text-sm text-ink-muted">Loading runs…</p>;
  if (runs.length === 0) {
    return (
      <p className="card p-4 text-sm text-ink-muted">
        No runs in this workspace yet. A run appears here once a stage has been closed.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {runs.map((run) => (
        <li key={`${run.workflowCode}/${run.scopeId}`}>
          <Link to={`/atlas/runs/${run.workflowCode}/${run.scopeId}`} className="card block p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">{run.scopeId}</span>
              <span className="chip">{run.workflowCode}</span>
              {run.blockedOn ? (
                <span className="chip text-state-danger">blocked on {run.blockedOn}</span>
              ) : null}
              {!run.hasGateFile ? (
                // Not hidden: these are runs from before stages were closed, and pretending
                // they did not happen would misrepresent the workspace.
                <span className="chip opacity-60" title="No stage-gate.json — status unknown">
                  unrecorded
                </span>
              ) : null}
              <span className="ml-auto text-xs tabular-nums text-ink-muted">
                {run.stagesPassed}/{run.stagesRecorded} passed
              </span>
            </div>
            {run.currentStage ? (
              <p className="mt-1 text-xs text-ink-muted">at {run.currentStage}</p>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
