# Five action-first interface directions

Status: design alternatives for review. No production interface changes made in this comparison.

## Shared rules

- One obvious primary next-action button.
- Plain language, a visible actor and a small number of steps.
- High-contrast blue for the main action; red only for real urgent/overdue items; amber for due/unsynced states; green for confirmation.
- Show local-only versus cloud-saved status explicitly. A signed-in account is not proof that a record or photo has been saved.
- Keep full equipment details, file references and history behind one expandable record view.
- Preserve restaurant → room/equipment → events as the information structure.

## The five directions

1. **One big next step:** one active task, short progress strip, one large Next button. Recommended default for first-time setup.
2. **Traffic light:** urgent decisions first, today's action second, completed work third. Suitable for an active Director with several kitchens; avoid showing invented urgency on an empty new account.
3. **Job ticket:** one field task on a bold work ticket, with a step number and handoff at the bottom. Strong candidate for Manager/Subcontractor field screens.
4. **Now, next, done:** a visible action queue. The current lane contains the only actionable form; later work is a preview.
5. **Guided route:** a vertical process map beside the current step, with clear completed/current/upcoming labels.

The conversation comparison lets reviewers switch among the five designs, preview Director/Manager/Subcontractor roles, try the sample Next buttons, and expand illustrative database details. Its data is fictional and it performs no real writes or uploads.

## Supabase verification at this review

The connected project is `mwpavowhwzxczuxqfebw`. Direct database checks found one confirmed account that has signed in, zero saved prototype workspaces and zero files in the private `maintenance-evidence` bucket. This verifies authentication activity and bucket configuration, not a completed end-to-end save/upload.

Signed-in app uploads are configured for private Supabase Storage, with object references in SQL. Signed-out demo uploads go to local IndexedDB and cannot be opened from another device. The next persistence check should save a real restaurant and photograph while signed in, confirm the workspace/object counts, and reopen the same record on another device. Do not claim successful image sync until that check passes.
