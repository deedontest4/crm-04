

## Enhanced Campaign Dashboard - Complete Rebuild

### Problem
The current campaign dashboard is static, wastes space, has non-functional clickable areas, and lacks real data visualizations (charts). The status breakdown and MART progress sections are basic progress bars with no interactivity.

### Solution
Rebuild `CampaignDashboard.tsx` with a dense, interactive layout featuring real Recharts charts, clickable stat cards that filter the view, aggregate metrics from campaign_accounts/contacts/communications tables, and a better space-efficient layout.

### Architecture

```text
+-------+-------+-------+-------+-------+
| Total | Active| Draft |Complete|Paused | <- Clickable stat cards (filter below)
+-------+-------+-------+-------+-------+
|  Status Pie Chart  | Campaign Type Bar  |  <- Recharts visualizations
|   (click slice =   |  Chart (by type    |
|    filter below)   |   distribution)    |
+--------------------+--------------------+
| MART Progress  | Activity Summary       |
| (compact bars) | (accounts/contacts/    |
|                |  comms aggregates)     |
+--------------------+--------------------+
|        All Campaigns Table (filtered)   | <- Clickable rows navigate to detail
+-----------------------------------------+
```

### Data Fetching
- Add new queries in the dashboard component to fetch aggregate counts from `campaign_accounts`, `campaign_contacts`, and `campaign_communications` grouped by campaign_id
- Use existing `campaigns` and `getMartProgress` props

### File Changes

**1. `src/components/campaigns/CampaignDashboard.tsx`** (full rewrite)

- **Clickable stat cards**: Clicking "Active" filters the campaigns table below to show only Active campaigns. Clicking again (or "Total") resets filter.
- **Status Distribution Pie Chart** (Recharts `PieChart`): Shows Active/Draft/Completed/Paused proportions with matching colors. Click a slice to filter.
- **Campaign Type Bar Chart** (Recharts `BarChart`): Shows count by campaign_type (Cold Outreach, Nurture, etc.). Click a bar to filter by type.
- **MART Progress section**: Compact horizontal bars, clickable rows navigate to campaign detail. Show all campaigns (not just 8).
- **Activity Summary card**: Total accounts targeted, contacts added, communications sent across all campaigns. Fetched via Supabase queries inside the component.
- **Filtered Campaigns Table**: Replaces "Recent Campaigns" cards. Full table with columns: Name, Type, Status, MART, Accounts, Contacts, Start/End Date. All rows clickable. Responds to stat card / chart filters. Includes inline search.

**2. `src/pages/Campaigns.tsx`** (minor update)
- Pass additional data to `CampaignDashboard` if needed, or let the dashboard fetch its own aggregate data internally.

### Technical Details
- Uses existing Recharts library (already imported in `chart.tsx`) via `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`
- Uses `PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer` from recharts
- State: `statusFilter` and `typeFilter` managed locally in dashboard
- All campaign rows navigate via `navigate(/campaigns/${id})`
- Responsive grid: 5-col stats, 2-col charts, full-width table
- No new dependencies needed

