## Fix: Send campaign email from logged-in user (not the shared mailbox)

### Root Cause

In `supabase/functions/send-campaign-email/index.ts` (line 593), the primary call to `sendEmailViaGraph` is:

```ts
sendEmailViaGraph(
  accessToken,
  mailboxEmail,   // ← shared mailbox (AZURE_SENDER_EMAIL = crm@realthingks.com)
  ...
  senderEmail,    // ← logged-in user as From override (deepak.dongare@…)
  ...
)
```

`sendEmailViaGraph` posts to `https://graph.microsoft.com/v1.0/users/{senderMailbox}/sendMail` where `senderMailbox = fromEmail || senderEmail`. So today the request always targets the **shared mailbox** (`crm@realthingks.com`) using the user as a "From" override. That requires `Mail.Send` on the shared mailbox AND Send-As permissions for the user. When Microsoft 365 denies it, the error you see is exactly:

> Microsoft 365 denied mailbox send access for crm@realthingks.com.

The fallback block also targets `mailboxEmail` — so both attempts hit the shared mailbox. The user's own mailbox (`deepak.dongare@…`) is never tried.

### Fix

Make the **primary** send use the logged-in user's own mailbox (no `fromEmail` override). Keep the existing shared-mailbox path strictly as a **fallback** for when the user mailbox is denied. Net effect:

- Recipient sees `From: deepak.dongare@realthingks.com` (the logged-in user) by default.
- Only if the app registration lacks `Mail.Send` on the user mailbox does it fall back to the shared mailbox.

### Edit

**File:** `supabase/functions/send-campaign-email/index.ts` — lines 593–606 (the first `sendEmailViaGraph` call).

Change argument 2 from `mailboxEmail` → `senderEmail`, and argument 7 from `senderEmail` → `undefined`. The fallback block (612–634) stays unchanged — it still retries via `mailboxEmail` if the user mailbox is denied.

```ts
// BEFORE
let result = await sendEmailViaGraph(
  accessToken,
  mailboxEmail,             // shared mailbox
  ...,
  senderEmail,              // From override
  ...
);

// AFTER
let result = await sendEmailViaGraph(
  accessToken,
  senderEmail,              // user's own mailbox
  ...,
  undefined,                // no override — From = mailbox owner
  ...
);
```

### Verification

After redeploy:
1. Logged in as `deepak.dongare@realthingks.com`, send a campaign reply.
2. Recipient's inbox shows From: `deepak.dongare@realthingks.com`.
3. Server log line `Sending campaign email from user mailbox: …` is followed by a Graph 202 (success) instead of 403/ErrorAccessDenied.
4. If `Mail.Send` is not granted on the user mailbox, the existing fallback retries via `crm@realthingks.com` and the toast shows "Sent as <shared mailbox>".

### Required Microsoft 365 Admin Action (informational, not code)

For the fix to actually deliver from the user's mailbox, the Azure app registration needs `Mail.Send` application permission scoped to allow sending as the individual user mailboxes. If that's not granted, the fallback still works via the shared mailbox — same behavior as today, just with the user mailbox tried first.

### Out of Scope

- No UI changes.
- No DB or schema changes.
- No changes to `azure-email.ts` (the helper already supports both modes).
- No changes to follow-up runner (`campaign-follow-up-runner`) — it intentionally uses the shared mailbox for unattended automation; only manual sends route via the user.
