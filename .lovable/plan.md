
# Campaign Module — Deep Audit & Fix Plan

## 0. Blocking build error (must fix first)

`supabase/functions/email-skip-report/index.ts:224` fails Deno type-check:

```
return new Response(new Blob([pdfBytes], { type: "application/pdf" }), …)
```

`Uint8Array<ArrayBufferLike>` no longer satisfies `BlobPart` under the current Deno toolchain. **Every other edge function fails to type-check as a side effect** (the build aborts on the first error). This is why the build-errors panel lists all 24 functions.

**Fix:** return the bytes directly — `Response` accepts `Uint8Array` as `BodyInit`:

```ts
const pdfBytes = await pdfDoc.save();
return new Response(pdfBytes, {
  status: 200,
  headers: {
    ...corsHeaders,
    "Content-Type": "application/pdf",
    "Content-Length": String(pdfBytes.byteLength),
    "Content-Disposition": `attachment; filename="…"`,
  },
});
```

(If the Blob wrapper is wanted later, copy into a fresh buffer: `new Blob([new Uint8Array(pdfBytes)], …)` — but the direct return is simpler and removes one allocation.)

---

## 1. Audit results vs your 14-point spec

Legend: ✅ implemented · ⚠ partial / has bug · ❌ missing

| # | Requirement | Status | Notes |
|---|---|---|---|
| 1 | Campaign definition | ✅ | `campaigns` table + Strategy mart |
| 2 | Goal / Audience / Message / Channel / Timing | ✅ | 4-flag mart (`message_done/audience_done/region_done/timing_done`) gates Activate |
| 3 | Audience = Accounts + Contacts, segmented | ⚠ | Accounts+contacts linked, region/country filters work; **personas table exists but is unused** in audience selection — segmentation by role/industry/size is manual |
| 4 | Templates per segment / region / channel | ⚠ | `campaign_email_templates.audience_segment` + phone scripts exist; UI does **not** map templates to segments at send time (manual pick) |
| 5 | Multi-channel execution | ✅ | Email / Call / LinkedIn rows in `campaign_communications` |
| 6 | Email lifecycle + threading | ⚠ | Sent/Opened/Replied/Failed tracked; **bounced** column missing on `campaign_communications` (only on `email_history`); reply mapping via `check-email-replies` works |
| 7 | Follow-up automation | ⚠ | `campaign_follow_up_runner` **enqueues a `pending` row but nothing dispatches it.** See §2. |
| 8 | Timing rules (start/end window) | ✅ | Auto-completes when end date passes; `campaign_timing_windows` exists for sub-windows |
| 9 | Engagement status flow | ✅ | `Not Contacted → Contacted → Responded → Qualified` derived in `campaignUtils.deriveAccountStatus` and `overviewMetrics.getFunnel` |
| 10 | Tasks generated from campaign | ⚠ | Manual via `CampaignActionItems`; no auto-task on "no reply after N days" |
| 11 | Convert to Deal at Lead stage | ✅ | `CampaignContacts` + `CampaignAccountsContacts` insert deal with `stage:"Lead"` and `source_campaign_contact_id` |
| 12 | Analytics | ✅ | `get_campaign_aggregates_v2` RPC, funnel, channel/template breakdowns |
| 13 | Data integrity | ⚠ | `contacts.account_id` linkage is **not enforced** (contacts table has `company_name` text only — no FK to accounts); `campaign_contacts.account_id` is set on insert but can drift |
| 14 | Traceability | ✅ | `useCRUDAudit` + `useSecurityAudit` covers create/update/delete |

---

## 2. Bugs & gaps to fix

### 2.1 Follow-up dispatcher is a no-op (HIGH)
`campaign-follow-up-runner` inserts a `delivery_status: 'pending'` row with `sent_via: 'follow_up_automation'`, but nothing reads that queue and calls `send-campaign-email`. Result: the cron runs every 5 min, queue grows, **zero emails are actually sent**.

**Fix:** at the end of the runner, for each freshly-inserted pending row, invoke `send-campaign-email` via `supabase.functions.invoke('send-campaign-email', { body: {...} })` using the rule's `created_by` user (service-role auth + `x-impersonate-user` header pattern), then update the queued row's `delivery_status` to `sent`/`failed`. Alternatively add a separate `process-campaign-followups` function called from the same cron after the runner.

### 2.2 Follow-up "stop on reply" race (MEDIUM)
The runner skips parents with any inbound row in the same `conversation_id`, but a reply that arrives **after** the runner's reply-check and **before** the dispatcher sends will still get a follow-up. Mitigation: re-check `delivery_status='received'` for the conversation_id immediately before dispatch.

### 2.3 Bounce tracking on campaign emails (MEDIUM)
Funnels & dashboards count `delivery_status='failed'` as failures, but Microsoft Graph delivery reports / NDRs aren't pulled into `campaign_communications`. `email_history` has `bounced_at`/`bounce_reason` but `campaign_communications` doesn't.

**Fix:** add `bounced_at timestamptz`, `bounce_type text`, `bounce_reason text` columns and update `check-email-replies` to detect mailer-daemon / `failed delivery` subjects and write them.

