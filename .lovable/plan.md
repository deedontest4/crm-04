

## Fix ContactSearchableDropdown Bugs

### Bug 1: Search Shows "No contacts found" for Existing Records
**Root Cause:** The `cmdk` library has its own built-in text filtering that runs alongside the custom `filteredContacts` filter. When a user types a search term, `cmdk` internally tries to match items by their `value` prop -- this can conflict with the custom filtering logic, causing valid matches to be hidden and showing "No contacts found."

**Fix in `src/components/ContactSearchableDropdown.tsx`:**
- Add `shouldFilter={false}` to the `<Command>` component (line 108) to disable cmdk's built-in filtering, relying entirely on the custom `filteredContacts` logic which already works correctly.

### Bug 2: Dropdown Width is Too Large (Spans Beyond Field)
**Root Cause:** The `PopoverContent` uses `className="w-full p-0"` which doesn't properly constrain the dropdown to the trigger button's width. Compare with `AccountSearchableDropdown` which correctly uses `w-[--radix-popover-trigger-width]`.

**Fix in `src/components/ContactSearchableDropdown.tsx`:**
- Change the `PopoverContent` className (line 107) from `"w-full p-0"` to `"w-[--radix-popover-trigger-width] p-0"` so the dropdown matches the trigger field width exactly.

### Summary of Changes

**File: `src/components/ContactSearchableDropdown.tsx`**
- Line 107: Change `w-full` to `w-[--radix-popover-trigger-width]` on PopoverContent
- Line 108: Add `shouldFilter={false}` to the Command component

No data changes, no structural changes -- just two targeted prop fixes.

