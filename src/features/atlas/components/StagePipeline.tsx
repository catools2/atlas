import type { Stage } from "../../../shared/atlas/atlasClient";

/**
 * A workflow's stages, top to bottom.
 *
 * <p><b>A vertical list, not a horizontal stepper.</b> The ordinals are sparse — `test-designer`
 * runs 1, 3, 4, 6, 7, 14, 15 — and a stepper spaces its steps evenly, which would quietly assert
 * that this workflow has seven consecutive stages. It does not; it uses seven positions out of
 * fifteen, and the gaps are the design. Showing the number and letting the list run vertically
 * keeps that true.
 */
export function StagePipeline({
  stages, selected, onSelect,
}: {
  stages: Stage[];
  selected?: string;
  onSelect?: (stage: Stage) => void;
}) {
  return (
    <ol className="flex flex-col gap-1">
      {stages.map((stage) => {
        const status = stage.status ?? "declared";
        return (
          <li key={stage.name}>
            <button
              type="button"
              onClick={() => onSelect?.(stage)}
              aria-current={selected === stage.name ? "step" : undefined}
              className={`card w-full p-2 text-left focus:outline-none focus:ring-1 focus:ring-accent ${
                selected === stage.name ? "ring-1 ring-accent" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                {/* The manifest's own number, never a renumbered 1..n. */}
                <span className="w-6 shrink-0 text-right text-xs tabular-nums text-ink-muted">
                  {stage.ordinal}
                </span>
                <span className="truncate text-sm">{stage.name}</span>
                <StatusChip status={status} />
                {stage.chainModeSkip ? (
                  <span className="chip" title="Skipped when this workflow runs as part of a chain">
                    chain-skip
                  </span>
                ) : null}
                {stage.nextWorkflow ? (
                  <span className="chip" title={`Advances to ${stage.nextWorkflow}`}>
                    → {stage.nextWorkflow}
                  </span>
                ) : null}
              </div>

              <SkillRow declared={stage.skills} executed={stage.skillsExecuted} />
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Which skills ran, against which were declared.
 *
 * <p>The useful read on a run is a skill the manifest lists that did <i>not</i> execute — it is
 * how a stage that "passed" while skipping half its work becomes visible. So a declared skill
 * with no execution is greyed rather than omitted.
 */
function SkillRow({ declared, executed }: { declared: string[]; executed?: string[] }) {
  if (declared.length === 0) return null;
  const ran = new Set(executed ?? []);
  const knownRun = executed !== undefined;

  return (
    <div className="mt-1 flex flex-wrap gap-1 pl-8">
      {declared.map((skill) => {
        const didRun = ran.has(skill);
        return (
          <span
            key={skill}
            title={!knownRun ? "declared" : didRun ? "ran" : "declared, did not run"}
            className={`chip ${knownRun && !didRun ? "opacity-40" : ""}`}
          >
            {skill}
          </span>
        );
      })}
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const tone =
    status === "passed" ? "text-state-success"
    : status === "failed" ? "text-state-danger"
    : status === "skipped" ? "text-ink-muted"
    : "text-ink-muted/60";
  return <span className={`ml-auto shrink-0 text-[10px] ${tone}`}>{status}</span>;
}
