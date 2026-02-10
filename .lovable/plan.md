

## Increase Details Panel Width and Height

### What Changes

Only the sizing values for the details panel will be updated — no other logic, styling, or behavior changes.

### Files to Modify

**1. `src/components/KanbanBoard.tsx` (line 502-503)**
- Change expanded stage column from `minmax(280px, 280px)` to `minmax(300px, 300px)`
- Change details panel column from `minmax(600px, 2fr)` to `minmax(750px, 3fr)` for a wider details area

**2. `src/components/kanban/AnimatedStageHeaders.tsx` (lines 51-52)**
- Same grid column changes to keep headers aligned with the body columns:
  - `minmax(280px, 280px)` becomes `minmax(300px, 300px)`
  - `minmax(600px, 2fr)` becomes `minmax(750px, 3fr)`

**3. `src/components/kanban/InlineDetailsPanel.tsx` (lines 23-25)**
- Increase `minHeight` from `400px` to `550px`
- Increase `maxHeight` from `calc(100vh - 180px)` to `calc(100vh - 140px)` to use more vertical space

### Result

The details panel will be noticeably wider (750px minimum instead of 600px) and taller (550px minimum, more vertical room), giving the History and Action Items sections more breathing room as shown in the reference screenshot.

