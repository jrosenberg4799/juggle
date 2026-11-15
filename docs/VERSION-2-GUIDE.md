# Version 2 — The operator workflow

Version 2 uses three clearly labeled interfaces. Use the **Interface** dropdown at the top to switch between them. This is still a prototype role selector inside one authenticated owner's workspace; it is not a production permission switch or independent worker login.

## Director: set up, plan, decide

Start on the Director board. The location selector identifies the restaurant, and the level banner says you are overseeing the restaurant.

1. Set up restaurants, rooms and equipment. Print an appliance's QR label from its record.
2. Schedule work: choose equipment, work type, responsible role, start/finish dates and instructions.
3. Read the Gantt schedule. Each row names the job and person responsible. Each bar spans the saved planned dates. Use the arrows to change weeks; select a bar or job label to open the job. Dates can be edited from job details; bars are not draggable and no dependencies are inferred.
4. Review the decision queue: approve Manager-proposed equipment, review walkthroughs, assign reported repairs, and approve or return completed work. A return requires a correction note.

Preventive work can be assigned before equipment breaks. A reported problem does not become an assigned repair until the Director decides.

## Manager: one appliance at a time

The Manager starts on **Weekly walkthrough**.

1. Choose the restaurant and press **Start weekly walkthrough** (or Continue).
2. Follow the room sequence. The screen shows the room, appliance and check number.
3. Choose **Okay**, **Needs attention**, or **Not checked**. Explain a problem or an item you could not check. Add an optional photo/reading and record simple care already approved for that appliance.
4. Press **Save & next appliance**. Draft checks persist in the current workspace. Save & leave lets you return later.
5. Review the final checks and send the walkthrough to the Director. Problems enter the Director's decision queue. The report retains observations, readings and photo references.

Managers can also submit missing equipment for Director approval. Pending equipment is excluded from active walkthroughs. Separately assigned simple-care jobs use Start → Work → Send for review. Director review is retained for both Manager and Subcontractor completed jobs in this prototype.

Use **Export report (CSV)** for the operating schedule and equipment condition. Show the inspection reports and choose **Export inspection findings** for walkthrough observations, readings and care records.

## Subcontractor: only the assigned work

Start on **Assigned jobs**. Each job shows its work type, equipment, owner, due date and stage.

1. Open the assigned preventive-service or repair job.
2. Read its instructions and equipment history; press **Start work**.
3. Describe what was done, add a required completion photograph and optional invoice.
4. Send the work to the Director. It stays in review until the Director approves or returns it for correction.

## Job stages

Planned / Ready to start → Work in progress → Director review → Complete.

Reported problems begin at **Needs Director decision**. Inspection walkthrough review does not automatically close reported repair issues.

## Storage and existing data

Signed-in records continue using the existing account-scoped Supabase workspace and private object storage. PostgreSQL holds file references, not image/PDF bytes. New optional task fields and walkthroughs are stored in the existing JSON workspace; no database migration or data reset is required. Existing V1 tasks receive default ownership/type interpretation when those fields are absent.

Existing user records are preserved. To see the expanded V2 fictional examples, use **Reload sample kitchen** only while signed out; this explicitly replaces the local demo records. Signed-in account reset is separately labeled and asks for confirmation.

## What remains outside this version

Independent worker accounts and server-enforced role permissions, live AI research, automatic weekly recurrence, manufacturer-specific checklists/pass-fail thresholds, Google Calendar synchronization, PDF-page pin overlays, and multi-editor merging. Calendar-event export is a handoff, not synchronization. No compliance or equipment-safety rules are invented.

## Verification

Seven automated tests cover assignment restrictions, preventive/repair handoffs, correction and evidence requirements, walkthrough validation and duplicate submission, date arithmetic, spreadsheet-formula escaping, and calendar handoff. Production compilation and TypeScript checks pass. Browser automation is unavailable in this workspace; tablet/phone interaction, camera, printed labels and real signed-in uploads still need hands-on checks.
