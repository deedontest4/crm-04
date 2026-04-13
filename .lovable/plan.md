

## Enhance Campaigns Module UI

### Problem
1. No dashboard/overview view -- only a list table exists
2. Header layout doesn't match other modules (uses `p-6 pb-4` instead of `h-16 px-6 border-b` fixed height)
3. Filter bar styling inconsistent (uses `p-4 border-b` instead of `bg-muted/30 px-6 py-3`)

### Changes

**1. Add a Campaign Dashboard view** — new file `src/components/campaigns/CampaignDashboard.tsx`

A grid-based overview showing:
- **Summary stat cards** (row 1): Total Campaigns, Active, Draft, Completed -- small cards with counts
- **MART Progress overview** (row 2): Shows campaigns with their MART completion as progress bars
- **Status breakdown** (row 2): A simple status distribution (bar or donut chart)
- **Recent campaigns** (row 3): Last 5 campaigns as compact clickable cards with status badge, type, date range

Uses existing `useCampaigns` hook data -- no new queries needed.

**2. Add view toggle to Campaigns page** — modify `src/pages/Campaigns.tsx`

- Add `ToggleGroup` with "Dashboard" and "List" views (matching Deals page pattern with `LayoutGrid` / `List` icons)
- Fix header to use `h-16 px-6 border-b bg-background` (matching Contacts/Accounts pattern)
- Fix filter bar to use `bg-muted/30 px-6 py-3` styling
- Move view toggle + "New Campaign" button into the header row
- Dashboard view shown by default, list view shows the existing table
- Filters only visible in List view

**3. Layout alignment fix**

Replace:
```
<div className="flex items-center justify-between p-6 pb-4 border-b border-border">
```
With:
```
<div className="flex-shrink-0 h-16 px-6 border-b bg-background flex items-center justify-between">
```

This aligns the header divider with the sidebar icon divider, matching Contacts and Accounts modules.

### Files

| File | Action |
|---|---|
| `src/components/campaigns/CampaignDashboard.tsx` | Create -- dashboard view with stats, MART progress, status breakdown |
| `src/pages/Campaigns.tsx` | Modify -- add view toggle, fix header/filter bar layout to match other modules |

