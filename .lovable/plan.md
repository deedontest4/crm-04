## Reply to Email — UI Cleanup Plan

Scope: only the **Reply mode** of `EmailComposeModal.tsx`. Compose (Single/Bulk) flows stay unchanged so existing campaign sending UX is preserved.

### Changes

1. **Hide sender email chip in header (reply mode)**
   - File: `src/components/campaigns/EmailComposeModal.tsx` (lines 1056–1068)
   - Wrap the `senderEmail` chip in `{!isReplyMode && senderEmail && (...)}` so `deepak.dongare@…` no longer shows on the reply dialog. The Preview button stays.
   - Sender info is still implicit (it's a reply from the logged-in user) and remains accessible in the full Compose modal.

2. **Shrink Recipient field & put it on the same row as Template**
   - File: lines 1086–1101 (reply branch) + 1257–1332 (subject/template row).
   - Restructure the reply layout into a 2-row grid:
     - Row 1: `Recipient` (read-only chip, `max-w-[260px]`) + `Template` selector beside it (`grid-cols-[minmax(0,260px)_1fr]`).
     - Row 2: `Subject` full-width.
   - For non-reply mode, keep the existing layout (Recipient full row, Subject + Template paired) untouched.

3. **Hide the `{…} vars` pill in reply mode**
   - File: lines 1263–1290.
   - Wrap the variable-insert `Popover` in `{!isReplyMode && (...)}`. Variables are a power-user feature for templated campaign sends; replies are typically free-form prose, so the pill clutters the reply UI. Insertion still works in compose mode.

4. **Hide "Use Preview to see merged output" hint in reply mode**
   - File: lines 1344–1346.
   - Wrap the helper `<span>` in `{!isReplyMode && (...)}`. The Preview button in the header already provides the action; the hint is redundant for replies.

### Additional small fixes & polish (reply mode)

5. **Reply dialog default size** — Current `sm:max-w-[560px] lg:max-w-[600px]` is fine; verify it still feels balanced after the row compaction. No change unless content overflows.

6. **Recipient chip readability** — Render the recipient as `Name <email>` with name bolded and email muted, inside a single-line truncating chip (currently it wraps awkwardly when names are long).

7. **Subject auto-focus on open in reply mode** — Replies almost always start with the cursor in the body, but if Subject is blank (rare), focus Subject; otherwise focus the body editor. Small ergonomic win, no logic change required beyond an effect on `open && isReplyMode`.

### Out of Scope
- No changes to Compose (Single/Bulk) layout.
- No changes to send logic, template substitution, attachments, or preview modal.
- No backend/database changes.

### Expected Result
The Reply modal matches the cleaner Outlook-style layout: compact header (no email chip), Recipient + Template side-by-side at a sensible width, Subject on its own line without the vars pill, and the body editor without the redundant Preview hint.
