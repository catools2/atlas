import { useState } from "react";

import { recordGate, validateStage } from "../../../shared/atlas/atlasClient";
import type { Stage, StageVerdict } from "../../../shared/atlas/atlasClient";

/**
 * Recording a decision on a stage gate.
 *
 * <p>Two kinds of check, and keeping them apart is the whole design. The <b>rules</b> are
 * evaluated by the server — a missing artifact, a document that does not match its schema — and
 * they are re-run at the moment of approval, so what is approved is what is on disk rather than
 * what was on screen a minute ago. The <b>prose checks</b> cannot be evaluated by anything, so
 * they are presented as items the approver acknowledges.
 *
 * <p>Without that separation an approve button rubber-stamps the model's own assessment of its
 * own work, which is worse than having no button at all because it looks like control.
 */
export function GatePanel({
  workflowCode, scopeId, stage, onRecorded,
}: {
  workflowCode: string;
  scopeId: string;
  stage: Stage;
  onRecorded: () => void;
}) {
  const [verdict, setVerdict] = useState<StageVerdict | null>(null);
  const [acknowledged, setAcknowledged] = useState<Set<number>>(new Set());
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checks = stage.validationChecks;
  const allAcknowledged = checks.every((_, i) => acknowledged.has(i));

  async function check() {
    setBusy(true); setError(null);
    try {
      setVerdict(await validateStage(workflowCode, scopeId, stage.name));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function decide(decision: string) {
    setBusy(true); setError(null);
    try {
      await recordGate(workflowCode, scopeId, { stage: stage.name, decision, note });
      onRecorded();
    } catch (e) {
      // The server refuses an approval whose rules fail, and its message names which.
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card flex flex-col gap-3 p-3" aria-label={`Gate for ${stage.name}`}>
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium">{stage.name}</h3>
        <button type="button" className="btn-ghost ml-auto" onClick={check} disabled={busy}>
          {busy ? "Checking…" : "Re-check"}
        </button>
      </div>

      {verdict ? (
        <div>
          <p className="mb-1 text-xs text-ink-muted">Checked by the server:</p>
          <ul className="flex flex-col gap-0.5">
            {verdict.rules.map((rule, i) => (
              <li key={i} className="flex gap-2 text-xs">
                <span className={rule.passed ? "text-state-success" : "text-state-danger"}>
                  {rule.passed ? "✓" : "✗"}
                </span>
                <span className="truncate" title={rule.detail}>
                  {rule.check ?? `${rule.type} ${rule.target}`}
                </span>
              </li>
            ))}
            {verdict.rules.length === 0 ? (
              // Worth saying plainly: nothing here was machine-checked, so approving rests
              // entirely on the reader.
              <li className="text-xs text-ink-muted">
                This stage declares no machine-checkable rules.
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      {checks.length > 0 ? (
        <div>
          <p className="mb-1 text-xs text-ink-muted">
            For you to judge — nothing evaluates these:
          </p>
          <ul className="flex flex-col gap-1">
            {checks.map((check, i) => (
              <li key={i}>
                <label className="flex items-start gap-2 text-xs">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={acknowledged.has(i)}
                    onChange={(e) => setAcknowledged((current) => {
                      const next = new Set(current);
                      if (e.target.checked) next.add(i); else next.delete(i);
                      return next;
                    })}
                  />
                  <span>{check}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <input
        className="rounded border border-line bg-surface-strong px-2 py-1 text-xs"
        placeholder={allAcknowledged ? "Note (optional)" : "Note (required — not all checks acknowledged)"}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <div className="flex flex-wrap items-center gap-2">
        {/* The CLI's four choices, with its accelerators, so the muscle memory carries over. */}
        <button
          type="button"
          className="btn-primary"
          accessKey="c"
          // Unacknowledged checks are not a blocker, but they demand a note: a gate passed
          // without reading it should at least say why.
          disabled={busy || (!allAcknowledged && note.trim() === "")}
          onClick={() => decide("passed")}
        >
          Continue
        </button>
        <button type="button" className="btn-ghost" accessKey="x" disabled={busy}
                onClick={() => decide("failed")}>
          Block
        </button>
        <button type="button" className="btn-ghost" accessKey="s" disabled={busy}
                onClick={() => decide("skipped")}>
          Skip
        </button>
      </div>

      {error ? <p className="text-xs text-state-danger">{error}</p> : null}
    </section>
  );
}
