import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Server, Wifi, HardDrive, Cpu, AlertTriangle } from "lucide-react";

const Monitoring = () => {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex-shrink-0 p-6 pb-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Network Monitoring</h1>
          <p className="text-muted-foreground">Real-time network and system monitoring</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 pt-0 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Network Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Healthy</div>
              <p className="text-xs text-muted-foreground mt-1">All systems operational</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                Network Uptime
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">99.98%</div>
              <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Server className="h-4 w-4" />
                Active Devices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">147 / 150</div>
              <p className="text-xs text-muted-foreground mt-1">Connected devices</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">2</div>
              <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Server Infrastructure</CardTitle>
            <CardDescription>Real-time server monitoring and health status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Server className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Main Application Server</p>
                    <p className="text-sm text-muted-foreground">server-01.company.local</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">45%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">CPU Usage</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">62%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Disk Usage</p>
                  </div>
                  <Badge>Healthy</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Server className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Database Server</p>
                    <p className="text-sm text-muted-foreground">db-01.company.local</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">78%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">CPU Usage</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">89%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Disk Usage</p>
                  </div>
                  <Badge variant="secondary">Warning</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Server className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Backup Server</p>
                    <p className="text-sm text-muted-foreground">backup-01.company.local</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">23%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">CPU Usage</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">54%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Disk Usage</p>
                  </div>
                  <Badge>Healthy</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>Network monitoring alerts and notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">High Disk Usage on Database Server</p>
                <p className="text-sm text-muted-foreground">Disk usage at 89% on db-01.company.local</p>
                <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
              </div>
              <Badge variant="secondary">Warning</Badge>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Network Latency Detected</p>
                <p className="text-sm text-muted-foreground">Increased latency on subnet 10.0.2.0/24</p>
                <p className="text-xs text-muted-foreground mt-1">5 hours ago</p>
              </div>
              <Badge variant="secondary">Warning</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Monitoring;
