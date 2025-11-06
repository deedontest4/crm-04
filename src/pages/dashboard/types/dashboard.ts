export interface DashboardStat {
  title: string;
  value: string;
  change: string;
  icon: any;
  color: string;
}

export interface RecentActivity {
  id: string;
  user: string;
  action: string;
  timestamp: string;
}