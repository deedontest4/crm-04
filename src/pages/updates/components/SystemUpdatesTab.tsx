import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, Plus, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import SystemUpdateForm from "./SystemUpdateForm";
import { format } from "date-fns";

const SystemUpdatesTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<any>(null);

  // Fetch system updates
  const { data: updates = [], isLoading } = useQuery({
    queryKey: ["system-updates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_updates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      
      if (status === "Installed" || status === "Verified") {
        updates.installed_on = new Date().toISOString();
      }

      const { error } = await supabase
        .from("system_updates")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-updates"] });
      toast({
        title: "Success",
        description: "Update status changed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    },
  });

  // Calculate compliance
  const totalUpdates = updates.length;
  const installedUpdates = updates.filter(
    (u) => u.status === "Installed" || u.status === "Verified"
  ).length;
  const compliancePercentage =
    totalUpdates > 0 ? Math.round((installedUpdates / totalUpdates) * 100) : 0;

  // Filter updates
  const filteredUpdates = updates.filter((update) => {
    const matchesSearch =
      update.device_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      update.patch_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || update.status === statusFilter;
    const matchesType = typeFilter === "all" || update.update_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      Pending: "secondary",
      Installed: "default",
      Failed: "destructive",
      Verified: "outline",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const handleEdit = (update: any) => {
    setEditingUpdate(update);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingUpdate(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Update Compliance</CardTitle>
          <CardDescription>Overall system update compliance status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Systems Up to Date</span>
              <span className="font-medium">
                {installedUpdates} / {totalUpdates} ({compliancePercentage}%)
              </span>
            </div>
            <Progress value={compliancePercentage} className="h-2" />
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">
                {updates.filter((u) => u.status === "Pending").length}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Installed</p>
              <p className="text-2xl font-bold text-green-600">
                {installedUpdates}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Failed</p>
              <p className="text-2xl font-bold text-destructive">
                {updates.filter((u) => u.status === "Failed").length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Updates</CardTitle>
              <CardDescription>Track and manage OS and software updates</CardDescription>
            </div>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingUpdate(null)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Update
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingUpdate ? "Edit Update" : "Add New Update"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingUpdate
                      ? "Update system update information"
                      : "Add a new system update record"}
                  </DialogDescription>
                </DialogHeader>
                <SystemUpdateForm
                  update={editingUpdate}
                  onClose={handleCloseForm}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by device name or patch ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Installed">Installed</SelectItem>
                <SelectItem value="Failed">Failed</SelectItem>
                <SelectItem value="Verified">Verified</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Security">Security</SelectItem>
                <SelectItem value="Feature">Feature</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="Optional">Optional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device Name</TableHead>
                  <TableHead>OS Version</TableHead>
                  <TableHead>Update Version</TableHead>
                  <TableHead>Patch ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Checked</TableHead>
                  <TableHead>Installed On</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredUpdates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      No updates found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUpdates.map((update) => (
                    <TableRow key={update.id}>
                      <TableCell className="font-medium">{update.device_name}</TableCell>
                      <TableCell>{update.os_version}</TableCell>
                      <TableCell>{update.update_version}</TableCell>
                      <TableCell>{update.patch_id}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{update.update_type}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(update.status)}</TableCell>
                      <TableCell>
                        {format(new Date(update.last_checked), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {update.installed_on
                          ? format(new Date(update.installed_on), "MMM d, yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(update)}
                          >
                            Edit
                          </Button>
                          {update.status === "Pending" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: update.id,
                                  status: "Installed",
                                })
                              }
                            >
                              Mark Installed
                            </Button>
                          )}
                          {update.status === "Installed" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: update.id,
                                  status: "Verified",
                                })
                              }
                            >
                              Verify
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default SystemUpdatesTab;
