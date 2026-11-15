# Tonight: save one real kitchen

## Keep the data model small

Planned app structure: **restaurants → equipment → events**. Rooms are labels. Repairs, inspections, readings, preventive work and approvals are event records. Photos/PDFs live in private Supabase Storage; database records contain their paths.

Tonight uses the **one existing private prototype_workspaces table**. The three-table structure is a preview for review, not an applied migration. No new app tables were added.

Google Sheet (two tabs): https://docs.google.com/spreadsheets/d/1HEAdhmE8GHEaUbTc3Gyn3b713qUthZKBx0pYfIpFJoY/edit

## What has actually been saved

An empty “My home kitchen” starter workspace was created for the project's sole confirmed account. It was saved using the existing authenticated-role save function and read back from PostgreSQL. It contains one placeholder kitchen record, zero appliances and zero files. No physical equipment details or photos were invented.

A separate rollback-only database test verified saving, exact read-back and owner isolation. This tests the database function/policies; it is not a claim of a completed browser/phone walkthrough.

## The test

1. Open https://juggle-mocha.vercel.app, refresh and sign in with the same confirmed account.
2. Enter your real kitchen name, address and contact information. Save.
3. Confirm **CLOUD SAVED** and the read-back revision beneath it.
4. Add your actual refrigerator and its nameplate/photo. Photos go to the private `maintenance-evidence` bucket; the saved database state holds the file reference.
5. Wait for the new read-back receipt. It should show one appliance and at least one file reference.
6. Print/open the asset QR on a phone. Sign in with the same account. Confirm the real appliance and photograph load.
7. Complete an inspection and reopen the equipment history.

If the banner says LOCAL DEMO, the data is only on that device. If a cloud workspace cannot load, the app stops with a retry screen rather than silently opening a demo. If a save fails, keep the tab open; Account & storage → Save now & verify in Supabase can retry without silently overwriting another device's changes.

## What “verified” means in the app

After each cloud save, the app reads the same row back, checks its revision and compares its actual data with the submitted data. Only then does it show CLOUD SAVED. The receipt counts appliance records and unique cloud-file references; it is not a separate SQL row count for normalized tables.

After an image/PDF upload, the app also requests an authorized short-lived viewing link before returning its durable storage reference. Expiring signed URLs are not persisted in SQL.

## Boundaries

Independent worker roles remain simulated within the owner's account. The proposed three-table normalization, AI research and live Google Calendar synchronization are not part of tonight's connection pass. No database schema change was needed.

15 automated tests and production build/TypeScript checks cover the current workflow and receipt logic. Real camera upload, email sign-in on another device and physical QR printing need the owner's hands-on test.

Supabase reported one nonblocking Auth hardening item: leaked-password protection is disabled. Guidance: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
