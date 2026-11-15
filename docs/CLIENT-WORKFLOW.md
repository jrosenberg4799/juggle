<!-- Version 1 snapshot of the client discussion guide. -->

# Juggle: how the workflow works

Client walkthrough and working discussion guide • Prototype v0.1

The idea in one sentence

A shared equipment record connects a kitchen’s layout, maintenance needs, inspections, repairs and service history—so the maintenance director can see what needs attention and who is handling it.

## The workflow at a glance

Set up the kitchen → Register equipment → Review maintenance → Inspect → Assign repair → Verify → Keep the history

The equipment record is the thread through every step. A printed QR label takes the user back to that same record; it does not grant access by itself.

## A simple refrigerator example

Set up the space — Jesse creates the property and Kitchen area. An optional floor-plan PDF gives the team a reference for where equipment belongs.

Register the refrigerator — Add its name, make/model and photo. The asset record becomes its home for maintenance information. Print its QR label and attach it to the appliance.

Review the maintenance plan — Jesse reviews proposed tasks and decides what to schedule. The current prototype shows clearly labeled example recommendations. Future live research should cite manufacturer documentation or flag that manual research is needed.

Inspect the equipment — The inspector opens the asset, completes the checklist, records its condition and adds photos. A problem is sent to Jesse for review.

Assign and document the repair — Jesse assigns the issue to a technician. The technician records the work, attaches evidence and an optional invoice, then submits it for verification.

Verify and retain the history — Jesse accepts the work or returns it for correction. The inspection, repair evidence and decision remain linked to the original refrigerator record.

## How the interface is organized

Overview — “What needs my attention?” Properties, upcoming work, activity and items awaiting review.

Properties — “Where is everything?” Restaurant details, areas, the floor-plan PDF and equipment linked to the space.

Asset register — “What do we know about this appliance?” Equipment information, photos, QR label, maintenance plan and service history.

Maintenance — “What is planned?” Schedule an inspection and export a calendar event.

Inspections — “What did we find?” Complete checks, update condition, take photos and report issues.

Work orders — “What happens next?” Review issues, assign repairs, document the work and verify completion.

## Who does what

Jesse / maintenance director — Sets up records, approves plans, assigns work and verifies completion.

Inspector — Checks equipment and reports its condition with supporting observations and photos.

Technician — Completes assigned repairs and submits documentation for review.

For this prototype, these experiences are demonstrated by switching roles inside one owner’s account. Separate worker accounts and future client access are later steps.

## Our first real-world test: a home kitchen

Open https://juggle-mocha.vercel.app and create/confirm an account. Register one real appliance with a photo and make/model. Print its QR label, scan it on a phone, and sign in with the same account. Wait for “Saved to Supabase” before moving to the other device.

Walk the appliance through an inspection, a reported issue, a repair submission and Jesse’s verification. Success means the same equipment record and its history can be found again from the printed label.

## What we can demonstrate today

Connected records, account sign-in, photo/PDF uploads, printable QR labels, manual inspection and repair handoffs, and service history. Photos and PDFs live in private file storage; the database keeps references to those files.

Still illustrative or deferred: live AI identification/research, automatic recurring schedules, Google Calendar synchronization and automatic reminders, separate worker accounts, and client login. Calendar export is available; reminders depend on the calendar client. Equipment positions appear in a separate schematic grid, not as pins directly on PDF pages.

## Refine it together

Use the refrigerator walkthrough to identify friction before adding more features. Capture each change as: screen → user’s goal → what was unclear → proposed change → priority.

Which information does Jesse need to see first on Overview?

What is the minimum information needed to register an appliance?

Which checklist items and photographs make an inspection useful?

What evidence must a technician provide before Jesse can verify a repair?

Which next improvement matters most: simpler capture, live manufacturer research, calendar integration, or separate user access?

Decision log

Keep: ____________________

Change next: ____________________

Defer: ____________________

Owner / next review: ____________________

## A short way to explain it to the client

“We give each appliance a record and a QR label. Your team can find the equipment, see what maintenance is due, document an inspection, and hand a repair to a technician. You stay in control of approvals, and the evidence stays connected to the appliance. We’re testing that complete loop in a home kitchen first, then refining it around your team’s actual process.”



Source: [editable Google Doc](https://docs.google.com/document/d/1iNI3z4MrTZv1NbvoqT0WP5nYhvX4T16IklQMgKRBPM0/edit). This Markdown copy is versioned independently; later Doc edits do not sync automatically.

