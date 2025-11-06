import { useAuth } from "@/hooks/useAuth";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  Ticket, 
  Package, 
  RefreshCw, 
  AlertTriangle, 
  WifiOff, 
  CheckCircle,
  Plus,
  FileCheck,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

const Dashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [
        ticketsResult,
        assetsResult,
        updatesResult,
        complianceResult,
        monitoringResult
      ] = await Promise.all([
        supabase.from('tickets').select('*', { count: 'exact' }),
        supabase.from('assets').select('*', { count: 'exact' }),
        supabase.from('updates').select('*', { count: 'exact' }),
        supabase.from('compliance').select('*', { count: 'exact' }),
        supabase.from('monitoring').select('*', { count: 'exact' })
      ]);

      // Calculate KPIs
      const openTickets = ticketsResult.data?.filter(t => t.status === 'open').length || 0;
      const activeAssets = assetsResult.data?.filter(a => a.status === 'available' || a.status === 'in_use').length || 0;
      const pendingUpdates = updatesResult.data?.filter(u => u.status === 'scheduled').length || 0;
      const pendingCompliance = complianceResult.data?.filter(c => c.status === 'pending').length || 0;
      const offlineDevices = monitoringResult.data?.filter(m => m.status === 'critical' || m.alert_triggered).length || 0;

      // Assets expiring soon (within 30 days)
      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      const expiringAssets = assetsResult.data?.filter(a => {
        if (!a.warranty_expiry) return false;
        const expiryDate = new Date(a.warranty_expiry);
        return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
      }).length || 0;

      // Ticket trends by week
      const ticketsByStatus = ticketsResult.data?.reduce((acc: any, ticket) => {
        acc[ticket.status] = (acc[ticket.status] || 0) + 1;
        return acc;
      }, {});

      // Asset allocation by type
      const assetsByType = assetsResult.data?.reduce((acc: any, asset) => {
        acc[asset.type] = (acc[asset.type] || 0) + 1;
        return acc;
      }, {});

      // Compliance percentage
      const totalCompliance = complianceResult.data?.length || 0;
      const completedCompliance = complianceResult.data?.filter(c => c.status === 'completed').length || 0;
      const compliancePercentage = totalCompliance > 0 ? Math.round((completedCompliance / totalCompliance) * 100) : 0;

      // Recent alerts
      const alerts = [
        ...assetsResult.data?.filter(a => {
          if (!a.warranty_expiry) return false;
          const expiryDate = new Date(a.warranty_expiry);
          return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
        }).map(a => ({
          title: 'Warranty Expiring Soon',
          description: `${a.name} warranty expires ${formatDistanceToNow(new Date(a.warranty_expiry!))}`,
          severity: 'warning' as const
        })) || [],
        ...ticketsResult.data?.filter(t => t.priority === 'critical' && t.status === 'open').map(t => ({
          title: 'Critical Ticket Open',
          description: `${t.title} - ${t.ticket_number}`,
          severity: 'critical' as const
        })) || [],
        ...monitoringResult.data?.filter(m => m.alert_triggered && !m.acknowledged).map(m => ({
          title: 'System Alert',
          description: m.alert_message || `${m.service_name} requires attention`,
          severity: 'critical' as const
        })) || []
      ].slice(0, 5);

      return {
        kpis: {
          openTickets,
          activeAssets,
          pendingUpdates,
          expiringAssets,
          offlineDevices,
          pendingCompliance
        },
        ticketTrends: Object.entries(ticketsByStatus || {}).map(([status, count]) => ({
          status,
          count
        })),
        assetAllocation: Object.entries(assetsByType || {}).map(([type, count]) => ({
          type,
          count
        })),
        compliancePercentage,
        alerts
      };
    }
  });

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--chart-1))', 'hsl(var(--chart-2))'];

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 flex items-center justify-between h-16 px-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                <Card className="cursor-pointer" onClick={() => navigate('/tickets')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
                    <Ticket className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData?.kpis.openTickets || 0}</div>
                    <p className="text-xs text-muted-foreground">Requires attention</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                <Card className="cursor-pointer" onClick={() => navigate('/assets')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Assets</CardTitle>
                    <Package className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData?.kpis.activeAssets || 0}</div>
                    <p className="text-xs text-muted-foreground">In operation</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                <Card className="cursor-pointer" onClick={() => navigate('/updates')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Updates</CardTitle>
                    <RefreshCw className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData?.kpis.pendingUpdates || 0}</div>
                    <p className="text-xs text-muted-foreground">Scheduled</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                <Card className="cursor-pointer" onClick={() => navigate('/assets')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Warranties Expiring</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData?.kpis.expiringAssets || 0}</div>
                    <p className="text-xs text-muted-foreground">Within 30 days</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                <Card className="cursor-pointer" onClick={() => navigate('/monitoring')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">System Alerts</CardTitle>
                    <WifiOff className="h-4 w-4 text-destructive" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData?.kpis.offlineDevices || 0}</div>
                    <p className="text-xs text-muted-foreground">Active alerts</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                <Card className="cursor-pointer" onClick={() => navigate('/compliance')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                    <CheckCircle className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData?.kpis.pendingCompliance || 0}</div>
                    <p className="text-xs text-muted-foreground">Compliance checks</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and operations</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button onClick={() => navigate('/tickets')} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Raise Ticket
                </Button>
                <Button onClick={() => navigate('/assets')} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Asset
                </Button>
                <Button onClick={() => navigate('/compliance')} variant="outline" className="gap-2">
                  <FileCheck className="h-4 w-4" />
                  Run Compliance Check
                </Button>
              </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ticket Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Ticket Distribution
                  </CardTitle>
                  <CardDescription>Tickets by status</CardDescription>
                </CardHeader>
                <CardContent>
                  {dashboardData?.ticketTrends && dashboardData.ticketTrends.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={dashboardData.ticketTrends}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="status" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      No ticket data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Asset Allocation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    Asset Allocation
                  </CardTitle>
                  <CardDescription>Distribution by type</CardDescription>
                </CardHeader>
                <CardContent>
                  {dashboardData?.assetAllocation && dashboardData.assetAllocation.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={dashboardData.assetAllocation}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="hsl(var(--primary))"
                          dataKey="count"
                        >
                          {dashboardData.assetAllocation.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      No asset data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Compliance Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Compliance Overview
                </CardTitle>
                <CardDescription>Overall compliance status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Compliance Rate</span>
                    <span className="text-2xl font-bold">{dashboardData?.compliancePercentage || 0}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2.5">
                    <div 
                      className="bg-primary h-2.5 rounded-full transition-all duration-500" 
                      style={{ width: `${dashboardData?.compliancePercentage || 0}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alerts Section */}
            {dashboardData?.alerts && dashboardData.alerts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Active Alerts
                  </CardTitle>
                  <CardDescription>Recent notifications and warnings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dashboardData.alerts.map((alert, index) => (
                    <Alert key={index} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>{alert.title}</AlertTitle>
                      <AlertDescription>{alert.description}</AlertDescription>
                    </Alert>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;