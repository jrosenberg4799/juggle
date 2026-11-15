# Juggle prototype status — Version 2.3

Read the [real kitchen test](REAL-KITCHEN-TEST.md) for the current persistence receipt and tonight’s setup. The live backend remains one private workspace table. The proposed next structure is only restaurants, equipment and events.

The selected [One big next step](ONE-BIG-NEXT-STEP.md) design is the current interface. Local versus cloud-save state is explicit.

The [action-roadmap guide](ACTION-ROADMAP.md) describes the current registration → sweep → Manager handoff flow, contact fields and specialist requests.

The current release adds distinct Director, Manager and Subcontractor interfaces, a live-data Gantt schedule, guided room-by-room walkthroughs and CSV reports. Read [Version 2 guide](VERSION-2-GUIDE.md) for current instructions. The implementation notes below describe the underlying prototype architecture; original Administrator / Inspector / Contractor terminology maps to Director / Manager / Subcontractor.

## Home-kitchen proof of concept

Register a real appliance in **My home kitchen**, upload a photograph/nameplate, print its QR label, scan with a phone, and sign in with the same account. The record, inspection, repair and service history remain linked to the appliance. Print from the stable production hostname.

## Functional

- Responsive Kitchen White Next.js application, property/area/asset forms and dashboard.
- Supabase email/password authentication with confirmation email; one owner's workspace shared across their signed-in devices.
- Owner-only RLS on `prototype_workspaces`; optimistic revision checks prevent silent overwrites across devices. Reload before switching the active editing device.
- Private object storage for JPEG/PNG/WebP images and PDF files, 8 MB each. PostgreSQL stores file references only; a database constraint rejects inline/Base64 and local-only media.
- Expiring signed URLs generated for authorized media views, not persisted in records.
- Browser-local fictional demo with IndexedDB media when signed out. It remains separate from the real home-kitchen account.
- Property/asset QR destinations and printable QR labels.
- PDF floor-plan viewer plus a separate schematic equipment-position grid. Pins do not overlay PDF pages yet.
- One-off inspections, checklist/check-in, findings, condition and photograph capture.
- Manual triage, contractor assignment, repair evidence/invoice, administrator verification or return.
- Timestamped asset history with evidence references. Prototype JSON history is not a tamper-proof audit log.
- Calendar ICS handoff with requested seven-day, two-day and day-of alarms. Import and reminders depend on the calendar client.
- Explicitly simulated maintenance recommendations, with administrator approval.

## Simulated or deferred

- Administrator/inspector/contractor role switching is simulated within the workspace owner's account. Separate worker accounts and production role policies are not implemented.
- AI extraction, live manufacturer research and verified maintenance sources are not connected. The paid research endpoint deliberately returns 503.
- Automatic recurring occurrence generation, Google OAuth, synchronization and notifications.
- Client login, full normalized operational schema, PDF-page pin overlays, offline support and automatic orphan-file cleanup.
- Multi-user collaborative editing: one active editor at a time; conflicts are surfaced rather than merged.

## Database and storage

Project: `mwpavowhwzxczuxqfebw`. Applied migrations: `002_home_prototype.sql` and `003_prototype_conflict_detection.sql`. The earlier `docs/architecture-drafts/normalized-foundation.sql` is a **future, unapplied schema draft**, not part of the active prototype schema. Do not run the entire directory as an ordered migration suite without reconciling that draft first.

Bucket: `maintenance-evidence`, private, user-ID-prefixed object paths, owner-only upload/read policies. No service-role key is used by the application. Signing out retains local demo files; resetting workspace records retains cloud objects.

## Development and deployment

`npm ci`, `npm run dev`; validate with `npm run build` and `npm run typecheck`. Set the Supabase URL/publishable key from `.env.example` for the connected prototype. No OpenAI or Google secret is needed for the currently labeled demo features.

Vercel project `juggle`, team `j-1088`. Direct source deployment is used until the owner adds a GitHub login connection in Vercel. Source remains committed at `jrosenberg4799/juggle`.

In Supabase Authentication → URL Configuration, set the Site URL and allowed redirect URLs to the stable deployed HTTPS origin. Account creation sends a confirmation email; confirm, return to the application and sign in. If the redirect isn't configured yet, the confirmation may land on the default localhost URL; return manually and sign in after confirmation.

## Walkthrough

1. Sign in / create an account. The connected workspace begins with My home kitchen.
2. Register the refrigerator, upload its photograph, enter make/model from its nameplate.
3. Open Asset QR code → Print QR label. Scan on phone and sign in with the same account.
4. Add/approve a clearly simulated maintenance recommendation and schedule an inspection.
5. Switch to Inspector; submit checklist, photograph and an issue.
6. Switch to Administrator; assign repair to Sam.
7. Switch to Contractor; describe repair, attach photo/invoice, submit.
8. Switch to Administrator; verify and inspect Service history.

## Verification limits

Production compilation and TypeScript checks pass. Supabase migrations applied successfully and security advisor reported no findings. Schema constraints and private bucket configuration are checked separately. Browser, physical printer, phone-camera scan, account email-delivery and a full live upload walkthrough require hands-on verification; these are not claimed as tested.

## Live prototype

Stable production URL: https://juggle-mocha.vercel.app

Verified HTTP 200 on the production page and expected HTTP 503 on the deliberately disabled live-research endpoint. Anonymous Supabase REST reads returned no workspace rows; anonymous object listings exposed no media. Calendar serialization checked all three requested reminder alarms. The print, phone scan, confirmation-email and authenticated-upload walkthrough still needs the owner's hands-on test.
