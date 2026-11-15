import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  ActionBar,
  WorkspaceHeader,
  SaveStatus,
  PageTitle,
  PageLoading,
} from "../components/workspace-ui";
const noop = () => {};
test("all interfaces share the same header slots and accessible role selector", () => {
  for (const role of ["Director", "Manager", "Subcontractor"] as const) {
    const html = renderToStaticMarkup(
      createElement(WorkspaceHeader, {
        role,
        onRole: noop,
        onTools: noop,
        onHome: noop,
        toolsOpen: false,
      }),
    );
    assert.match(html, /class="shared-app-header"/);
    assert.match(html, /class="header-content"/);
    assert.match(html, /aria-label="Change interface"/);
    assert.match(html, /aria-controls="workspace-tools"/);
    assert.match(html, new RegExp('<option selected="">' + role + "</option>"));
  }
});
test("Back keeps its slot at the first step and never submits a form", () => {
  const first = renderToStaticMarkup(
    createElement(ActionBar, {
      backDisabled: true,
      children: createElement(
        "button",
        { type: "submit", className: "primary" },
        "Next",
      ),
    }),
  );
  const later = renderToStaticMarkup(
    createElement(ActionBar, {
      onBack: noop,
      children: createElement(
        "button",
        { type: "submit", className: "primary" },
        "Next",
      ),
    }),
  );
  for (const html of [first, later]) {
    assert.match(html, /class="action-bar-content"/);
    assert.match(html, /type="button" class="secondary shared-back"/);
    assert.match(html, /class="shared-next"/);
    assert.match(html, /type="submit" class="primary"/);
  }
  assert.match(first, /disabled=""/);
  assert.doesNotMatch(later, /disabled=""/);
});
test("loading, local, saving, failure and saved statuses retain the same two text slots", () => {
  for (const [ready, cloud, status] of [
    [false, false, "Local demo"],
    [true, false, "Local demo"],
    [true, true, "Saving…"],
    [true, true, "Not saved — reload required"],
    [true, true, "Saved to Supabase"],
  ] as const) {
    const html = renderToStaticMarkup(
      createElement(SaveStatus, {
        ready,
        cloud,
        status,
        receipt: null,
        onAccount: noop,
        onReset: noop,
      }),
    );
    assert.match(html, /class="save-status-content"/);
    assert.match(html, /class="save-status-copy"/);
    assert.match(html, /role="status" aria-live="polite"/);
    assert.match(html, /shared-account/);
    assert.match(html, /storage-options/);
  }
});
test("page title and loading body render inside shared boundaries", () => {
  const title = renderToStaticMarkup(
    createElement(PageTitle, {
      eyebrow: "Manager",
      title: "A long appliance name that must not widen the frame",
      subtitle: "Kitchen",
      action: createElement("button", {}, "Add"),
    }),
  );
  assert.match(title, /shared-page-title/);
  assert.match(title, /page-title-action/);
  const loading = renderToStaticMarkup(createElement(PageLoading));
  assert.match(loading, /shared-panel page-loading/);
  assert.match(loading, /role="status"/);
});
