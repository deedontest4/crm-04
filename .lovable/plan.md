

## Fix ContactSearchableDropdown - "No contacts found" Still Showing

### Root Cause
The `shouldFilter={false}` prop correctly prevents `cmdk` from filtering `CommandItem` elements, but `CommandEmpty` still relies on cmdk's internal "no results" state, which can incorrectly trigger. This is a known quirk in cmdk v1.

### Fix

**File: `src/components/ContactSearchableDropdown.tsx`**

Replace `<CommandEmpty>No contacts found.</CommandEmpty>` with a manual check:

```tsx
{filteredContacts.length === 0 && !loading && (
  <div className="py-6 text-center text-sm text-muted-foreground">
    No contacts found.
  </div>
)}
```

This removes the dependency on cmdk's internal empty-state detection and uses the already-correct `filteredContacts` array length instead.

### Summary
- One file changed: `src/components/ContactSearchableDropdown.tsx`
- Remove `CommandEmpty` usage, replace with manual conditional render
- No data changes, no structural changes

