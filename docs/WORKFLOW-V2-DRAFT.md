# Juggle workflow — Version 2 planning draft

Status: planning draft with the core role handoffs confirmed by the product owner. Screen designs and data mappings remain proposals; no app or database changes are made in this planning pass. Version 1 remains preserved at Git tag `v1.0.0`.

## Explain it simply

Think of Juggle as a notebook for a restaurant.

The Director writes down what the restaurant owns and makes a plan to care for it. The Manager walks around each week to check that things are okay. The Subcontractor does the specialist work. Everyone adds their notes and photos to the same notebook.

The notebook remembers what happened to each appliance, even when the people doing the work change.

## Three people, three starting screens

| Person | Their main question | Proposed starting screen | Main actions |
| --- | --- | --- | --- |
| Director | Are our restaurants being looked after? | Restaurants and decisions needing attention | Set up restaurants, rooms and equipment; approve care plans; review problems; assign specialist work; approve completion |
| Manager | What should I check or do this week? | This week's kitchen checks | Walk through rooms; record equipment condition and readings; add photos; report problems; complete agreed simple care tasks |
| Subcontractor | What work have I been asked to do? | My assigned jobs | Open the equipment record; perform preventive service or repair; describe work; attach evidence and invoice; submit for review |

These are three views of the same information, not three separate databases. Future client access is outside this draft's first implementation.

## The main journey

1. **Director: make the kitchen notebook.** Add a restaurant, its address and contact details. Add rooms, an optional floor-plan PDF, and the equipment in each room.
2. **Director: give each appliance a label and a care plan.** Add its photo and make/model, print its QR label, and review the proposed maintenance tasks. If reliable guidance is unavailable, mark the plan for manual research.
3. **Manager: do the weekly walk.** Open this week's checklist and go room by room. For each item, choose okay, needs attention, or not checked. Record any required readings, photos and notes.
4. **If there is a problem: send it for a decision.** The Director reviews the finding and decides what work is needed. Reporting a problem does not automatically order work.
5. **Subcontractor: do the assigned job.** Read the task and relevant equipment history, perform the work, and submit notes and photos.
6. **Director: check the result.** Approve completion or return it for correction. The Manager may supply observations, but the Director makes the final approval decision.
7. **Keep the story.** The equipment record shows the checks, problems, preventive care, repairs and approvals over time.

## Two reasons for work

**Keep it working — preventive maintenance.** The refrigerator is still working, but an approved service task is due. The Director assigns the job, the appropriate person performs it, and the result is reviewed. A breakdown or failed inspection is not required to create this job.

**Fix a problem — corrective repair.** The Manager notices the refrigerator is not cooling properly. They record the observation. The Director reviews it, assigns a repair, and reviews the completed work.

Both paths end at the same appliance history. A care plan is the instruction; a scheduled job is one occasion on which that instruction must be performed; an event records what actually happened.

## Three levels of information

| Level | Simple meaning | Examples |
| --- | --- | --- |
| 1. Restaurant | The place | Name, address, client, contacts, assigned staff, floor-plan reference |
| 2. Rooms and equipment | What is inside the place | Kitchen, bar, refrigerator, stove, equipment photo, make/model, QR identifier, care plan |
| 3. Equipment events | What happened, who did it, and when | Inspection, temperature reading, reported problem, preventive service, repair, evidence and approval |

A client can own several restaurants. A restaurant has several rooms. Each piece of equipment belongs to a room and can have many events. Every equipment event points back to that equipment; restaurant and room context are found through its record. Room-level inspections can group checks for several appliances.

## Where photographs and documents live

Use private Supabase Storage for photos, manuals, invoices and floor plans. This is object storage separate from the SQL database. Store only each file's path/reference and metadata in SQL, with a link to the relevant restaurant, equipment or event. Generate authorized viewing links when needed.

The current prototype already uses Supabase Auth, an account-scoped workspace document and private file storage. The proposed restaurant/room/equipment/event tables are a later refinement, not the current normalized schema. Independent Director, Manager and Subcontractor accounts and permissions still need implementation.

## Proposed interface changes

- Replace Administrator / Inspector / Contractor terminology with Director / Manager / Subcontractor.
- Give each person a different starting screen with one clear next action.
- Put a short explanation above each main action: what to do, why, and what happens next.
- Give Managers a guided weekly walkthrough rather than a list of unrelated work-order cards.
- Make “Schedule preventive care” and “Report a problem” separate, obvious actions.
- Use readable job stages: Needs review → Assigned → In progress → Ready for review → Complete. Returned work shows what needs correction.
- Keep the equipment record as the common home for its photos, care plan and history.

These stages are proposed workflow labels; they do not describe additional behavior already implemented.

## Confirmed decisions

1. The Manager follows one guided room-by-room weekly walkthrough.
2. The Director assigns subcontractors and approves completed work.
3. Managers handle agreed simple care, such as cleaning and recording temperatures. Subcontractors handle specialist preventive service and repairs.
4. Managers can add missing equipment as a draft for Director review before activation.

## Planned next step

Design the Director, Manager and Subcontractor starting screens around these confirmed decisions. Define a small editable starter checklist and one preventive-service example, then review those screen flows before changing the database. Exact checklist readings and any pass/fail limits must come from an approved plan, not invented manufacturer guidance. Use `SYSTEM-ARCHITECTURE-DRAFT.xlsx` to review the proposed information structure and role handoffs.
