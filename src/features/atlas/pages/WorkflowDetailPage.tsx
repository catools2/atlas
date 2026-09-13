import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getWorkflow } from "../../../shared/atlas/atlasClient";
import type { Stage, WorkflowDetail } from "../../../shared/atlas/atlasClient";
import { rememberTitle } from "../../../shared/ui/titleCache";
import { StagePipeline } from "../components/StagePipeline";

/** What a workflow is: its stages, the skills each runs, and what each must produce. */
export function WorkflowDetailPage() {
  const { code = "" } = useParams();
  const [workflow, setWorkflow] = useState<WorkflowDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Stage | null>(null);

  useEffect(() => {
    let live = true;
    getWorkflow(code)
      .then((w) => live && setWorkflow(w))
      .catch((e) => live && setError(e instanceof Error ? e.message : String(e)));
    return () => { live = false; };
  }, [code]);

  useEffect(() => {
    if (workflow) rememberTitle(`/atlas/workflows/${code}`, workflow.name);
  }, [workflow, code]);

  if (error) return <p className="card p-4 text-sm">{error}</p>;
  if (!workflow) return <p className="card p-4 text-sm text-ink-muted">Loading…</p>;

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_20rem]">
      <div>
        <h1 className="mb-2 text-lg font-semibold">{workflow.name}</h1>
        <StagePipeline
          stages={workflow.stages}
          selected={selected?.name}
          onSelect={setSelected}
        />
      </div>
      {selected ? <StageDetail stage={selected} /> : null}
    </div>
  );
}

function StageDetail({ stage }: { stage: Stage }) {
  return (
    <aside className="card flex flex-col gap-3 p-3">
      <h2 className="text-sm font-medium">{stage.name}</h2>

      <Block title="Must produce">
        {stage.requiredArtifacts.length === 0 ? (
          <p className="text-xs text-ink-muted">Nothing on disk.</p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {stage.requiredArtifacts.map((artifact) => (
              <li key={artifact} className="break-all font-mono text-[10px] text-ink-muted">
                {artifact}
              </li>
            ))}
          </ul>
        )}
      </Block>

      {stage.validationRules.length > 0 ? (
        <Block title="Checked automatically">
          <ul className="flex flex-col gap-0.5 text-xs">
            {stage.validationRules.map((rule, i) => (
              <li key={i}>{rule.check ?? `${rule.type} ${rule.target}`}</li>
            ))}
          </ul>
        </Block>
      ) : null}

      <Block title="Checked by a person">
        {/* Kept visually distinct from the rules above, because the difference between
            "the server verified this" and "somebody said so" is the whole point. */}
        <ul className="flex list-disc flex-col gap-0.5 pl-4 text-xs text-ink-muted">
          {stage.validationChecks.map((check, i) => <li key={i}>{check}</li>)}
        </ul>
      </Block>
    </aside>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[10px] uppercase tracking-wide text-ink-muted/70">{title}</p>
      {children}
    </div>
  );
}
