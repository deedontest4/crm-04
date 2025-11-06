import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, Download, CheckCircle, AlertCircle, Clock } from "lucide-react";

const Updates = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex-shrink-0 p-6 pb-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Windows & System Updates</h1>
            <p className="text-muted-foreground">Manage and deploy system updates</p>
          </div>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Deploy Updates
          </Button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search updates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 pt-0 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Update Summary</CardTitle>
            <CardDescription>Current deployment status across all systems</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Systems Up to Date</span>
                <span className="font-medium">142 / 150 (95%)</span>
              </div>
              <Progress value={95} className="h-2" />
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Pending Updates</p>
                <p className="text-2xl font-bold">8</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Failed Updates</p>
                <p className="text-2xl font-bold text-destructive">2</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Last Scan</p>
                <p className="text-sm font-medium">2 hours ago</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  Windows 11 Security Update (KB5034765)
                </CardTitle>
                <CardDescription>Critical Security Update • Released Jan 9, 2025</CardDescription>
              </div>
              <Badge variant="destructive">Critical</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Security update that addresses vulnerabilities in Windows kernel and networking components.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Deployment Progress</span>
                  <span className="font-medium">85 / 150 (57%)</span>
                </div>
                <Progress value={57} className="h-2" />
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm">Deploy Now</Button>
                <Button size="sm" variant="outline">Schedule</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  .NET Framework 4.8.1 Update
                </CardTitle>
                <CardDescription>Feature Update • Released Jan 5, 2025</CardDescription>
              </div>
              <Badge variant="secondary">Scheduled</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Updates .NET Framework with performance improvements and bug fixes.
              </p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Scheduled Date:</span>
                <span className="font-medium">Jan 15, 2025 at 2:00 AM</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Windows Defender Definition Update
                </CardTitle>
                <CardDescription>Security Update • Deployed Jan 10, 2025</CardDescription>
              </div>
              <Badge variant="outline">Completed</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Latest virus and threat definitions for Windows Defender.
              </p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Deployment Status:</span>
                <span className="font-medium text-green-600">150 / 150 (100%)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Updates;