### 2.4 Audience segmentation isn't wired (MEDIUM)
`campaign_audience_personas` table exists but no UI creates or applies personas. `campaign_email_templates.audience_segment` + `campaign_phone_scripts.audience_segment` are free-text strings never matched against contact attributes.

**Fix (phase 1 — small):** add a Persona dropdown on `EmailComposeModal` / template picker that filters templates whose `audience_segment` matches the campaign-contact's tagged segment. **Phase 2 (later):** persona criteria → SQL filter for "Add Contacts/Accounts" modal.

### 2.5 Contact ↔ Account integrity (MEDIUM)
`contacts` has only a free-text `company_name` — there's no FK to `accounts.id`. `campaign_contacts.account_id` is captured at add time, but later edits to the contact's company won't propagate. Several views (`hasDeal`, account funnel) silently mis-attribute.

**Fix (non-breaking):** add a nullable `contacts.account_id uuid` (no FK to avoid mass-update breakage), backfill via name match, then change "Add contact to campaign" to require an account selection.

### 2.6 No "stop outreach after end_date" enforcement (MEDIUM)
`EmailComposeModal` and call/linkedin loggers don't block sends after `campaign.end_date`. The campaign is auto-marked `Completed` only when the user opens the detail page. A scheduled `send-campaign-email` invocation can still fire.

**Fix:** in `send-campaign-email/index.ts`, load the campaign and reject with `409 campaign_ended` if `end_date < today` or `status IN ('Completed','Paused')`.

### 2.7 Reply rate denominator inconsistency (LOW)
- Dashboard uses `replied_threads / email_threads`.
- Analytics tab uses `replied_threads / total_emails (Sent+Replied+Failed)` (CampaignDashboard line 294).
The two numbers diverge whenever there are failed sends.

**Fix:** standardize on `replied_threads / outbound_threads` everywhere (already the rule in `overviewMetrics.getOutreachCounts`).

### 2.8 `campaign_follow_up_rules.template_id` has no FK (LOW)
A template can be deleted while a rule still references it; runner silently skips. Add `ON DELETE SET NULL` FK + UI warning when template is missing.

### 2.9 Performance: `distinctTouches` query caps at 5000 rows (LOW)
`CampaignDashboard.tsx:244` `.limit(5000)` will silently undercount once a workspace passes 5k campaign comms. Replace with a server-side `count(distinct …)` RPC, or paginate.

### 2.10 `campaign_timing_windows` is unused (LOW)
Table exists; no UI surfaces it. Either wire into Strategy → Timing as sub-windows, or drop the table.

### 2.11 No "task auto-generated on conversion" (LOW)
Spec §10 says campaign should generate tasks (e.g. "follow-up call after no reply"). Today only manual tasks via `CampaignActionItems`. Add a trigger: on `campaign_contacts.stage` change to `Responded`, insert an `action_items` row "Schedule discovery call".

### 2.12 Slug collision (LOW)
`slugify(campaign_name)` is used as the URL but two campaigns named "Q1 Outreach" produce identical slugs. Either persist `slug` (column exists, currently nullable / unenforced) with a unique index, or fall back to `id` on collision.

---

## 3. Files to change

**Critical (unblocks everything):**
- `supabase/functions/email-skip-report/index.ts` — return `pdfBytes` directly

**High value (follow-up actually works):**
- `supabase/functions/campaign-follow-up-runner/index.ts` — dispatch via `send-campaign-email` and reconcile status
- `supabase/functions/send-campaign-email/index.ts` — guard against ended/paused campaigns

**Medium:**
- Migration: add `bounced_at`, `bounce_type`, `bounce_reason` to `campaign_communications`; add `contacts.account_id`; add unique index on `campaigns.slug`; FK on `campaign_follow_up_rules.template_id`
- `supabase/functions/check-email-replies/index.ts` — detect & write bounces
- `src/components/campaigns/CampaignDashboard.tsx` — use consistent reply-rate formula; replace 5000-row cap with RPC
- `src/components/campaigns/EmailComposeModal.tsx` — block send when campaign ended

**Lower priority (UX polish):**
- Persona dropdown wiring in `EmailComposeModal` / template picker
- Trigger on `campaign_contacts.stage → Responded` to auto-create action item

---

## 4. Out of scope for this pass

- Building a persona-criteria builder UI (large feature)
- Replacing `contacts.company_name` text with a hard FK (data-migration heavy)
- Wiring `campaign_timing_windows` to scheduling logic

These are flagged but won't be touched unless you ask.

---

## 5. Suggested execution order

1. **Patch the build** (`email-skip-report` Response wrapper) — unblocks every other edge function deploy.
2. **Make follow-ups send** (runner dispatch + send guard).
3. **Add bounce columns + capture** in `campaign_communications`.
4. **Reply-rate / 5k-row** dashboard fixes.
5. **Slug uniqueness** + integrity touch-ups.
6. Persona wiring + auto-task trigger if you want to go further.

Approve this and I'll execute steps 1–5 in one go, then check in before tackling 6.
