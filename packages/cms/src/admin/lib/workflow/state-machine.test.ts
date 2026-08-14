import type { CollectionDefinition, WorkflowConfig } from "@blazing-cms/types";

import { describe, expect, it } from "vitest";

import {
  allowedTransitions,
  DEFAULT_WORKFLOW_STATES,
  defaultWorkflowState,
  findTransition,
  hasWorkflow,
  historyOf,
  resolveWorkflow,
  stateLabel,
  transitionAllowed,
  transitionError,
  transitionRecord,
} from "./index";

function collection(workflow?: WorkflowConfig): CollectionDefinition {
  return { fields: [], labels: { plural: "Posts", singular: "Post" }, slug: "posts", workflow };
}

describe("hasWorkflow", () => {
  it("is false when no workflow config is present", () => {
    expect(hasWorkflow(collection(undefined))).toBe(false);
  });

  it("is true when a workflow config is present", () => {
    expect(hasWorkflow(collection({}))).toBe(true);
  });
});

describe("resolveWorkflow", () => {
  it("fills defaults when config is empty", () => {
    const resolved = resolveWorkflow(collection({}));
    expect(resolved.defaultState).toBe("draft");
    expect(resolved.states).toEqual(DEFAULT_WORKFLOW_STATES);
    expect(resolved.reviewerRoles).toEqual([]);
    expect(resolved.transitions).toHaveLength(6);
  });

  it("honors custom states, default state, and reviewer roles", () => {
    const resolved = resolveWorkflow(
      collection({
        defaultState: "idea",
        reviewerRoles: ["role-editor"],
        states: [{ label: "Idea", name: "idea" }, { name: "done" }],
      }),
    );
    expect(resolved.defaultState).toBe("idea");
    expect(resolved.reviewerRoles).toEqual(["role-editor"]);
    expect(resolved.states.map((s) => s.name)).toEqual(["idea", "done"]);
  });

  it("uses the first state as the default when unset", () => {
    expect(
      resolveWorkflow(collection({ states: [{ name: "start" }, { name: "end" }] })).defaultState,
    ).toBe("start");
  });

  it("is safe with no collection at all", () => {
    expect(resolveWorkflow(undefined).defaultState).toBe("draft");
  });
});

describe("defaultWorkflowState", () => {
  it("returns draft for a default workflow", () => {
    expect(defaultWorkflowState(collection({}))).toBe("draft");
  });
});

describe("stateLabel", () => {
  it("uses configured labels", () => {
    expect(stateLabel("review", collection({}))).toBe("In Review");
  });

  it("falls back to capitalized state name", () => {
    expect(stateLabel("archived", collection({}))).toBe("Archived");
  });
});

describe("findTransition", () => {
  it("finds an allowed transition", () => {
    expect(findTransition(collection({}), "draft", "review")).toEqual({
      from: "draft",
      to: "review",
    });
  });

  it("returns undefined for an unknown transition", () => {
    expect(findTransition(collection({}), "published", "review")).toBeUndefined();
  });
});

describe("transitionAllowed", () => {
  it("allows draft → review for anyone", () => {
    expect(transitionAllowed(collection({}), "draft", "review")).toBe(true);
  });

  it("denies transitions not in the config", () => {
    expect(transitionAllowed(collection({}), "review", "draft")).toBe(false);
  });

  it("gates role-restricted transitions", () => {
    const def = collection({
      transitions: [{ from: "review", roles: ["role-editor"], to: "published" }],
    });
    expect(transitionAllowed(def, "review", "published", [])).toBe(false);
    expect(transitionAllowed(def, "review", "published", ["role-viewer"])).toBe(false);
    expect(transitionAllowed(def, "review", "published", ["role-editor"])).toBe(true);
  });
});

describe("allowedTransitions", () => {
  it("lists the transitions available from a state", () => {
    const transitions = allowedTransitions(collection({}), "draft");
    expect(transitions.map((t) => t.to)).toEqual(["review", "published"]);
  });

  it("filters by the user's roles", () => {
    const def = collection({
      transitions: [
        { from: "draft", roles: ["role-editor"], to: "review" },
        { from: "draft", roles: ["role-publisher"], to: "published" },
      ],
    });
    expect(allowedTransitions(def, "draft", ["role-editor"]).map((t) => t.to)).toEqual(["review"]);
  });
});

describe("transitionError", () => {
  it("rejects self-transitions", () => {
    expect(transitionError(collection({}), "draft", "draft")).toBe(
      "Entry is already in that state.",
    );
  });

  it("rejects unknown transitions", () => {
    expect(transitionError(collection({}), "review", "draft")).toContain("not allowed");
  });

  it("rejects role-restricted transitions for unauthorized roles", () => {
    const def = collection({
      transitions: [{ from: "review", roles: ["role-editor"], to: "published" }],
    });
    expect(transitionError(def, "review", "published", { roleIds: ["role-viewer"] })).toContain(
      "not allowed",
    );
    expect(transitionError(def, "review", "published", { roleIds: ["role-editor"] })).toBeNull();
  });

  it("requires a comment when configured", () => {
    const def = collection({
      transitions: [{ commentRequired: true, from: "review", to: "rejected" }],
    });
    expect(transitionError(def, "review", "rejected", {})).toBe(
      "A comment is required for this transition.",
    );
    expect(transitionError(def, "review", "rejected", { comment: "Needs fixes." })).toBeNull();
  });
});

describe("historyOf", () => {
  it("filters malformed history entries", () => {
    expect(historyOf([{ from: "a", to: "b" }, null, "nope", { from: "x" }])).toEqual([
      { from: "a", to: "b" },
    ]);
  });

  it("returns an empty list for non-array values", () => {
    expect(historyOf(undefined)).toEqual([]);
    expect(historyOf("history")).toEqual([]);
  });
});

describe("transitionRecord", () => {
  it("records from/to/user/comment and a timestamp", () => {
    const record = transitionRecord("draft", "review", { comment: "Ready", user: "u1" });
    expect(record.from).toBe("draft");
    expect(record.to).toBe("review");
    expect(record.comment).toBe("Ready");
    expect(record.user).toBe("u1");
    expect(record.at).toBeTruthy();
  });

  it("treats a missing current state as draft", () => {
    expect(transitionRecord(undefined, "review").from).toBe("draft");
  });
});
