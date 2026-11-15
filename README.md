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

See [current build status and deployment instructions](docs/BUILD-STATUS.md) for exactly what works, which integrations are simulated or unconnected, known limitations, and the walkthrough. The foundation SQL is intentionally fail-closed and is not a completed production backend.
