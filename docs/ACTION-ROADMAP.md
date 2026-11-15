# Version 2.1 — Action-first restaurant roadmap

## The next action is the main interface

The Director starts with six clickable stages:

1. **Register restaurant.** Save the name, address, owner/company and main contact. Link an optional floor-plan PDF. A stable restaurant QR destination is available immediately; creating a new restaurant opens its printable QR label.
2. **First documentation sweep.** Add rooms, photograph/register equipment and enter make/model. Equipment additions return to the sweep rather than dropping the user into a database page. Missing photos remain visible. Mark the initial sweep complete when at least one approved asset is present and registration details are complete.
3. **Assign the Manager.** Enter the Manager's name and first visit date. Save four weekly inspection dates. These are finite scheduled visits, not an infinite recurrence engine.
4. **Run weekly inspections.** Open the Manager's walkthrough interface. The Manager sees the assigned dates, proceeds room by room, and submits observations and issues.
5. **Request specialist work.** The Manager requests a repair or preventive service. The Director reviews and assigns it. A preventive request stays preventive when assigned; a breakdown is not required.
6. **Review and close.** The Director reviews submitted work, accepts it or returns it with a correction, and keeps the equipment history.

The Director's Gantt chart is available under schedule details, below the roadmap. The primary screen emphasizes the current step and its next button. Full equipment records remain accessible for deeper review, with a return-to-roadmap action.

## Roles and visibility

- Director: setup, documentation, Manager handoff, all restaurant work and approval decisions. Buttons can preview the lower-level interfaces.
- Manager: weekly walkthrough, simple care, specialist requests and progress of subcontractor work. Seeing a subcontractor job does not grant the Manager its start/complete/approval actions.
- Subcontractor: assigned specialist work, completion evidence and submission to the Director.

The interface selector still simulates roles within one owner's authenticated workspace. Independent worker logins and server-enforced organizational permissions remain deferred.

## Data and storage

Restaurant information is currently stored as a logical restaurant record in the existing account-scoped Supabase JSON workspace, including owner/contact details, floor-plan reference, sweep completion and inspection assignment. A separate normalized SQL restaurant table has not been introduced by this UI change. The intended data model remains restaurant → rooms/equipment → events. Media bytes stay in private object storage; SQL stores references.

Existing records are preserved. Older restaurants without contact details start at registration and can complete those fields without recreating equipment. Existing Version 1 and Version 2 Git tags remain unchanged.

## Verification

Ten automated tests cover workflow authorization, evidence/correction requirements, inspection validation, date handling, calendar export, CSV safety, registration completeness, weekly handoff dates and preventive-request assignment. Production build and TypeScript checks pass. Browser/phone/physical QR-print walkthroughs remain a hands-on verification step; automated browser tooling is unavailable in this workspace.
