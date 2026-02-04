

## Plan: Make Horizontal Scrollbar Always Visible While Scrolling

Based on the screenshots and your answers, the issue is that the horizontal scrollbar only appears when you scroll all the way to the bottom. You want it **always visible (pinned at the bottom)** while you scroll vertically through rows, but only when there is actual horizontal overflow.

### Root Cause

The current implementation uses a single `div` wrapper with `overflow-auto` around the `Table`. This causes the horizontal scrollbar to appear at the very bottom of the **scrollable content** rather than at the bottom of the **visible viewport**.

When you have many rows, you must scroll to the last row before the horizontal scrollbar becomes visible.

### Solution

Split the scroll containers:
- Outer container handles **vertical scrolling** only (`overflow-y-auto`)
- Inner container with `position: sticky` at the bottom handles **horizontal scrolling** for the scrollbar track

However, a simpler CSS approach exists using `overflow: scroll` combined with `scrollbar-gutter: stable` and making the scrollbar always visible via CSS `overflow-x: scroll` on a sticky bottom element.

The cleanest approach is to use a **fixed-position horizontal scrollbar** that syncs with the table scroll position using JavaScript.

### Technical Approach

Use the `overflow-x: scroll` property with `overflow-y: auto` on a wrapper, but restructure the layout so the horizontal scrollbar container is **sticky at the bottom** of the visible area.

Implementation:
1. Create a separate sticky bottom div that shows the horizontal scrollbar
2. Sync the scroll position between the table and the scrollbar using JavaScript refs
3. The scrollbar element will be `position: sticky; bottom: 0` to always stay visible

### Changes

**File: `src/components/ListView.tsx`**

1. **Add scrollbar sync refs** (lines 62-66)
   - Add `scrollContainerRef` and `scrollbarRef` useRefs
   - Add state to track if horizontal scroll is needed

2. **Add scroll sync logic** (new useEffect)
   - Use ResizeObserver to detect when content is wider than container
   - Sync scroll positions between table and bottom scrollbar

3. **Update content area structure** (lines 394-527)
   - Keep the main table in a container with `overflow-y: auto overflow-x: hidden`
   - Add a sticky bottom scrollbar that mirrors the table width
   - This scrollbar stays visible at the bottom of the viewport while scrolling vertically

4. **Add CSS for the synced scrollbar**
   - Style the scrollbar track to match the design system

### Visual Representation

```text
+------------------------------------------+
|  Filter Bar (fixed)                      |
+------------------------------------------+
|  Table Content Area                      |
|  +--------------------------------------+|
|  | Header (sticky top)                  ||
|  +--------------------------------------+|
|  | Row 1                                ||
|  | Row 2                                ||
|  | Row 3                                ||
|  | ...                                  ||
|  +--------------------------------------+|
|  | Horizontal Scrollbar (sticky bottom)||  <-- Always visible
|  +--------------------------------------+|
+------------------------------------------+
|  Pagination Footer (fixed)               |
+------------------------------------------+
```

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/ListView.tsx` | Add sticky horizontal scrollbar with scroll sync logic |

