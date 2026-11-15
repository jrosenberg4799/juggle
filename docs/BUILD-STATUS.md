# First-pass MVP status

## Functional in browser-local demo mode
- Responsive Kitchen White interface, navigation and administrator/inspector/contractor demo role switch.
- Properties, client names, areas, equipment registration and condition changes.
- Image and PDF file reading, persisted with records in localStorage (8 MB individual upload limit; browser total storage quota may be lower).
- PDF display plus a separate schematic equipment-position grid. Pins are not yet overlaid on PDF pages.
- Property/asset QR generation and URL destinations. QR records created locally cannot be opened on another device until shared database persistence is wired.
- One-off inspection scheduling, check-in, checklist, findings and photos.
- Manual issue triage, contractor assignment, repair photograph/invoice submission, return and verification.
- Actor/timestamp activity history. Local history is editable via browser tools; it is not a production audit ledger.
- Downloadable ICS event handoff with seven-day, two-day and day-of display alarms. Import and notifications depend on the calendar client. No Google synchronization.
- Clearly labeled simulated recommendations and administrator approval.

## Not yet connected
- Supabase authentication, database persistence and private storage adapters. Dependency and fail-closed foundation migration are supplied; this is not production-ready RBAC.
- AI image extraction and source-backed internet research. API route intentionally responds 503 rather than offering an unauthenticated paid API.
- Automatic recurrence generation, Google OAuth, live reminders, cross-device records.
- On-plan PDF pin overlay, multi-page positioning and drag-to-place editing.

## Agreed scope
Online only; one Jesse-managed calendar; manual review before assignment and repair verification; fictional restaurant for sales demonstration; future client login. No payments, offline sync, CAD/3D, automatic compliance claims or granular permission editor.

## Local development
`npm ci`, then `npm run dev`. Validate using `npm run build` and `npm run typecheck`.

## Vercel
Import `jrosenberg4799/juggle` as a Next.js project. Root is repository root. Default build `npm run build`; Vercel detects Next.js output. No secrets are required to run the browser-local demo. Environment variables in `.env.example` are reserved for the next integration pass; setting them alone does not activate integrations.

Supabase project selected by owner: `mwpavowhwzxczuxqfebw` (`https://mwpavowhwzxczuxqfebw.supabase.co`). No keys have been retrieved or committed. Apply `supabase/001_foundation.sql` only to a development project. This migration deliberately blocks writes to operational tables until assignment-specific policies and adapters are completed and tested; do not treat it as a finished backend.

## Demo script
1. As Jesse, add a property, area and refrigerator photo.
2. Open the equipment record, show its QR and maintenance tab.
3. Add a simulated recommendation, approve, schedule an inspection.
4. Switch to Inspector. Check checklist items, describe a problem and select Report an issue.
5. Switch to Administrator. Assign the issue to Sam from Work orders.
6. Switch to Contractor. Document repair, attach photograph/invoice, submit.
7. Switch to Administrator. Verify; open asset Service history.

## Verification
Production build and TypeScript checks passed on the first implementation. Browser end-to-end verification remains pending available browser tooling. External integrations have not been validated.
