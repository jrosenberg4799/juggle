import { test } from "node:test";
import assert from "node:assert/strict";
import { registrationComplete, weeklyDates } from "../lib/journey";
import { seed } from "../lib/model";
import { taskTransition } from "../lib/operations";
test("restaurant registration requires its stable details and a contact channel", () => {
  const p = {
    ...seed.properties[0],
    ownerName: "Restaurant owner",
    contactName: "Site manager",
    contactEmail: "manager@example.com",
  };
  assert.equal(registrationComplete(p), true);
  assert.equal(registrationComplete({ ...p, contactName: "" }), false);
  assert.equal(registrationComplete({ ...p, contactEmail: "" }), false);
  assert.equal(
    registrationComplete({ ...p, contactEmail: "", contactPhone: "555-0100" }),
    true,
  );
});
test("Manager handoff generates four weekly visits across calendar boundaries", () => {
  assert.deepEqual(weeklyDates("2026-12-21"), [
    "2026-12-21",
    "2026-12-28",
    "2027-01-04",
    "2027-01-11",
  ]);
  assert.throws(() => weeklyDates("not-a-date"), /valid/);
});
test("Director assignment preserves a Manager preventive-service request as preventive work", () => {
  const state = structuredClone(seed);
  state.tasks.push({
    id: "request",
    assetId: "refrigerator",
    title: "Preventive service request",
    date: "2026-12-01",
    kind: "Preventive care",
    owner: "Subcontractor",
    status: "Issue reported",
    notes: "Request service before a breakdown",
  });
  assert.throws(
    () => taskTransition(state, "request", "Manager", "Assigned"),
    /not available/,
  );
  const next = taskTransition(state, "request", "Director", "Assigned");
  assert.equal(next.tasks.at(-1)?.kind, "Preventive care");
  assert.equal(next.tasks.at(-1)?.owner, "Subcontractor");
  assert.equal(next.tasks.at(-1)?.status, "Assigned");
});
