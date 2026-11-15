# Changelog

## Version 2.3 — verified real kitchen persistence (v2.3.0)

- Initialize/load a real private workspace on sign-in; preserve existing data.
- Read back each cloud save and verify both revision and contents before showing Cloud saved.
- Show a receipt with saved time, appliance count and unique file-reference count.
- Verify private file viewing access after upload; keep file bytes outside SQL.
- Stop on cloud-load errors instead of falling back into a demo; add a manual Save now & verify action.
- Simplify SQL preview to two tabs / three planned app tables; no schema rewrite for tonight.
- Create/read back the owner’s empty home-kitchen starter record; no equipment or images invented.
- 15 automated tests plus production build; browser/phone upload and physical QR checks remain manual.


## Version 2.2 — One big next step (v2.2.0)

- Apply the selected guided design: three compact setup steps, one bold primary action, optional fields/details collapsed.
- Open the restaurant QR after registration, with a direct Next: capture equipment action.
- Hide the permanent sidebar in operational views; keep Tools and detailed records accessible.
- Use blue for action, green for confirmation, amber for unsynced/pending and red for overdue decisions or failed saves.
- Distinguish a signed-in session from an actually saved cloud workspace; retain failed-save status until reload.


## Version 2.1 — action-first roadmap (v2.1.0)

- Six-step Director roadmap with one primary action per stage.
- Restaurant owner/contact fields, linked floor plan and immediate printable QR after registration.
- Dedicated first-sweep screen; equipment capture returns to the sweep.
- Manager handoff with four saved weekly visit dates shown in the schedule.
- Explicit Manager requests for repair or preventive specialist service; subordinate work progress is visible without granting worker actions.
- Gantt and database details moved behind the main workflow.
- Ten workflow tests and production-build validation; browser/device checks remain pending.


## Version 2 — operator workflows (v2.0.0)

- Distinct Director, Manager and Subcontractor interfaces with a visible working selector and level/context labels.
- Live-data 14-day Gantt schedule, task ownership, start/finish dates, date editing and job drill-down.
- Guided room-by-room Manager walkthrough with saved drafts, photos/readings and explicit problem reporting.
- Manager equipment submissions awaiting Director approval; active walkthroughs exclude draft equipment.
- Preventive care and repair jobs with start, evidence submission, Director approval and correction stages.
- Operating and inspection CSV reports with formula escaping; calendar-event handoff retained.
- Existing Supabase records and V1 data preserved; role permissions remain prototype-only.
- Seven workflow tests plus production-build/TypeScript validation. Hands-on browser/device verification remains pending.


## Version 1 — prototype baseline (v1.0.0)

First saved prototype for client review and the home-kitchen proof of concept.

- Property, area and equipment records, photos, PDF uploads and printable QR labels.
- Supabase account sign-in, account-scoped persistence and private object storage; SQL stores file references only.
- Inspection, issue review, repair assignment, evidence submission, verification and asset history.
- Calendar-event export and clearly labeled simulated maintenance recommendations.
- Client workflow guide and refinement questions saved in `docs/CLIENT-WORKFLOW.md`.

This tag identifies the first reviewable prototype, not completion of the production product. Separate worker permissions, live AI research, recurring automation and Google Calendar synchronization remain deferred. See `docs/BUILD-STATUS.md` for verification limits.

## Next changes

Record future changes in logical commits. Add a new version entry and tag when the next reviewable milestone is ready; retain the v1.0.0 tag as the original baseline.
