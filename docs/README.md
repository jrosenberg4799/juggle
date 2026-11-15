# Project documents

Keep project explanations, specifications, diagrams and exported office documents in this folder and commit them alongside the relevant changes.

| File | Purpose |
| --- | --- |
| `REAL-KITCHEN-TEST.md` / `.docx` | Current real-data test, verified saves and storage behavior |
| `SQL-STRUCTURE-PREVIEW.xlsx` | Two-tab export of the simple three-table Google Sheet |
| `ONE-BIG-NEXT-STEP.md` / `.docx` | Selected Version 2.2 interface and save-status behavior |
| `ACTION-ROADMAP.md` / `.docx` | Current Version 2.1 registration, first sweep, Manager handoff and specialist-request flow |
| `VERSION-2-GUIDE.md` / `.docx` | Current Version 2 operator walkthrough and limitations |
| `CLIENT-WORKFLOW.md` | Version 1 client workflow snapshot |
| `CLIENT-WORKFLOW-V1.docx` | Word export of the original Google Doc |
| `WORKFLOW-V2-DRAFT.md` | Authoritative editable source for the proposed simpler workflow |
| `WORKFLOW-V2-DRAFT.docx` | Word rendering of that planning draft |
| `SYSTEM-ARCHITECTURE-DRAFT.xlsx` | Proposed three-level data structure, roles and open decisions |
| `BUILD-STATUS.md` | Current implemented functionality and limitations |
| `VERSIONING.md` | Git workflow and baseline policy |

Drafts are proposals, not approved requirements. Regenerate Word exports after editing their Markdown source. Google Docs edits and local exports do not synchronize automatically. Record accepted decisions in the Markdown source and commit them. Small project documents belong in Git; operational equipment photos and customer uploads belong in private object storage, not this repository.

The local folder is `/workspace/juggle` in the Codex cloud workspace. Push commits to GitHub after meaningful changes; synchronization is explicit, not a background folder-sync service. Preserve the original `v1.0.0` tag.
