import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Plus, Wrench } from "lucide-react";

const MaintenanceScheduling = () => {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Maintenance Scheduling</h2>
          <p className="text-muted-foreground">Schedule and manage system maintenance windows</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Maintenance
        </Button>
      </div>

      <div className="flex-1 overflow-auto space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Scheduled This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground mt-1">3 completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Next Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">Jan 15, 2025</div>
              <p className="text-xs text-muted-foreground mt-1">2:00 AM - 5:00 AM</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Avg Downtime
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.5h</div>
              <p className="text-xs text-muted-foreground mt-1">Last quarter</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Maintenance</CardTitle>
            <CardDescription>Scheduled maintenance windows and activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Wrench className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Database Server Maintenance</p>
                  <p className="text-sm text-muted-foreground">Scheduled for Jan 15, 2025 at 2:00 AM</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">Scheduled</Badge>
                <Button size="sm" variant="outline">Edit</Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Wrench className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Network Switch Upgrade</p>
                  <p className="text-sm text-muted-foreground">Scheduled for Jan 20, 2025 at 1:00 AM</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">Scheduled</Badge>
                <Button size="sm" variant="outline">Edit</Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Wrench className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Backup System Testing</p>
                  <p className="text-sm text-muted-foreground">Scheduled for Jan 25, 2025 at 3:00 AM</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">Scheduled</Badge>
                <Button size="sm" variant="outline">Edit</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance History</CardTitle>
            <CardDescription>Recently completed maintenance activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Security Patch Deployment</p>
                <p className="text-sm text-muted-foreground">Completed on Jan 5, 2025</p>
              </div>
              <Badge variant="outline">Completed</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Server Room HVAC Maintenance</p>
                <p className="text-sm text-muted-foreground">Completed on Dec 28, 2024</p>
              </div>
              <Badge variant="outline">Completed</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">UPS Battery Replacement</p>
                <p className="text-sm text-muted-foreground">Completed on Dec 15, 2024</p>
              </div>
              <Badge variant="outline">Completed</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MaintenanceScheduling;
