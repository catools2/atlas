import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import { getArtifact, getRun } from "../../../shared/atlas/atlasClient";
import type { RunDetail, Stage } from "../../../shared/atlas/atlasClient";
import { Markdown } from "../../../shared/ui/Markdown";
import { rememberTitle } from "../../../shared/ui/titleCache";
import { GatePanel } from "../components/GatePanel";
import { StagePipeline } from "../components/StagePipeline";

/** One run: what each stage did, what it produced, and the gate. */
export function RunDetailPage() {
  const { workflow = "", scope = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const [run, setRun] = useState<RunDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let live = true;
    getRun(workflow, scope)
      .then((r) => live && setRun(r))
      .catch((e) => live && setError(e instanceof Error ? e.message : String(e)));
    return () => { live = false; };
  }, [workflow, scope, reloadToken]);

  useEffect(() => {
    rememberTitle(`/atlas/runs/${workflow}/${scope}`, scope);
  }, [workflow, scope]);

  // Drill position in the URL, like everywhere else, so a stage or an artifact is linkable.
  const selectedStage = params.get("stage");
  const selectedArtifact = params.get("artifact");
  const select = useCallback((patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) next.delete(k); else next.set(k, v);
    }
    setParams(next);
  }, [params, setParams]);

  if (error) return <p className="card p-4 text-sm">{error}</p>;
  if (!run) return <p className="card p-4 text-sm text-ink-muted">Loading run…</p>;

  const stage = run.stages?.find((s) => s.name === selectedStage) ?? null;

  return (
    <div className="flex flex-col gap-3">
      <header className="flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-semibold">{run.scopeId}</h1>
        <span className="chip">{run.workflowCode}</span>
        {run.blockedOn ? (
          <span className="chip text-state-danger">blocked on {run.blockedOn}</span>
        ) : null}
      </header>

      <div className="grid gap-3 lg:grid-cols-[1fr_22rem]">
        <StagePipeline
          stages={run.stages ?? []}
          selected={selectedStage ?? undefined}
          onSelect={(s: Stage) => select({ stage: s.name, artifact: null })}
        />

        <div className="flex flex-col gap-3">
          {stage ? (
            <GatePanel
              workflowCode={run.workflowCode}
              scopeId={run.scopeId}
              stage={stage}
              onRecorded={() => setReloadToken((t) => t + 1)}
            />
          ) : null}

          <ArtifactBrowser
            run={run}
            selected={selectedArtifact}
            onSelect={(path) => select({ artifact: path })}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * The files a run produced.
 *
 * <p>The tree is the stage pipeline, because the path convention already encodes it —
 * `<ordinal>-<stage-name>/…`. Nothing has to be reconstructed.
 */
function ArtifactBrowser({
  run, selected, onSelect,
}: {
  run: RunDetail;
  selected: string | null;
  onSelect: (path: string) => void;
}) {
  const [body, setBody] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selected) { setBody(null); return; }
    let live = true;
    setBody(null); setError(null);
    getArtifact(run.workflowCode, run.scopeId, selected)
      .then((a) => live && setBody(a.body))
      .catch((e) => live && setError(e instanceof Error ? e.message : String(e)));
    return () => { live = false; };
  }, [run.workflowCode, run.scopeId, selected]);

  return (
    <section className="card flex flex-col gap-2 p-3">
      <h2 className="text-sm font-medium">Artifacts</h2>
      {run.artifacts.length === 0 ? (
        <p className="text-xs text-ink-muted">This run has written nothing yet.</p>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {run.artifacts.map((artifact) => (
            <li key={artifact.path}>
              <button
                type="button"
                disabled={!artifact.readable}
                title={artifact.readable ? artifact.path : "Not a text artifact"}
                className={`w-full truncate text-left font-mono text-[10px] ${
                  artifact.readable ? "hover:text-ink" : "opacity-40"
                } ${selected === artifact.path ? "text-ink underline" : "text-ink-muted"}`}
                onClick={() => onSelect(artifact.path)}
              >
                {artifact.path}
              </button>
            </li>
          ))}
        </ul>
      )}

      {error ? <p className="text-xs text-state-danger">{error}</p> : null}
      {body !== null ? (
        selected?.endsWith(".md")
          ? <div className="max-h-80 overflow-auto"><Markdown source={body} /></div>
          : <pre className="max-h-80 overflow-auto rounded bg-black/30 p-2 text-[10px]">{body}</pre>
      ) : null}
    </section>
  );
}
