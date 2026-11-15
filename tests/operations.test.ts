import { test } from "node:test";
import assert from "node:assert/strict";
import { seed, State, Task, Walkthrough, calendarFile } from "../lib/model";
import {
  addDays,
  csvCell,
  dayDistance,
  submitWalkthrough,
  taskTransition,
} from "../lib/operations";
const fresh = () => structuredClone(seed);
test("only the assigned worker starts preventive service; Director approves completion", () => {
  let state = fresh();
  const id = "preventive-demo";
  assert.throws(
    () => taskTransition(state, id, "Manager", "In progress"),
    /not available/,
  );
  assert.throws(
    () => taskTransition(state, id, "Director", "Verified"),
    /not available/,
  );
  state = taskTransition(state, id, "Subcontractor", "In progress");
  assert.throws(
    () =>
      taskTransition(state, id, "Subcontractor", "Awaiting verification", {
        repair: "Finished",
      }),
    /photograph/,
  );
  state = taskTransition(state, id, "Subcontractor", "Awaiting verification", {
    repair: "Recorded service performed",
    evidence: "storage://owner/photo.jpg",
  });
  assert.equal(
    state.tasks.find((t) => t.id === id)?.status,
    "Awaiting verification",
  );
  assert.throws(
    () => taskTransition(state, id, "Subcontractor", "Verified"),
    /not available/,
  );
  state = taskTransition(state, id, "Director", "Verified");
  assert.equal(state.tasks.find((t) => t.id === id)?.status, "Verified");
  assert.equal(state.events[0].actor, "Jesse · Director");
  assert.ok(
    state.events.some((e) => e.evidence === "storage://owner/photo.jpg"),
  );
});
test("repair needs a Director decision; returned work retains the correction", () => {
  let state = fresh();
  const id = "issue-demo";
  assert.throws(
    () => taskTransition(state, id, "Subcontractor", "In progress"),
    /not available/,
  );
  state = taskTransition(state, id, "Director", "Assigned");
  state = taskTransition(state, id, "Subcontractor", "In progress");
  state = taskTransition(state, id, "Subcontractor", "Awaiting verification", {
    repair: "Work documented",
    evidence: "storage://owner/repair.jpg",
  });
  assert.throws(
    () => taskTransition(state, id, "Director", "Assigned"),
    /Explain/,
  );
  state = taskTransition(state, id, "Director", "Assigned", {
    returnReason: "Add the final test reading",
  });
  assert.equal(
    state.tasks.find((t) => t.id === id)?.returnReason,
    "Add the final test reading",
  );
  assert.equal(state.tasks.find((t) => t.id === id)?.status, "Assigned");
});
function round(): Walkthrough {
  return {
    id: "round",
    propertyId: "mercer",
    assetIds: ["refrigerator", "range"],
    startedAt: new Date().toISOString(),
    answers: {},
  };
}
test("walkthrough cannot submit blank checks or unexplained issues", () => {
  const state = fresh();
  state.walkthroughs = [round()];
  assert.throws(() => submitWalkthrough(state, "round"), /every/);
  state.walkthroughs[0].answers = {
    refrigerator: { result: "Needs attention", note: "" },
    range: { result: "Okay", note: "" },
  };
  assert.throws(() => submitWalkthrough(state, "round"), /Explain/);
});
test("walkthrough creates reviewable issues and retains readings/photos; cannot duplicate submit", () => {
  let state = fresh();
  const r = round();
  r.answers = {
    refrigerator: {
      result: "Needs attention",
      note: "Unusual cooling",
      reading: "Displayed reading recorded",
      photo: "storage://owner/check.jpg",
    },
    range: { result: "Okay", note: "Visual check complete", careDone: true },
  };
  state.walkthroughs = [r];
  const initial = state.tasks.length;
  state = submitWalkthrough(state, "round");
  assert.equal(state.tasks.length, initial + 1);
  assert.equal(state.tasks.at(-1)?.status, "Issue reported");
  assert.ok(state.walkthroughs![0].submittedAt);
  assert.ok(
    state.events.some((e) => e.evidence === "storage://owner/check.jpg"),
  );
  assert.equal(
    state.tasks.find((t) => t.id === "inspection-demo")?.status,
    "Awaiting verification",
  );
  assert.throws(() => submitWalkthrough(state, "round"), /already submitted/);
});
test("Gantt date arithmetic works across months and daylight-saving dates", () => {
  assert.equal(addDays("2026-01-30", 3), "2026-02-02");
  assert.equal(dayDistance("2026-03-07", "2026-03-09"), 2);
  assert.equal(addDays("2026-11-02", -3), "2026-10-30");
});
test("CSV protects spreadsheet formulas and escapes quotes", () => {
  assert.equal(csvCell("=SUM(A1:A2)"), '"\'=SUM(A1:A2)"');
  assert.equal(csvCell('A "quoted" note'), '"A ""quoted"" note"');
});
test("calendar handoff uses the responsible role and requested reminders", () => {
  const task = seed.tasks.find((t) => t.id === "preventive-demo")!;
  const text = calendarFile(
    task,
    seed.assets.find((a) => a.id === task.assetId)!,
  );
  assert.match(text, /Assigned to: Subcontractor/);
  for (const minutes of [10080, 2880, 0])
    assert.match(text, new RegExp(`TRIGGER:-PT${minutes}M`));
});
