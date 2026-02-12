

## Enhance Deals Page: Colors, Consistency, and Layout Improvements

### Issues Found and Proposed Fixes

#### 1. Kanban View - Stage Header Colors Need Stronger Contrast
The stage headers use CSS variable-based colors (`STAGE_COLORS` from `types/deal.ts`) but the reference screenshot shows more saturated, distinct stage header colors. The current colors are quite pastel and could benefit from stronger differentiation.

**File: `src/index.css`**
- Adjust the stage CSS variables (lines 51-67) to have slightly more saturated background colors so stages are more visually distinct at a glance (matching the reference screenshot better).

#### 2. List View - Stage Column Needs Color Badges
Currently, the Stage column in list view renders as plain text via `InlineEditCell`. The reference screenshot shows stage values should have colored badge styling matching their stage color.

**File: `src/components/InlineEditCell.tsx`**
- In the `formatDisplayValue` / non-editing display (line 86-92), add special rendering for `type === 'stage'` that wraps the stage name in a colored badge using `STAGE_COLORS` from `types/deal.ts`.

#### 3. List View - Row Alternating Colors / Hover Enhancement
The reference screenshot shows subtle alternating row backgrounds for better readability.

**File: `src/components/ListView.tsx`**
- Add alternating row styling on `TableRow` (line 462-466): odd rows get a subtle background tint (`bg-muted/10` or similar).
- Ensure hover state is clearly visible with `hover:bg-muted/40`.

#### 4. List View - Header Bar Consistency
The Kanban and List view headers should look consistent. Currently the List view header has `bg-muted/30` while Kanban uses `bg-background`. 

**File: `src/components/ListView.tsx`**
- Update filter bar background (line 352) from `bg-muted/30` to `bg-background` and add `border-b border-border` to match the Kanban view's header exactly.
- Adjust search bar height to `h-8` and font to `text-sm` to match Kanban.

#### 5. List View - Project Name Column Should Use Primary Color
The reference screenshot shows project names in the first column displayed in a blue/primary color to indicate they are clickable.

**File: `src/components/InlineEditCell.tsx`**
- When the field is `project_name` (or the first column), render the display value with `text-primary` color class for visual distinction.

#### 6. Kanban View - Card Footer Date Format Consistency  
Some cards show "Feb 12" while others show "Jan 05" -- this is consistent. But the probability bar width could use a minimum width to avoid looking odd at 0%.

**File: `src/components/DealCard.tsx`**
- Add a minimum display for 0% probability (show "0" text without an empty bar).

#### 7. List View - Pagination Footer Styling
The pagination footer should match the reference with clearer button styling.

**File: `src/components/ListView.tsx`**
- Pagination buttons (lines 568-588) are fine but add subtle `shadow-sm` to the Previous/Next buttons for better affordance.

### Technical Summary of File Changes

| File | Changes |
|------|---------|
| `src/index.css` | Increase stage color saturation for light theme |
| `src/components/InlineEditCell.tsx` | Add colored badge for stage display; add primary color for project_name field |
| `src/components/ListView.tsx` | Alternating row colors; header bar bg consistency; header height matching |
| `src/components/DealCard.tsx` | Handle 0% probability display edge case |

### What Will NOT Change
- Kanban board layout, grid columns, and details panel sizing (already updated per previous changes)
- Deal card structure and fields
- Drag-and-drop behavior
- Any database queries or hooks
- Action items or history sections

