import {
  Asset,
  CheckAnswer,
  Event,
  Role,
  State,
  Task,
  Walkthrough,
  uid,
} from "./model";
export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function addDays(day: string, n: number) {
  const d = new Date(day + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function dayDistance(a: string, b: string) {
  return Math.round(
    (Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000,
  );
}
export const taskOwner = (t: Task): "Manager" | "Subcontractor" =>
  t.owner ||
  (["Assigned", "In progress", "Awaiting verification"].includes(t.status) &&
  t.repair !== undefined
    ? "Subcontractor"
    : t.status === "Assigned"
      ? "Subcontractor"
      : "Manager");
export const taskKind = (t: Task) =>
  t.kind ||
  (t.status === "Issue reported" || t.repair ? "Repair" : "Inspection");
export function stage(t: Task) {
  return {
    Scheduled: "Planned",
    "Issue reported": "Needs Director decision",
    Assigned: "Ready to start",
    "In progress": "Work in progress",
    "Awaiting verification": "Director review",
    Verified: "Complete",
  }[t.status];
}
export function taskTransition(
  state: State,
  id: string,
  role: Role,
  next: Task["status"],
  extra: Partial<Task> = {},
): State {
  const task = state.tasks.find((t) => t.id === id);
  if (!task) throw Error("This job no longer exists.");
  const allowed =
    role === "Director"
      ? (task.status === "Issue reported" && next === "Assigned") ||
        (task.status === "Awaiting verification" &&
          ["Verified", "Assigned"].includes(next))
      : taskOwner(task) === role &&
        ((["Scheduled", "Assigned"].includes(task.status) &&
          next === "In progress") ||
          (task.status === "In progress" && next === "Awaiting verification"));
  if (!allowed) throw Error("This action is not available at this stage.");
  if (next === "Awaiting verification" && !extra.repair?.trim())
    throw Error("Describe the work you completed.");
  if (
    next === "Awaiting verification" &&
    role === "Subcontractor" &&
    !extra.evidence
  )
    throw Error("Add a photograph of the completed work.");
  if (
    task.status === "Awaiting verification" &&
    next === "Assigned" &&
    !extra.returnReason?.trim()
  )
    throw Error("Explain what needs to be corrected.");
  const changed = {
    ...task,
    ...extra,
    status: next,
    ...(next === "In progress" ? { startedAt: new Date().toISOString() } : {}),
    ...(next === "Verified" ? { completedAt: new Date().toISOString() } : {}),
    ...(task.status === "Issue reported"
      ? {
          owner: "Subcontractor" as const,
          kind: task.kind || ("Repair" as const),
          startDate: dateKey(),
          date: task.date < dateKey() ? dateKey() : task.date,
        }
      : {}),
  };
  const event: Event = {
    id: uid(),
    assetId: task.assetId,
    text: `${task.title}: ${stage(changed)}${extra.repair ? " — " + extra.repair : ""}${extra.returnReason ? " — " + extra.returnReason : ""}`,
    actor:
      role === "Director"
        ? "Jesse · Director"
        : role === "Manager"
          ? "Alex · Manager"
          : "Sam · Subcontractor",
    time: new Date().toISOString(),
    evidence: extra.evidence,
    invoice: extra.invoice,
  };
  return {
    ...state,
    tasks: state.tasks.map((t) => (t.id === id ? changed : t)),
    events: [event, ...state.events],
  };
}
export function submitWalkthrough(state: State, id: string): State {
  const round = state.walkthroughs?.find((r) => r.id === id);
  if (!round || round.submittedAt)
    throw Error("This walkthrough is already submitted or unavailable.");
  if (
    !round.assetIds.length ||
    round.assetIds.some((id) => !round.answers[id]?.result)
  )
    throw Error("Check every listed appliance before submitting.");
  if (
    round.assetIds.some(
      (id) =>
        round.answers[id].result !== "Okay" && !round.answers[id].note.trim(),
    )
  )
    throw Error(
      "Explain anything that needs attention or could not be checked.",
    );
  const now = new Date().toISOString();
  const events: Event[] = round.assetIds.map((assetId) => {
    const a = round.answers[assetId];
    return {
      id: uid(),
      assetId,
      actor: (round.managerName || "Alex") + " · Manager",
      time: now,
      text: `Weekly walkthrough: ${a.result}${a.reading ? " · Reading: " + a.reading : ""}${a.careDone ? " · Routine care recorded" : ""}${a.note ? " — " + a.note : ""}`,
      evidence: a.photo,
    };
  });
  const issues: Task[] = round.assetIds
    .filter((id) => round.answers[id].result === "Needs attention")
    .map((assetId) => ({
      id: uid(),
      assetId,
      title: "Review reported equipment problem",
      date: dateKey(),
      kind: "Repair",
      owner: "Subcontractor",
      status: "Issue reported",
      notes: round.answers[assetId].note,
      evidence: round.answers[assetId].photo,
    }));
  return {
    ...state,
    walkthroughs: state.walkthroughs!.map((r) =>
      r.id === id ? { ...r, submittedAt: now } : r,
    ),
    assets: state.assets.map((a) => {
      const answer = round.answers[a.id];
      return answer && answer.result !== "Not checked"
        ? {
            ...a,
            condition: answer.result === "Okay" ? "Good" : "Needs attention",
          }
        : a;
    }),
    tasks: [
      ...state.tasks.map((t) =>
        round.assetIds.includes(t.assetId) &&
        taskOwner(t) === "Manager" &&
        taskKind(t) === "Inspection" &&
        t.status === "Scheduled" &&
        t.date <= dateKey()
          ? {
              ...t,
              status: "Awaiting verification" as const,
              repair:
                "Completed in room-by-room walkthrough; see inspection report.",
            }
          : t,
      ),
      ...issues,
    ],
    events: [...events, ...state.events],
  };
}
export function csvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
