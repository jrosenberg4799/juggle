import { test } from "node:test";
import assert from "node:assert/strict";
import { seed, State } from "../lib/model";
import {
  sameWorkspace,
  receiptFor,
  verifySavedWorkspace,
  ReadbackError,
} from "../lib/cloud-receipt";
test("read-back compares actual values independent of PostgreSQL JSON key order", () => {
  const a = structuredClone(seed);
  const b = JSON.parse(JSON.stringify(a));
  b.properties[0] = Object.fromEntries(
    Object.entries(b.properties[0]).reverse(),
  );
  assert.equal(sameWorkspace(a, b), true);
  b.properties[0].name = "Another kitchen";
  assert.equal(sameWorkspace(a, b), false);
});
test("receipt rejects missing rows, stale versions and mismatched records", () => {
  const state = structuredClone(seed);
  assert.throws(() => verifySavedWorkspace(state, 2, null), /not match/);
  assert.throws(
    () =>
      verifySavedWorkspace(state, 2, {
        data: state,
        revision: 1,
        updated_at: new Date().toISOString(),
      }),
    /not match/,
  );
  const changed = structuredClone(state);
  changed.assets[0].name = "Other fridge";
  assert.throws(
    () =>
      verifySavedWorkspace(state, 2, {
        data: changed,
        revision: 2,
        updated_at: new Date().toISOString(),
      }),
    /not match/,
  );
});
test("cloud receipt counts unique storage files rather than duplicated references", () => {
  const state = structuredClone(seed);
  state.assets[0].photo = "storage://owner/photo.jpg";
  state.events[0].evidence = "storage://owner/photo.jpg";
  state.events[0].invoice = "storage://owner/invoice.pdf";
  const receipt = verifySavedWorkspace(state, 3, {
    data: state,
    revision: 3,
    updated_at: "2026-11-15T12:00:00Z",
  });
  assert.equal(receipt.files, 2);
  assert.equal(receipt.equipment, 3);
  assert.equal(receipt.restaurants, 1);
  assert.equal(receipt.revision, 3);
});
test("undefined optional fields survive JSON transport without a false mismatch", () => {
  const state = structuredClone(seed);
  state.assets[0].photo = undefined;
  const parsed = JSON.parse(JSON.stringify(state));
  assert.equal(sameWorkspace(state, parsed), true);
});
test("failed read-back retains the committed revision for a safe retry", () => {
  const error = new ReadbackError("Read-back failed", 7);
  assert.equal(error.committedRevision, 7);
  assert.equal(error.name, "ReadbackError");
});
