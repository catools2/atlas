import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { listWorkflows } from "../../../shared/atlas/atlasClient";
import type { WorkflowSummary } from "../../../shared/atlas/atlasClient";

/** The workflows this Atlas defines, read from the manifest that is actually in effect. */
export function WorkflowListPage() {
  const [workflows, setWorkflows] = useState<WorkflowSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    listWorkflows()
      .then((w) => live && setWorkflows(w))
      .catch((e) => live && setError(e instanceof Error ? e.message : String(e)));
    return () => { live = false; };
  }, []);

  if (error) return <p className="card p-4 text-sm">{error}</p>;
  if (!workflows) return <p className="card p-4 text-sm text-ink-muted">Loading workflows…</p>;

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {workflows.map((workflow) => (
        <Link key={workflow.code} to={`/atlas/workflows/${workflow.code}`} className="card p-3">
          <h2 className="text-sm font-medium">{workflow.name}</h2>
          <p className="mt-1 text-xs text-ink-muted">{workflow.description}</p>
          <p className="mt-2 flex flex-wrap items-center gap-1 text-[10px] text-ink-muted">
            <span className="chip">{workflow.stageCount} stages</span>
            {workflow.chainsTo ? <span className="chip">→ {workflow.chainsTo}</span> : null}
          </p>
          {workflow.entryPrompt ? (
            // How you actually start it. The code is for machines; this is for people.
            <code className="mt-2 block truncate text-[10px] text-ink-muted/70">
              {workflow.entryPrompt}
            </code>
          ) : null}
        </Link>
      ))}
    </div>
  );
}
