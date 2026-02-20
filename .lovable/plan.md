

# Remove Leads Module and Consolidate into Deals Lead Stage

## Summary

All 14 lead records are already "Converted" (existing as deals), so no data migration is needed. The focus is on:
1. Removing the Leads module from navigation and routes
2. Replacing the Lead Name dropdown with a fast Contact Name dropdown (handling 4,400+ contacts)
3. Updating all system references (backups, imports/exports, notifications, action items, etc.)

---

## Phase 1: Create ContactSearchableDropdown (New File)

**File:** `src/components/ContactSearchableDropdown.tsx`

The current `LeadSearchableDropdown` fetches from the `leads` table (only 14 records). The new `ContactSearchableDropdown` must handle 4,400+ contacts efficiently.

**Key design decisions (modeled after AccountSearchableDropdown which is fast):**
- Fetch ALL contacts on mount (no pagination limit -- use Supabase's full fetch)
- Use `useMemo` for client-side filtering (no server round-trips on each keystroke)
- Fetch fields: `id, contact_name, company_name, position, email, phone_no, region`
- On select, return the full contact object so the form can auto-fill related fields
- Popover width matches trigger width (`w-[--radix-popover-trigger-width]`)
- Include clear (X) button like AccountSearchableDropdown

**Why this is fast:** The Account dropdown (631 records) loads all data upfront and filters in memory. We apply the same pattern but need to handle the 1,000-row Supabase default limit by paginating the initial fetch.

```
Contact selected -> auto-fills:
  lead_name       <- contact_name
  customer_name   <- company_name
  region          <- region (if available)
```

---

## Phase 2: Update FormFieldRenderer.tsx

1. Replace `LeadSearchableDropdown` import with `ContactSearchableDropdown`
2. Update the `lead_name` field case to use `ContactSearchableDropdown`
3. Rename label from "Lead Name" to "Contact Name" in `getFieldLabel`
4. Update `handleLeadSelect` -> `handleContactSelect`:
   - Auto-fill `lead_name` from `contact.contact_name`
   - Auto-fill `customer_name` from `contact.company_name`
   - Auto-fill `region` from `contact.region`
   - Fetch lead_owner display name from `contact.contact_owner` (not `created_by`)
5. Update `fetchLeadOwners` to query `deals` table instead of `leads` table
6. Add `onAccountSelect` callback to `AccountSearchableDropdown` to auto-fill `region` when account is selected (only if region is currently empty)

---

## Phase 3: Update AccountSearchableDropdown.tsx

Add optional `onAccountSelect` prop that returns the full account object:
```typescript
onAccountSelect?: (account: Account) => void;
```
Call it in `handleSelect` alongside `onValueChange`. This lets the form auto-fill `region` from the account data.

---

## Phase 4: Update LeadStageForm.tsx

- Change the label from "Lead Stage" to "Lead Stage" (keep same)
- The fields list stays: `['project_name', 'lead_name', 'customer_name', 'region', 'lead_owner', 'priority']`
- `lead_name` now renders as "Contact Name" (label change is in FormFieldRenderer)

---

## Phase 5: Remove Leads Module from Navigation

### 5a. `src/App.tsx`
- Remove `import Leads from "./pages/Leads"`
- Replace the `/leads` route with a redirect: `<Route path="/leads" element={<Navigate to="/deals" replace />} />`
- Remove `/leads` from `controlledScrollRoutes` (optional cleanup)

### 5b. `src/components/AppSidebar.tsx`
- Remove `{ title: "Leads", url: "/leads", icon: UserPlus }` from `menuItems`
- Remove `UserPlus` from the lucide import

---

## Phase 6: Update NotificationBell.tsx

Change all lead-related navigation to redirect to `/deals`:
- `notification.module_type === 'leads'` -> navigate to `/deals`
- `notification.lead_id` -> navigate to `/deals`
- `notification.notification_type === 'lead_update'` -> navigate to `/deals`

---

## Phase 7: Update ActionItemsTable.tsx

The action items table has a case for `normalizedType === 'lead' || normalizedType === 'leads'` that fetches from the `leads` table and opens a `LeadModal`. Update this to:
- Navigate to or show the deal instead (since all leads are now deals)
- Or simply remove the lead-specific modal case and treat lead module_type action items as informational

---

## Phase 8: Update useModuleRecords.tsx

The `leads` case queries `supabase.from('leads')`. Update:
- Change the `leads` case to query `deals` table where `stage = 'Lead'`
- Use `deal_name` as the name field

---

## Phase 9: Update Backup System

### 9a. `src/components/settings/BackupRestoreSettings.tsx`
- Remove `{ id: 'leads', name: 'Leads', icon: FileText, color: 'text-blue-500' }` from `MODULES` array
- Remove `leads` from `fetchModuleCounts` tables array

### 9b. `supabase/functions/create-backup/index.ts`
- Keep `leads` in `BACKUP_TABLES` (preserves archived data in backups)
- Remove `leads` from `MODULE_TABLES` (no separate "Leads" module backup button)

---

## Phase 10: Update Import/Export System

### 10a. `src/hooks/import-export/genericCSVProcessor.ts`
- Remove the special `leads` case (lines 40-54) that delegates to `LeadsCSVProcessor`

### 10b. `src/hooks/import-export/columnConfig.ts`
- Remove the `leads` entry from the configs (or keep for backward compatibility with old CSV files)

---

## Phase 11: Fix Contact Dropdown Performance (Critical Bug)

The root cause of the search issue: Supabase has a default 1,000-row limit. With 4,400+ contacts, the dropdown only loads the first 1,000. Contacts like "Ritesh Mehta" may be beyond row 1,000 alphabetically.

**Fix in ContactSearchableDropdown:**
- Use paginated fetch (similar to backup's `fetchAllRows`):
```typescript
const fetchAllContacts = async () => {
  const allContacts = [];
  let from = 0;
  const BATCH = 1000;
  while (true) {
    const { data } = await supabase
      .from('contacts')
      .select('id, contact_name, company_name, position, email, phone_no, region')
      .order('contact_name', { ascending: true })
      .range(from, from + BATCH - 1);
    if (!data || data.length === 0) break;
    allContacts.push(...data);
    if (data.length < BATCH) break;
    from += BATCH;
  }
  return allContacts;
};
```

---

## Phase 12: Database Trigger Updates

The `create_action_item_notification` trigger references the `leads` table. Since all leads are converted and no new leads will be created, this trigger can remain as-is (it won't fire). Similarly, `create_lead_notification` trigger on the `leads` table can remain dormant.

No DB schema changes are needed since all lead records are already converted to deals.

---

## Files Summary

| File | Action |
|---|---|
| `src/components/ContactSearchableDropdown.tsx` | **Create new** - fast dropdown for 4400+ contacts |
| `src/components/deal-form/FormFieldRenderer.tsx` | Replace LeadSearchableDropdown with ContactSearchableDropdown, update auto-fill logic |
| `src/components/AccountSearchableDropdown.tsx` | Add `onAccountSelect` callback prop |
| `src/App.tsx` | Remove Leads route, add redirect to /deals |
| `src/components/AppSidebar.tsx` | Remove Leads menu item |
| `src/components/NotificationBell.tsx` | Redirect lead notifications to /deals |
| `src/components/ActionItemsTable.tsx` | Update lead case to handle gracefully |
| `src/hooks/useModuleRecords.tsx` | Update leads case to query deals table |
| `src/components/settings/BackupRestoreSettings.tsx` | Remove Leads from module backup buttons |
| `supabase/functions/create-backup/index.ts` | Remove leads from MODULE_TABLES |
| `src/hooks/import-export/genericCSVProcessor.ts` | Remove leads special case |

---

## Data Safety

- The `leads` table is NOT dropped or modified -- it stays as archived data
- All 14 lead records are already "Converted" and exist as deals
- No data migration SQL is needed
- Backups still include the `leads` table data for safety
- DB triggers on `leads` remain but won't fire (no new inserts)

