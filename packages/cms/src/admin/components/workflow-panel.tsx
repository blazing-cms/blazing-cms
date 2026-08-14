import type { CollectionDefinition, WorkflowTransitionConfig } from "@blazing-cms/types";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { History, UserRound, Workflow } from "lucide-react";
import { useState } from "react";

import { useToast } from "@/components/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDataProvider } from "@/lib/providers/context";
import { usePermissions } from "@/lib/rbac";
import { formatVersionDate } from "@/lib/versions";
import {
  allowedTransitions,
  hasWorkflow,
  historyOf,
  resolveWorkflow,
  stateLabel,
  transitionError,
  type WorkflowTransitionRecord,
} from "@/lib/workflow";

function currentState(entry: Record<string, unknown> | null | undefined, fallback: string): string {
  return typeof entry?.workflowState === "string" ? entry.workflowState : fallback;
}

function reviewerOf(entry: Record<string, unknown> | null | undefined): string | undefined {
  return typeof entry?.reviewer === "string" ? entry.reviewer : undefined;
}

function actionLabel(t: WorkflowTransitionConfig, col: CollectionDefinition): string {
  return `Move to ${stateLabel(t.to, col)}`;
}

function visibleTransitions(
  col: CollectionDefinition,
  state: string,
  roleIds: string[],
  canUpdate: boolean,
  canPublish: boolean,
): WorkflowTransitionConfig[] {
  if (!canUpdate) return [];
  return allowedTransitions(col, state, roleIds).filter((t) => t.to !== "published" || canPublish);
}

function WorkflowBadge({ label }: { label: string }) {
  return <Badge variant="secondary">{label}</Badge>;
}

function ReviewerRow({ reviewer }: { reviewer?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <UserRound className="h-4 w-4 text-muted-foreground" />
      {reviewer ? (
        <span>
          Reviewer: <span className="font-medium">{reviewer}</span>
        </span>
      ) : (
        <span className="text-muted-foreground">No reviewer assigned</span>
      )}
    </div>
  );
}

function HistoryTimeline({
  col,
  history,
}: {
  col: CollectionDefinition;
  history: WorkflowTransitionRecord[];
}) {
  if (history.length === 0) {
    return <p className="text-sm text-muted-foreground">No transitions yet.</p>;
  }
  return (
    <ul className="space-y-3">
      {[...history].reverse().map((record, i) => (
        <li key={`${record.at}-${i}`} className="flex gap-3">
          <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-sm">
              <span className="font-medium">{stateLabel(record.from, col)}</span>
              <span className="mx-1 text-muted-foreground">→</span>
              <span className="font-medium">{stateLabel(record.to, col)}</span>
              {record.user && <span className="text-muted-foreground"> by {record.user}</span>}
            </p>
            {record.comment && (
              <p className="mt-0.5 text-xs italic text-muted-foreground">
                &quot;{record.comment}&quot;
              </p>
            )}
            <p className="mt-0.5 text-xs text-muted-foreground">{formatVersionDate(record.at)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ReviewerSelect({
  disabled,
  onChange,
  value,
}: {
  disabled: boolean;
  onChange: (userId: string) => void;
  value: string;
}) {
  const provider = useDataProvider();
  const { data: users } = useQuery({
    queryFn: () => provider.findMany("users", { limit: 100 }),
    queryKey: ["users"],
  });

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-xs font-medium text-muted-foreground">Assign reviewer</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-9 rounded-md border bg-background px-2 text-sm disabled:opacity-50"
      >
        <option value="">No reviewer</option>
        {(users?.data ?? []).map((u) => (
          <option key={String(u.id)} value={String(u.id)}>
            {String(u.name ?? u.email ?? u.id)}
          </option>
        ))}
      </select>
    </label>
  );
}

function TransitionButtons({
  busy,
  col,
  onTransition,
  transitions,
}: {
  busy: boolean;
  col: CollectionDefinition;
  onTransition: (to: string) => void;
  transitions: WorkflowTransitionConfig[];
}) {
  if (transitions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No transitions are available from this state.</p>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {transitions.map((t) => (
        <Button
          key={`${t.from}-${t.to}`}
          size="sm"
          disabled={busy}
          onClick={() => onTransition(t.to)}
        >
          {actionLabel(t, col)}
        </Button>
      ))}
    </div>
  );
}

export function WorkflowPanel({
  col,
  entry,
  id,
  slug,
}: {
  col: CollectionDefinition;
  entry: Record<string, unknown> | null | undefined;
  id: string;
  slug: string;
}) {
  const provider = useDataProvider();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const { can, roleIds } = usePermissions();
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  if (!hasWorkflow(col)) return null;

  const resolved = resolveWorkflow(col);
  const state = currentState(entry, resolved.defaultState);
  const history = historyOf(entry?.workflowHistory);
  const canUpdate = can("update", slug);
  const transitions = visibleTransitions(col, state, roleIds, canUpdate, can("publish", slug));

  async function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["collection", slug] });
    void queryClient.invalidateQueries({ queryKey: ["collection", slug, id] });
  }

  async function doTransition(to: string) {
    const error = transitionError(col, state, to, { comment, roleIds });
    if (error) {
      addToast({ description: error, title: "Transition blocked", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await provider.transitionEntry(slug, id, to, { comment: comment || undefined });
      addToast({ description: `Moved to ${stateLabel(to, col)}.`, title: "State updated" });
      setComment("");
      await invalidate();
    } catch (err) {
      addToast({ description: String(err), title: "Error", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function assignReviewer(userId: string) {
    setBusy(true);
    try {
      await provider.assignReviewer(slug, id, userId);
      await invalidate();
    } catch (err) {
      addToast({ description: String(err), title: "Error", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 border-t pt-6">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Workflow className="h-4 w-4" /> Workflow
        </h2>
        <WorkflowBadge label={stateLabel(state, col)} />
        <ReviewerRow reviewer={reviewerOf(entry)} />
      </div>

      <div className="space-y-3">
        <ReviewerSelect
          disabled={busy || !canUpdate}
          value={reviewerOf(entry) ?? ""}
          onChange={assignReviewer}
        />

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-muted-foreground">Comment (optional)</span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={!canUpdate}
            rows={2}
            placeholder="Add a note for reviewers..."
            className="rounded-md border bg-background px-2 py-1.5 text-sm disabled:opacity-50"
          />
        </label>

        <TransitionButtons
          busy={busy}
          col={col}
          onTransition={doTransition}
          transitions={transitions}
        />
      </div>

      <h3 className="mt-6 mb-3 flex items-center gap-2 font-semibold">
        <History className="h-4 w-4" /> Transition History
      </h3>
      {entry === undefined && history.length === 0 ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      ) : (
        <HistoryTimeline col={col} history={history} />
      )}
    </div>
  );
}
