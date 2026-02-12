

## Plan: Enhance Revenue Analytics Dashboard - Colors, Layout, and Consistency

### Issues Identified

1. **No color-coded card borders/accents** -- All 4 summary cards look identical with no visual distinction
2. **Quarterly breakdown lacks visual hierarchy** -- Plain text rows with no color coding or visual separation between quarters
3. **No progress bar** for target achievement -- Just a text percentage with no visual indicator
4. **Empty state header still shows** when `hideHeader` is true (the empty state branch doesn't check `hideHeader`)
5. **Inconsistent icon background** -- Icons float without a colored background container
6. **No hover feedback on quarterly rows** -- The hover effect is barely visible (`hover:bg-muted`)
7. **"Total Forecast" card has no click action** unlike Actual and Projected cards
8. **Quarter headers lack color** -- Q1-Q4 headers are plain text with no visual distinction
9. **Border-t divider in quarterly totals** is too subtle in dark mode

### Changes

**File: `src/components/YearlyRevenueSummary.tsx`**

1. **Add colored left borders to summary cards**
   - Annual Target: primary/orange accent border
   - Actual Revenue: green left border (`border-l-4 border-l-green-500`)
   - Projected Revenue: blue left border (`border-l-4 border-l-blue-500`)
   - Total Forecast: purple left border (`border-l-4 border-l-purple-500`)

2. **Add icon background circles**
   - Wrap each icon in a small colored circle background (e.g., `bg-green-500/10 p-2 rounded-full`)
   - Matches modern dashboard patterns

3. **Add a progress bar** under the Annual Target card
   - Visual bar showing actual vs target percentage
   - Green fill with muted background track

4. **Enhance quarterly breakdown**
   - Add colored left accent to each quarter column (Q1=blue, Q2=teal, Q3=amber, Q4=purple)
   - Add a subtle background card per quarter (`bg-muted/30 rounded-lg p-4`)
   - Improve the Total row styling with bolder font and subtle background
   - Add colored dots next to "Actual" (green) and "Projected" (blue) labels

5. **Fix empty state** to respect `hideHeader` prop

6. **Consistent gap/spacing** -- Change `gap-6` to `gap-4` on the summary cards grid for tighter, more polished layout

### Files to Modify

| File | Change |
|------|--------|
| `src/components/YearlyRevenueSummary.tsx` | Add colored borders, icon backgrounds, progress bar, enhanced quarterly layout, fix empty state |

### Visual Result

```text
+------------------------------------------+
| Revenue Analytics          [bell] [2026] |  <- Header (already done)
+------------------------------------------+
| [Target]  | [Actual]  | [Projected] | [Forecast] |
| orange    | green     | blue        | purple     |
| border    | border    | border      | border     |
| ===prog=  |           |             |            |
+------------------------------------------+
| Quarterly Breakdown - 2026               |
| +--------+--------+--------+--------+   |
| | Q1     | Q2     | Q3     | Q4     |   |
| | blue   | teal   | amber  | purple |   |
| | bg     | bg     | bg     | bg     |   |
| | *Act   | *Act   | *Act   | *Act   |   |
| | *Proj  | *Proj  | *Proj  | *Proj  |   |
| | Total  | Total  | Total  | Total  |   |
| +--------+--------+--------+--------+   |
+------------------------------------------+
```

