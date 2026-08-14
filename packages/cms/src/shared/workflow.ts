import type {
  CollectionDefinition,
  WorkflowConfig,
  WorkflowTransitionConfig,
} from "@blazing-cms/types";

export interface ResolvedWorkflow {
  config: WorkflowConfig;
  defaultState: string;
  reviewerRoles: string[];
  states: Array<{ name: string; label?: string }>;
  transitions: WorkflowTransitionConfig[];
}

export interface WorkflowTransitionRecord {
  at: string;
  from: string;
  to: string;
  user?: string;
  comment?: string;
}

export interface TransitionOptions {
  comment?: string;
  roleIds?: string[];
}

export const DEFAULT_WORKFLOW_STATES: Array<{ name: string; label?: string }> = [
  { label: "Draft", name: "draft" },
  { label: "In Review", name: "review" },
  { label: "Published", name: "published" },
  { label: "Rejected", name: "rejected" },
];

const DEFAULT_WORKFLOW_TRANSITIONS: WorkflowTransitionConfig[] = [
  { from: "draft", to: "review" },
  { from: "draft", to: "published" },
  { from: "review", to: "published" },
  { from: "review", to: "rejected" },
  { from: "rejected", to: "draft" },
  { from: "published", to: "draft" },
];

function workflowConfig(def?: CollectionDefinition): WorkflowConfig | undefined {
  return def?.workflow;
}

function customStates(config?: WorkflowConfig): Array<{ name: string; label?: string }> {
  return config?.states && config.states.length > 0 ? config.states : DEFAULT_WORKFLOW_STATES;
}

function customTransitions(config?: WorkflowConfig): WorkflowTransitionConfig[] {
  return config?.transitions && config.transitions.length > 0
    ? config.transitions
    : DEFAULT_WORKFLOW_TRANSITIONS;
}

export function hasWorkflow(def?: CollectionDefinition): boolean {
  return def?.workflow !== undefined;
}

export function resolveWorkflow(def?: CollectionDefinition): ResolvedWorkflow {
  const config = workflowConfig(def);
  const states = customStates(config);
  return {
    config: config ?? {},
    defaultState: config?.defaultState ?? states[0]?.name ?? "draft",
    reviewerRoles: config?.reviewerRoles ?? [],
    states,
    transitions: customTransitions(config),
  };
}

export function defaultWorkflowState(def?: CollectionDefinition): string {
  return resolveWorkflow(def).defaultState;
}

export function stateLabel(state: string, def?: CollectionDefinition): string {
  const found = resolveWorkflow(def).states.find((s) => s.name === state);
  if (found?.label) return found.label;
  return state.charAt(0).toUpperCase() + state.slice(1);
}

export function findTransition(
  def: CollectionDefinition | undefined,
  from: string,
  to: string,
): WorkflowTransitionConfig | undefined {
  return resolveWorkflow(def).transitions.find((t) => t.from === from && t.to === to);
}

function rolesSatisfied(required?: string[], roleIds?: string[]): boolean {
  if (!required || required.length === 0) return true;
  if (!roleIds) return false;
  return required.some((r) => roleIds.includes(r));
}

export function transitionAllowed(
  def: CollectionDefinition | undefined,
  from: string,
  to: string,
  roleIds?: string[],
): boolean {
  const transition = findTransition(def, from, to);
  if (!transition) return false;
  return rolesSatisfied(transition.roles, roleIds);
}

export function allowedTransitions(
  def: CollectionDefinition | undefined,
  from: string,
  roleIds?: string[],
): WorkflowTransitionConfig[] {
  return resolveWorkflow(def).transitions.filter(
    (t) => t.from === from && rolesSatisfied(t.roles, roleIds),
  );
}

export function transitionError(
  def: CollectionDefinition | undefined,
  from: string,
  to: string,
  options?: TransitionOptions,
): string | null {
  if (from === to) return "Entry is already in that state.";
  if (!transitionAllowed(def, from, to, options?.roleIds)) {
    return `Transition from "${from}" to "${to}" is not allowed.`;
  }
  if (findTransition(def, from, to)?.commentRequired && !options?.comment) {
    return "A comment is required for this transition.";
  }
  return null;
}

function isTransitionRecord(value: unknown): value is WorkflowTransitionRecord {
  return value !== null && typeof value === "object" && "from" in value && "to" in value;
}

export function historyOf(value: unknown): WorkflowTransitionRecord[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isTransitionRecord);
}

export function transitionRecord(
  current: unknown,
  to: string,
  options?: TransitionOptions & { user?: string },
): WorkflowTransitionRecord {
  return {
    at: new Date().toISOString(),
    comment: options?.comment,
    from: typeof current === "string" ? current : "draft",
    to,
    user: options?.user,
  };
}
