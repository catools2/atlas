import { csrfHeaders } from "../api/session";

/** The Atlas control API, reached through the gateway on `/atlas`. */
const ROOT = "/atlas";

export class AtlasError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AtlasError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${ROOT}${path}`, {
    ...init,
    headers: { Accept: "application/json", ...(init?.headers ?? {}) },
  });
  if (!response.ok) {
    // FastAPI reports a refusal in `detail`, and those messages are the useful part — "cannot
    // approve: scenarios.json is missing a required property" tells the approver what to fix.
    let detail = `Request failed with ${response.status}`;
    try {
      const body = await response.json();
      if (typeof body?.detail === "string") detail = body.detail;
    } catch {
      /* non-JSON error body */
    }
    throw new AtlasError(detail, response.status);
  }
  return response.json() as Promise<T>;
}

export interface WorkflowSummary {
  code: string;
  name: string;
  description: string | null;
  entryPrompt: string | null;
  stageCount: number;
  chainsTo: string | null;
}

export interface ValidationRule {
  type: string;
  target: string;
  check: string | null;
  passed?: boolean;
  detail?: string;
}

export interface Stage {
  name: string;
  /** Sparse by design — positions in a 15-stage vocabulary, not 1..n. */
  ordinal: number | null;
  skills: string[];
  requiredArtifacts: string[];
  validationChecks: string[];
  validationRules: ValidationRule[];
  chainModeSkip: boolean;
  nextWorkflow: string | null;
  autoAdvance: boolean;
  status?: string;
  completedAt?: string | null;
  skillsExecuted?: string[];
  artifactsProduced?: { path: string; type: string }[];
  approval?: { decision: string; actor_ref: string | null; at: string; note: string | null } | null;
}

export interface WorkflowDetail {
  code: string;
  name: string;
  description: string | null;
  stages: Stage[];
}

export interface RunSummary {
  workflowCode: string;
  scopeId: string;
  hasGateFile: boolean;
  currentStage: string | null;
  blockedOn: string | null;
  stagesRecorded: number;
  stagesPassed: number;
  updatedAt: string | null;
}

export interface RunDetail extends RunSummary {
  stages: Stage[];
  artifacts: { path: string; bytes: number; type: string; readable: boolean }[];
}

export interface StageVerdict {
  passed: boolean;
  rules: ValidationRule[];
  checks: string[];
  messages: string[];
}

export const listWorkflows = () => request<WorkflowSummary[]>("/workflows");
export const getWorkflow = (code: string) =>
  request<WorkflowDetail>(`/workflows/${encodeURIComponent(code)}`);
export const listRuns = () => request<RunSummary[]>("/runs");
export const getRun = (workflow: string, scope: string) =>
  request<RunDetail>(`/runs/${encodeURIComponent(workflow)}/${encodeURIComponent(scope)}`);
export const getArtifact = (workflow: string, scope: string, path: string) =>
  request<{ path: string; body: string }>(
    `/runs/${encodeURIComponent(workflow)}/${encodeURIComponent(scope)}/artifact?path=${encodeURIComponent(path)}`,
  );

export const validateStage = (workflow: string, scope: string, stage: string) =>
  request<StageVerdict>(
    `/runs/${encodeURIComponent(workflow)}/${encodeURIComponent(scope)}/validate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...csrfHeaders() },
      body: JSON.stringify({ stage }),
    },
  );

export const recordGate = (
  workflow: string,
  scope: string,
  body: { stage: string; decision: string; note?: string },
) =>
  request<{ status: string }>(
    `/runs/${encodeURIComponent(workflow)}/${encodeURIComponent(scope)}/gate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...csrfHeaders() },
      body: JSON.stringify(body),
    },
  );
