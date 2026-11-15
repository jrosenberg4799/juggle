# Version 2.4 — Shared desktop, iPad and phone frame

## One frame on every screen

The header, role selector, save-status strip, page-title slot, content width, borders and primary-action rail are shared components. Opening equipment details or changing roles no longer brings back a different-width layout or a permanent sidebar. Tools open as a drawer over the page.

The save strip reserves two text lines for loading, saving, success and failure. Loading and cloud-error content render inside the existing frame. Page titles have a bounded slot, and long names truncate there while the equipment record retains the full name. Scrollbar space is reserved to reduce horizontal movement.

## Shared controls

`components/workspace-ui.tsx` provides WorkspaceHeader, SaveStatus, PageTitle, Panel, ActionBar, PageLoading and viewport handling. `app/workspace.css` owns geometry and responsive tokens; page components own workflow behavior.

Back stays on the left and the primary action on the right. First-step Back is disabled but keeps its slot. Registration, capture, Manager handoff, inspection checks/review, assigned work, requests, sign-in and setup dialogs use the shared rail. Dialog rails remain within the dialog instead of covering the whole app. Cancel/Close/Back controls never submit forms.

## Responsive behavior

- Desktop/iPad: maximum 1024px frame, 24px content gutters, shared centered header/status/title/action alignment; two-column forms where space permits.
- Phone below 768px: 16px gutters, one-column forms, stacked inspection choices, a fixed bottom action rail and larger native input text to avoid focus zoom.
- Short landscape windows: compact shared header/title/status geometry, keeping room for the task.
- Camera notches/home indicators: safe-area spacing applies to shared rails and dialogs.
- Keyboard: visual viewport changes are observed; the primary action becomes part of the scrollable form when the keyboard is open rather than covering inputs.
- Gantt and wide tables scroll inside their own containers, rather than widening the page.
- Modal/drawer opening locks background scrolling; closed tools are inert, and Escape closes overlays.

## Verification

19 tests pass, including four shared-component contract tests, plus production build and TypeScript checks. Existing data, ownership policies, cloud read-back and private media storage are preserved; no database changes were made.

Automated browser/device tooling is unavailable in this workspace. The following hands-on checks remain pending: iPad portrait/landscape (744/768/820/1024px), phones (320/390/430px), short phone landscape, keyboard opening, long names, upload failure, rotation, camera capture and QR printing. CSS responsiveness is implemented; physical-device behavior is not claimed as verified.
