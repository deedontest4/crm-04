

## Fix Duplicate Horizontal Scrollbar Issue

### Problem Analysis

The current implementation has **two issues** causing duplicate scrollbars:

1. **Sticky scrollbar is inside the vertical scroll container**: The element with `position: sticky; bottom: 0` (lines 609-618) is placed inside the `overflow-y-auto` container. For `position: sticky` to work as a "pinned to viewport" element, it must be inside the scrolling container but the container must have the correct structure.

2. **Native scrollbar not properly hidden**: The table wrapper has `overflow-x-auto` which can still show a native scrollbar in some browsers.

3. **Structural issue**: The sticky scrollbar needs to be a direct child of the scroll container, but the current nesting causes the sticky element to scroll away with content.

### Root Cause

The sticky scrollbar is placed after the table wrapper div, making it scroll with the table content. When you scroll to the bottom, both the sticky one AND the native browser scrollbar become visible.

### Solution

Restructure the layout so:
1. The outer container handles **both** vertical and horizontal scrolling
2. The sticky scrollbar is positioned correctly relative to the scroll container
3. Properly hide the native horizontal scrollbar on the table wrapper
4. Move the sticky scrollbar **outside** the scrollable area but sync with it

---

### Technical Changes

**File: `src/components/ListView.tsx`**

#### Change 1: Restructure Container Layout (lines 460-619)

Current problematic structure:
```text
scrollContainerRef (overflow-y-auto, overflow-x-hidden)
├── tableWrapperRef (overflow-x-auto - creates native scrollbar!)
│   └── Table
└── Sticky scrollbar (scrolls away because it's inside the scroll container)
```

New correct structure:
```text
Outer wrapper (flex column)
├── scrollContainerRef + tableWrapperRef combined (overflow: auto for both axes)
│   └── Table (hide scrollbar visually with CSS)
└── Sticky scrollbar (OUTSIDE scroll container, syncs via JS)
```

#### Change 2: Combine scroll containers (lines 461-470)

- Merge `scrollContainerRef` and `tableWrapperRef` into a single scroll container
- Use `overflow: auto` for both directions on this container
- Apply CSS to hide the native scrollbar: `-webkit-scrollbar: none` and `scrollbar-width: none`

#### Change 3: Move sticky scrollbar outside scroll container (lines 609-619)

- Position the sticky scrollbar **after** the main scroll container (sibling, not child)
- Use `position: sticky; bottom: 0` on a wrapper that contains both the scroll container and scrollbar
- Alternatively, use a fixed-position approach with proper syncing

#### Change 4: Update scroll sync logic (lines 163-194)

- Update refs to point to the correct elements after restructure
- Ensure bidirectional sync still works with the new structure

---

### Implementation Details

```jsx
{/* Wrapper for both scroll container and sticky scrollbar */}
<div className="flex-1 min-h-0 flex flex-col relative">
  {/* Main scroll container - handles BOTH vertical and horizontal */}
  <div 
    ref={scrollContainerRef}
    className="flex-1 min-h-0 overflow-auto"
    style={{ 
      scrollbarWidth: 'none', 
      msOverflowStyle: 'none' 
    }}
  >
    <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    <Table ref={tableRef} className="w-full hide-scrollbar">
      {/* ... table content ... */}
    </Table>
  </div>
  
  {/* Sticky horizontal scrollbar - OUTSIDE the scroll container */}
  {hasHorizontalOverflow && (
    <div 
      ref={scrollbarRef}
      className="flex-shrink-0 overflow-x-auto bg-background border-t"
      style={{ scrollbarWidth: 'thin' }}
    >
      <div style={{ width: tableContentWidth, height: 1 }} />
    </div>
  )}
</div>
```

#### Updated ResizeObserver Logic

Update the overflow detection to use `scrollContainerRef` directly since we're combining the wrappers:

```jsx
useEffect(() => {
  const scrollContainer = scrollContainerRef.current;
  const table = tableRef.current;
  
  if (!scrollContainer || !table) return;

  const checkOverflow = () => {
    const containerWidth = scrollContainer.clientWidth;
    const contentWidth = table.scrollWidth;
    
    setHasHorizontalOverflow(contentWidth > containerWidth);
    setTableContentWidth(contentWidth);
  };

  // ... rest of ResizeObserver logic
}, [columns, tempColumnWidths]);
```

#### Updated Scroll Sync Logic

```jsx
useEffect(() => {
  const scrollContainer = scrollContainerRef.current;
  const scrollbar = scrollbarRef.current;
  
  if (!scrollContainer || !scrollbar) return;

  // Sync scrollContainer horizontal position with scrollbar
  const handleContainerScroll = () => {
    if (isSyncingFromScrollbar) return;
    isSyncingFromTable = true;
    scrollbar.scrollLeft = scrollContainer.scrollLeft;
    // ...
  };

  // ... rest of sync logic using scrollContainer instead of tableWrapperRef
}, [hasHorizontalOverflow]);
```

---

### Summary of Changes

| Location | Change |
|----------|--------|
| Lines 69-70 | Remove `tableWrapperRef` - no longer needed |
| Lines 137-161 | Update ResizeObserver to use `scrollContainerRef` directly |
| Lines 163-194 | Update scroll sync to use `scrollContainerRef` instead of `tableWrapperRef` |
| Lines 460-470 | Combine into single scroll container with hidden scrollbar |
| Lines 609-619 | Move sticky scrollbar OUTSIDE the scroll container as sibling |

### Expected Result

1. Only ONE horizontal scrollbar visible (the sticky one at bottom)
2. Scrollbar stays pinned to viewport bottom while scrolling vertically
3. Scrollbar properly syncs with table horizontal scroll position
4. Native browser scrollbar is completely hidden

