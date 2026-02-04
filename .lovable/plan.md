

## Make Horizontal Scrollbar Always Visible While Scrolling

### Problem Analysis

Currently, the `ListView.tsx` component uses a single `div` container with `overflow-auto` (line 395) that wraps the entire table. This causes the horizontal scrollbar to appear at the **bottom of the scrollable content** rather than at the **bottom of the visible viewport**.

When there are many rows, users must scroll all the way to the last row before the horizontal scrollbar becomes visible - making it impossible to scroll horizontally while viewing rows at the top or middle of the table.

### Solution Overview

Implement a **synced sticky horizontal scrollbar** that:
1. Stays pinned at the bottom of the visible viewport
2. Only appears when horizontal scrolling is needed
3. Syncs scroll position with the main table content

### Technical Approach

```text
+------------------------------------------+
|  Filter Bar (fixed)                      |
+------------------------------------------+
|  Scroll Container (overflow-y: auto)     |
|  +--------------------------------------+|
|  | Table Header (sticky top)            ||
|  +--------------------------------------+|
|  | Row 1                                ||
|  | Row 2                                ||
|  | Row 3                                ||
|  | ...                                  ||
|  +--------------------------------------+|
|  | Scrollbar Track (sticky bottom: 0)  ||  <-- Always visible
|  +--------------------------------------+|
+------------------------------------------+
|  Pagination Footer (fixed)               |
+------------------------------------------+
```

---

### Implementation Details

**File: `src/components/ListView.tsx`**

#### Step 1: Add Scroll Sync Refs and State (around lines 62-66)

Add new refs and state to track:
- `scrollContainerRef` - Reference to the main scroll container
- `scrollbarRef` - Reference to the sticky scrollbar element
- `hasHorizontalOverflow` - Boolean to show/hide the scrollbar
- `tableContentWidth` - Track the actual table width for the scrollbar

#### Step 2: Add ResizeObserver Effect (new useEffect after line 128)

Create a `useEffect` that:
- Uses `ResizeObserver` to monitor the table width
- Compares table width vs container width
- Sets `hasHorizontalOverflow` to `true` when table is wider than container
- Updates `tableContentWidth` for the scrollbar track

#### Step 3: Add Scroll Sync Effect (new useEffect)

Create bidirectional scroll sync:
- When user scrolls the main table horizontally, update scrollbar position
- When user drags the scrollbar, update table scroll position
- Use `scrollLeft` property on both elements

#### Step 4: Update Container Structure (lines 394-527)

Restructure the content area:

```jsx
{/* Outer container with vertical scroll */}
<div 
  ref={scrollContainerRef}
  className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative"
>
  {/* Table wrapper for horizontal scroll tracking */}
  <div className="overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
    <Table ref={tableRef} className="w-full">
      {/* ... existing table content ... */}
    </Table>
  </div>
  
  {/* Sticky Horizontal Scrollbar */}
  {hasHorizontalOverflow && (
    <div 
      ref={scrollbarRef}
      className="sticky bottom-0 left-0 right-0 overflow-x-auto bg-background border-t z-10"
      style={{ scrollbarWidth: 'thin' }}
    >
      <div style={{ width: tableContentWidth, height: 1 }} />
    </div>
  )}
</div>
```

#### Step 5: Handle Hidden Scrollbar on Table

Add inline style or CSS class to hide the native scrollbar on the inner table wrapper while keeping scroll functionality via the sticky scrollbar.

---

### Summary of Changes

| Location | Change |
|----------|--------|
| Lines 62-66 | Add `scrollContainerRef`, `scrollbarRef`, `hasHorizontalOverflow`, `tableContentWidth` |
| After line 128 | Add `useEffect` for ResizeObserver to detect overflow |
| After ResizeObserver effect | Add `useEffect` for bidirectional scroll sync |
| Lines 394-527 | Restructure container with sticky scrollbar element |

### Browser Compatibility

This approach uses:
- `ResizeObserver` - Supported in all modern browsers
- `position: sticky` - Full support in modern browsers
- `scrollLeft` sync - Standard DOM API

### Expected Behavior After Implementation

1. User opens Deals list view with many columns
2. Horizontal scrollbar appears at the bottom of the **visible area** immediately
3. User scrolls vertically through rows - scrollbar stays pinned at bottom
4. User can scroll horizontally at any time, regardless of vertical position
5. Scrollbar only appears when content is wider than the container

