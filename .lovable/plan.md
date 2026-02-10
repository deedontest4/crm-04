

## Fix History and Action Items Section Heights

### Goal
Both the History and Action Items sections should always maintain a consistent fixed height, regardless of how many records they contain. When records exceed 7 rows, a scrollbar appears. When fewer or no records exist, the section retains the same space.

### Changes

**File: `src/components/DealExpandedPanel.tsx`**

#### History Section (lines 345-412)
- Replace the current `CollapsibleContent` inner wrapper (`div` + `ScrollArea` with `h-full`) with a fixed-height container
- Set a fixed height of approximately `280px` (7 rows x ~36px per row + header row) using `h-[280px]` or a similar value
- Keep `overflow-y-auto` so scrollbar appears when content exceeds 7 rows
- When there are no records or fewer records, the container stays at the same height (empty space preserved)

#### Action Items Section (lines 456-548)
- Apply the same fixed-height treatment as History
- Replace `h-full` with a matching fixed height (`h-[280px]`)
- Same overflow behavior: scroll when more than 7 rows, keep space when fewer

### Technical Details

For both sections, the `CollapsibleContent` inner `div` (lines 346 and 457) changes from:
```
<div className="h-full overflow-hidden">
  <ScrollArea className="h-full">
```
To:
```
<div className="h-[280px] overflow-y-auto">
```

This removes the `ScrollArea` component dependency for these sections and uses native scrollbar with a fixed height, ensuring:
- Exactly 7 rows visible before scrollbar kicks in
- Empty/few-record states still occupy the full 280px height
- Both sections always take the same vertical space

