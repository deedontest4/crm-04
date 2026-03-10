

## Email Reminders for Action Items via Microsoft Graph API

### Overview
Update the `daily-action-reminders` edge function to send email reminders via Microsoft Graph API to users with pending/overdue action items. Set up the cron job to trigger it every 15 minutes.

### Step 1: Store Microsoft Graph API Secrets
Add 4 secrets to Supabase:
- `AZURE_TENANT_ID` - Azure AD tenant ID
- `AZURE_CLIENT_ID` - App registration client ID  
- `AZURE_CLIENT_SECRET` - App registration client secret
- `AZURE_SENDER_EMAIL` - Sender mailbox (e.g., notifications@yourdomain.com)

### Step 2: Update Edge Function
**File: `supabase/functions/daily-action-reminders/index.ts`**

Enhance the existing function to:
1. Acquire an OAuth2 token from Azure AD using client credentials flow (`https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token`)
2. After inserting the in-app notification (existing behavior preserved), also send an email via Microsoft Graph API (`https://graph.microsoft.com/v1.0/users/{sender}/sendMail`)
3. Only send emails to users who have `email_notifications` enabled in their preferences
4. Fetch user email from the `profiles` table (`"Email ID"` column)
5. Build an HTML email with:
   - User's name greeting
   - Count of pending action items
   - Table listing each action item (title, due date, priority, status)
   - Overdue/high-priority highlights
   - Link to the CRM action items page
6. Track email send results in logs

Key logic flow:
```text
For each user with task_reminders enabled:
  1. Check timezone window & already-sent-today (existing)
  2. Fetch pending action items (existing)
  3. Insert in-app notification (existing)
  4. If email_notifications enabled AND user has email:
     → Send email via Graph API
  5. Update last_reminder_sent_at (existing)
```

### Step 3: Set Up Cron Job
Run SQL via the Supabase SQL editor to create a `pg_cron` job that invokes the edge function every 15 minutes:
```sql
SELECT cron.schedule(
  'daily-action-reminders',
  '*/15 * * * *',
  $$ SELECT net.http_post(
    url := 'https://nreslricievaamrwfrlx.supabase.co/functions/v1/daily-action-reminders',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer <anon_key>"}'::jsonb,
    body := '{"time":"' || now() || '"}'::jsonb
  ) AS request_id; $$
);
```

### Step 4: Deploy & Test
- Deploy the updated edge function
- Test with `curl_edge_functions` to verify it runs correctly
- Check logs for email delivery confirmation

### No Breaking Changes
- Existing in-app notification behavior is fully preserved
- Email sending is additive - only runs when `email_notifications` is enabled
- No database schema changes needed (all required columns already exist)

