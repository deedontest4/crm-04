

## Fix All Searchable Dropdown Bugs

All three searchable dropdown components share the same two bugs that were partially fixed only in `ContactSearchableDropdown`. The Account and Lead dropdowns still have them.

### Bug 1: Search returns "No [items] found" for existing records
The `cmdk` library's internal filtering conflicts with custom filtering logic. Two fixes needed per component:
- Add `shouldFilter={false}` to `<Command>` to disable cmdk's built-in filter
- Replace `<CommandEmpty>` with a manual conditional check based on the filtered array length

### Bug 2: Dropdown width exceeds field size
`LeadSearchableDropdown` uses `w-full` instead of `w-[--radix-popover-trigger-width]` on `PopoverContent`.

### Files and Changes

**1. `src/components/AccountSearchableDropdown.tsx`**
- Line 105: Add `shouldFilter={false}` to `<Command>`
- Lines 119: Replace `<CommandEmpty>No accounts found.</CommandEmpty>` with manual empty check:
  ```tsx
  {filteredAccounts.length === 0 && !loading && (
    <div className="py-6 text-center text-sm text-muted-foreground">No accounts found.</div>
  )}
  ```

**2. `src/components/LeadSearchableDropdown.tsx`**
- Line 114: Change `PopoverContent` from `w-full` to `w-[--radix-popover-trigger-width]`
- Line 115: Add `shouldFilter={false}` to `<Command>`
- Line 129: Replace `<CommandEmpty>No leads found.</CommandEmpty>` with manual empty check:
  ```tsx
  {filteredLeads.length === 0 && !loading && (
    <div className="py-6 text-center text-sm text-muted-foreground">No leads found.</div>
  )}
  ```

**3. `src/components/ContactSearchableDropdown.tsx`** (already partially fixed)
- Verify existing fixes are intact (shouldFilter, manual empty check, width) -- no changes expected.

### No Data Changes
- No database records modified
- No schema changes
- Only UI component prop fixes

