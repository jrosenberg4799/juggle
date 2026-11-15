# Selected design: One big next step

Version 2.2 implements the selected design direction from the five-option comparison.

## What the user sees

- One active task and one prominent blue Next action.
- A compact three-step Director setup strip: Register restaurant → Capture equipment → Assign Manager.
- A short registration form, with optional phone/floor-plan fields collapsed.
- Save restaurant & get QR opens the actual restaurant QR. The QR dialog includes Next: capture equipment.
- Once equipment exists, Finish equipment capture & assign Manager becomes the primary action; adding another appliance is secondary.
- Detailed records, later workflow actions, Gantt scheduling and Director decisions remain available behind expandable sections or Tools.
- The main workspace no longer has a permanently visible sidebar or duplicated introductory headings.
- Manager checks retain large condition choices and the clear Save & next action. Specialist requests and reports remain available.

## Color and status

Blue means the next action. Green confirms a save or completion. Amber means local-only/not yet saved or a pending state. Red identifies failed saves or genuinely overdue Director decisions; the app does not invent urgent examples for real accounts.

The storage banner distinguishes LOCAL DEMO / NOT SYNCED, SIGNED IN / NOT SAVED YET, SAVING TO CLOUD, CLOUD SAVED, and SAVE FAILED. An authenticated session alone is not labeled as a saved cloud record. A failed save keeps the failure state until reload instead of showing a false saving state after later edits.

Photos/PDFs are still stored in private Supabase Storage when signed in, and as local IndexedDB files when signed out. SQL stores file references only. No database or file-storage migration is required for this design change.

## Prototype boundaries

Interface switching remains a prototype selector inside one account. Independent worker permissions, live AI research and automated calendar synchronization remain outside this version. Browser/physical device verification is still pending available browser tooling. Existing workspace data, file references and prior version tags are preserved.

## Review script

Open https://juggle-mocha.vercel.app and select Director. Look for the three-step strip and single blue action. Save a restaurant, open its QR, continue to capture, then assign the Manager. Switch to Manager to test the guided equipment checks. Check the storage banner before trying the same QR on another device.
