

## Plan: Migrate Leads to Contacts and Link to Deals

### Current State
- **14 leads** in the Leads module
- **4,402 contacts** in the Contacts module
- **18 deals** in the Lead stage
- **2 duplicate leads** already exist in Contacts (Niclas Evertsson, Thorsten Labuhn - matched by email)

### Migration Steps

**Step 1: Create an Edge Function for the migration**

Build a `migrate-leads-to-contacts` edge function that:

1. Fetches all 14 leads
2. For each lead, checks if a matching contact already exists (by email or name)
3. If no duplicate: inserts a new contact record with mapped fields
4. If duplicate: skips creation, uses the existing contact ID
5. Updates leads status to "Converted" for migrated leads
6. Links deals in "Lead" stage to the correct contact by updating the deal's `lead_name` to match the contact name

**Step 2: Field Mapping (Leads to Contacts)**

| Lead Field | Contact Field |
|---|---|
| lead_name | contact_name |
| company_name | company_name |
| email | email |
| phone_no | phone_no |
| position | position |
| country | region |
| industry | industry |
| contact_source | contact_source |
| linkedin | linkedin |
| website | website |
| description | description |
| contact_owner | contact_owner |
| created_by | created_by |

**Step 3: Duplicate Handling**

Two leads already exist as contacts:
- **Niclas Evertsson** (lead email: niclas.evertsson@scania.com) -- existing contact ID: 9c379d7a
- **Thorsten Labuhn** (lead email: Torsten.Labuhn@bhtc.com, slight name difference) -- existing contact ID: c8339629

These will be skipped during creation. Their existing contact records will be used for deal linking.

**Step 4: Deal Linking**

For each deal in "Lead" stage, match the deal's `lead_name` or `customer_name` to the corresponding contact (newly created or existing duplicate). Update the deal record to ensure `lead_name` correctly references the contact.

### Files to Create/Modify

| File | Action |
|---|---|
| `supabase/functions/migrate-leads-to-contacts/index.ts` | New edge function for the migration |

### Technical Notes

- The edge function will use the service role key for admin-level access
- The migration is idempotent -- running it again won't create duplicate contacts
- All 14 leads will have their status set to "Converted" after migration
- A detailed log/report will be returned showing what was migrated, skipped, and linked

