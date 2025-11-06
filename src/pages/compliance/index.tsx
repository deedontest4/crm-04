import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, FileText, AlertCircle, CheckCircle, Plus } from "lucide-react";

const Compliance = () => {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex-shrink-0 p-6 pb-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Compliance & IT Policy</h1>
            <p className="text-muted-foreground">Manage compliance standards and IT policies</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Policy
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden p-6 pt-0">
        <TabsList className="flex-shrink-0">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="policies">IT Policies</TabsTrigger>
          <TabsTrigger value="audits">Audits</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex-1 overflow-auto mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Compliance Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">94%</div>
                <p className="text-xs text-muted-foreground mt-1">Above target (90%)</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Active Policies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">28</div>
                <p className="text-xs text-muted-foreground mt-1">2 pending review</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Open Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">3</div>
                <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Compliance Standards</CardTitle>
              <CardDescription>Current compliance status across frameworks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">ISO 27001</p>
                    <p className="text-sm text-muted-foreground">Information Security Management</p>
                  </div>
                </div>
                <Badge>Compliant</Badge>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">GDPR</p>
                    <p className="text-sm text-muted-foreground">Data Protection Regulation</p>
                  </div>
                </div>
                <Badge>Compliant</Badge>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium">SOC 2 Type II</p>
                    <p className="text-sm text-muted-foreground">Service Organization Controls</p>
                  </div>
                </div>
                <Badge variant="secondary">In Progress</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="flex-1 overflow-auto mt-4 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Acceptable Use Policy
                  </CardTitle>
                  <CardDescription>Last updated: Dec 15, 2024 • Version 2.1</CardDescription>
                </div>
                <Badge>Active</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Defines acceptable use of company IT resources including computers, networks, and software.
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">View Policy</Button>
                <Button size="sm" variant="outline">Edit</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Data Protection Policy
                  </CardTitle>
                  <CardDescription>Last updated: Jan 5, 2025 • Version 3.0</CardDescription>
                </div>
                <Badge>Active</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Guidelines for handling, storing, and protecting sensitive company and customer data.
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">View Policy</Button>
                <Button size="sm" variant="outline">Edit</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    Password Security Policy
                  </CardTitle>
                  <CardDescription>Last updated: Nov 20, 2024 • Version 1.5</CardDescription>
                </div>
                <Badge variant="secondary">Review Required</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Requirements for password complexity, rotation, and multi-factor authentication.
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">View Policy</Button>
                <Button size="sm" variant="outline">Edit</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audits" className="flex-1 overflow-auto mt-4 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Quarterly Security Audit Q4 2024</CardTitle>
                  <CardDescription>Completed on Dec 20, 2024</CardDescription>
                </div>
                <Badge>Passed</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Audit Score:</span>
                  <span className="font-medium">96%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Findings:</span>
                  <span className="font-medium">2 Minor Issues</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium text-green-600">All Resolved</span>
                </div>
                <Button size="sm" variant="outline" className="mt-2">View Report</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Annual Compliance Audit 2024</CardTitle>
                  <CardDescription>Scheduled for Jan 25, 2025</CardDescription>
                </div>
                <Badge variant="secondary">Upcoming</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Comprehensive annual audit of all compliance standards and IT policies.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Compliance;
