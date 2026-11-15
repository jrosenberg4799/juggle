# Juggle — Cocozza Maintenance OS (MVP)

An iPad-first, QR-enabled restaurant maintenance traceability prototype.

## Goal

Demonstrate the complete lifecycle of one restaurant's facilities information: **setup → capture → identify → schedule → inspect → repair → verify**.

## Core concept

A lightweight building information model for ongoing restaurant operations. Each property contains areas, each area contains assets, and every inspection, photograph, maintenance recommendation, work order and invoice is linked to the appropriate record.

## User roles

- **Administrator / Maintenance Director (Jesse):** onboard properties, upload plans, register areas and assets, issue QR labels, review AI maintenance recommendations, schedule and assign work, verify completion.
- **Inspector / Operator:** scan property QR, check in, complete recurring walkdowns, add equipment photos, flag issues.
- **Subcontractor / Technician:** access authorized assigned jobs, scan asset QR, update work, upload photos, reports and invoices, submit for verification.

## Demonstration sequence

1. Create a restaurant property and upload a 2D floor plan (optional).
2. Create an area such as Kitchen, register an asset, and upload equipment/nameplate photos.
3. Generate a persistent site QR and an asset-specific QR linking to role-gated database records.
4. Use AI to extract equipment identifiers, research available manufacturer manuals, and **suggest** source-backed maintenance tasks. A human approves tasks and frequencies.
5. Schedule a recurring inspection, assign the operator, and optionally link a Google Calendar event.
6. Inspector scans, checks in, photographs equipment, and reports a repair need.
7. Technician opens the assigned work order, records work and attaches photos/invoice.
8. Administrator verifies completion; immutable historical service records remain linked to the asset.

## MVP screens

1. Property dashboard
2. Site setup and floor-plan/area browser
3. Asset capture, QR code and AI research
4. Maintenance schedules and assignments
5. Mobile inspection/check-in
6. Technician work order and verification history

## Proposed stack

- Next.js + TypeScript + Tailwind CSS; responsive for desktop/iPad/phone
- Inter font; **Kitchen White** design direction (white, porcelain, stainless gray, charcoal; restrained bronze/sage accents)
- Supabase Postgres + Auth + Storage with role-based access controls and row-level security
- QR creation with generated URLs/opaque identifiers; QR does **not** contain private asset data or grant public access
- Server-side OpenAI integration for equipment identification and research (keys never exposed to the browser)
- Internal scheduling as the system of record; Google Calendar integration as a later synchronization step

## Data model (conceptual)

- users and property memberships/roles
- properties
- areas
- assets
- media/documents (linked to property, area, asset, inspection, or service event)
- maintenance plans and occurrences
- inspections
- work orders and assignments
- service events, evidence and approvals
- QR identifiers and access/audit events

## MVP boundaries

This is a **2D information twin**, not 3D BIM/CAD. Do not implement payments, automated compliance certification, complex dispatch, or enterprise billing in v0.1. Use fictional restaurant data for the public demo.

## Important implementation rules

- Every photo, QR scan, assignment, service completion and document is attributable to a record and user.
- Keep historical service events rather than overwriting history.
- Separate AI guesses from manufacturer-verified source references; never auto-approve suggested frequencies or legal compliance obligations.
- Require authentication and authorization for site/asset records, even when reached by scanning a printed QR code.
- Keep API keys in environment variables; commit an `.env.example`, never secrets.

## Development priority

1. Bootstrap UI and persistence
2. Property → area → asset setup, layout uploads and QR generation
3. Working inspection and technician evidence flow
4. AI-assisted maintenance recommendations and schedule approval
5. Calendar integration, dashboards and demonstration polish

The primary objective is a demonstrable end-to-end operational loop, not feature completeness.

## Running the first-pass application

The repository now contains an interactive Next.js demo. Run `npm ci` and `npm run dev`; `npm run build` produces the production application. No credentials are required for the browser-local demo.

See [current build status and deployment instructions](docs/BUILD-STATUS.md) for exactly what works, which integrations are simulated or unconnected, known limitations, and the walkthrough. The normalized foundation draft is retained for future architecture; see the current build status for the active account-scoped prototype schema.

## Home-kitchen proof of concept and media storage

The first real-world test is the product owner's home kitchen: register an appliance, upload its photograph/nameplate, print its permanent QR label, scan on a phone, and use the same signed-in account to inspect or document maintenance.

**Never store image/PDF binary data or Base64 in PostgreSQL.** Store files in the private Supabase Storage `maintenance-evidence` bucket (object storage separate from SQL). Database records contain only object-path references and metadata. Resolve those references into short-lived signed links for authorized viewing; do not persist expiring signed URLs. Storage objects are scoped to the authenticated account's user-ID prefix.

Signed-in prototype records persist in the account-scoped `prototype_workspaces` table under owner-only RLS. The prototype keeps the workflow document in JSONB for speed; its schema explicitly rejects inline media. The normalized tables in `docs/architecture-drafts/normalized-foundation.sql` are a future architecture foundation and are not required or applied for this prototype. The live setup uses `002_home_prototype.sql` and subsequent prototype migrations. Role switching is still simulated within the owner's account; individual inspector/contractor security is not yet enabled.

Without Supabase configuration or without signing in, records remain local and files live in IndexedDB, with references in localStorage. This local demo cannot share QR records across devices. Signing in starts a separate home-kitchen workspace and does not automatically import fictional/local records. Existing legacy Base64 demo uploads are migrated to IndexedDB references locally.

### Connected prototype setup

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the publishable key is supported). Apply the prototype migrations to the selected development project. In Supabase Authentication → URL Configuration, set the Site URL and allow the deployed HTTPS application origin for confirmation redirects. Create an account using the app, confirm the email, then sign in on both devices. Passwords and sessions use Supabase Auth; no service-role key is used or exposed.

The first prototype supports one active editor at a time; changes made on multiple devices should be separated by reloading the record. QR labels must use the final stable production hostname rather than localhost or an ephemeral preview deployment. Photos/PDFs are limited to JPEG, PNG, WebP and PDF, up to 8 MB each. Deleting/resetting records retains uploaded objects for now; no automatic object cleanup is performed.
