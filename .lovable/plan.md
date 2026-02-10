

## Plan: Replace "Company Name" with "Account" Dropdown in Leads + Deals Modules

### Overview

Replace the plain text "Company Name" field in Leads and "Customer Name" field in Deals with a proper Account relationship using searchable dropdowns. Migrate all existing data by creating new Account records (without duplicates) and linking them to existing Leads and Deals.

### Data Analysis

**Deals module** has 33 unique `customer_name` values across ~47 deals. Of these:
- 2 already match existing accounts exactly: **BMW**, **CARIAD**
- Several have near-matches (e.g., "REFU Drive" / "ReFu Drive" / "REFU  Drive" should all map to "REFU Drive HQ, Germany")
- ~25 need new Account records created

**Leads module** has 15 unique `company_name` values. Some overlap with deals (Hanon, Lamborgini, Marelli, Volvo AB, LG Virtualization).

**Deduplication mapping** (customer_name/company_name -> existing account to link):
| Text in Leads/Deals | Existing Account Match |
|---|---|
| BMW | BMW |
| CARIAD, CARIAD US | CARIAD |
| REFU Drive, ReFu Drive, REFU  Drive | REFU Drive HQ, Germany |
| Continental | Continental HQ, Germany |
| Harley Davidson | Harley-Davidson Motor Company, HQ, US |
| Porsche | Porsche, HQ, Germany |
| Mercedes Benz India | Mercedes-Benz Group AG, HQ, Germany |
| Stellantis | Stellantis, HQ, Netherlands |
| Marelli | Marelli HQ, Italy |
| Volvo AB | (no exact match - create new) |
| Volvo Cars | Volvo Car Corporation |
| All others | Create new Account records |

### Database Changes

**Migration 1: Add `account_id` columns**
- `ALTER TABLE leads ADD COLUMN account_id UUID REFERENCES accounts(id)`
- `ALTER TABLE deals ADD COLUMN account_id UUID REFERENCES accounts(id)`

**Migration 2: Create missing Account records and backfill**
- Collect all unique names from `leads.company_name` and `deals.customer_name`
- For names matching existing accounts (exact or near-match), link directly
- For unmatched names, INSERT new Account records
- UPDATE all leads and deals to set `account_id`
- Keep `company_name` and `customer_name` columns intact (no data loss)

### UI Changes

**1. `src/components/LeadModal.tsx`**
- Replace text `Input` for "Company Name" with `AccountSearchableDropdown`
- Change label from "Company Name" to "Account"
- On select: set `company_name = selected account_name` (backward compat) and store `account_id`

**2. `src/components/LeadTable.tsx`**
- Rename column label from "Company Name" to "Account"
- Add clickable account name that opens `AccountViewModal`

**3. `src/components/deal-form/FormFieldRenderer.tsx`**
- Change `customer_name` label from "Customer Name" to "Account"
- Replace the default text Input with `AccountSearchableDropdown` for `customer_name` field
- Update `handleLeadSelect` to pass `account_id` when auto-filling from lead

**4. `src/components/deal-form/LeadStageForm.tsx`**
- Update the `customer_name` field rendering to use the new dropdown

**5. `src/components/DealCard.tsx` / `src/components/kanban/InlineDetailsPanel.tsx`**
- Update display label from "Customer" to "Account" where `customer_name` is shown

**6. Import/Export files**
- `src/hooks/import-export/leadsCSVProcessor.ts` - support `account_name` header mapping
- `src/hooks/import-export/dealsCSVProcessor.ts` - support `account_name` header mapping

### Technical Details

**Migration SQL (executed in order):**

Step 1 - Schema:
```sql
ALTER TABLE leads ADD COLUMN account_id UUID REFERENCES accounts(id);
ALTER TABLE deals ADD COLUMN account_id UUID REFERENCES accounts(id);
```

Step 2 - Create accounts for unmatched names and backfill:
The migration will use a DO block to:
1. Build a mapping of customer_name/company_name to existing account IDs
2. For unmatched names, INSERT INTO accounts with just the name
3. UPDATE leads SET account_id = matched_account_id
4. UPDATE deals SET account_id = matched_account_id

**Near-match handling in migration:**
- "REFU Drive", "ReFu Drive", "REFU  Drive" all map to existing "REFU Drive HQ, Germany" (id: 2b3ecebd)
- "Harley Davidson" maps to "Harley-Davidson Motor Company, HQ, US"
- "Continental" maps to "Continental HQ, Germany"
- "Porsche" maps to "Porsche, HQ, Germany"
- "Stellantis" maps to "Stellantis, HQ, Netherlands"
- "Marelli" maps to "Marelli HQ, Italy"
- "Volvo Cars" maps to "Volvo Car Corporation"
- "Mercedes Benz India" maps to "Mercedes-Benz Group AG, HQ, Germany"
- New accounts created for: Accenture, Aumovio, BMW - Accenture, BMW Tech Works, BMW/Acsia, CARIAD US, ClearMotion, Coretura, Eberspacher, Hanon, Kiekert, Lamborgini, LG - tQCS, LG Virtualization, LSAT, Siemens / Volvo Trucks, TATA Elxsi, Thyssen Krupp, TKE, Volvo AB, VW, Antolin, Aptiv, BHTC, BMW Tech Center India, Daichi, Kostal, Preh, Scania / MAN, Test, Vestel

**Backward compatibility:**
- `company_name` (leads) and `customer_name` (deals) columns are preserved
- When user selects an Account from dropdown, both the text field and `account_id` are set
- Existing queries, filters, and search continue to work on text fields

### Files to Modify

| File | Change |
|------|--------|
| New migration | Add `account_id` to leads and deals, create accounts, backfill |
| `src/components/LeadModal.tsx` | Replace text input with AccountSearchableDropdown |
| `src/components/LeadTable.tsx` | Rename column to "Account", add clickable link |
| `src/components/deal-form/FormFieldRenderer.tsx` | Add AccountSearchableDropdown for customer_name |
| `src/integrations/supabase/types.ts` | Auto-updates with new columns |
| `src/types/deal.ts` | Add `account_id` field |

### Zero Data Loss Guarantee
- No columns are dropped or renamed
- Existing text values remain intact in `company_name` and `customer_name`
- New `account_id` column is nullable -- existing code continues to work
- All existing customer/company names get linked to Account records (existing or newly created)

