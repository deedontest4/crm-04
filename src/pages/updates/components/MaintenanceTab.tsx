import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import MaintenanceForm from "./MaintenanceForm";
import { format } from "date-fns";

interface MaintenanceRecord {
  id: string;
  asset_name: string;
  maintenance_type: string;
  scheduled_date: string;
  performed_by: string | null;
  status: string;
  description: string;
  notes: string;
  performed_by_name?: string;
  [key: string]: any;
}

const MaintenanceTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<any>(null);

  // Fetch maintenance records
  const { data: maintenanceRecords = [], isLoading } = useQuery<MaintenanceRecord[]>({
    queryKey: ["maintenance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance")
        .select("*")
        .order("scheduled_date", { ascending: false });

      if (error) throw error;

      // Fetch user names separately
      if (data && data.length > 0) {
        const userIds = data.map(m => m.performed_by).filter(Boolean);
        const { data: users } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);

        return data.map(m => ({
          ...m,
          performed_by_name: users?.find(u => u.user_id === m.performed_by)?.full_name
        })) as MaintenanceRecord[];
      }

      return data as MaintenanceRecord[] || [];
    },
  });

  // Filter maintenance
  const filteredMaintenance = maintenanceRecords.filter((record) =>
    record.asset_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      Scheduled: "secondary",
      "In Progress": "default",
      Completed: "outline",
      Cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const handleEdit = (maintenance: any) => {
    setEditingMaintenance(maintenance);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingMaintenance(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Scheduled Maintenance</CardTitle>
            <CardDescription>Track and manage scheduled maintenance activities</CardDescription>
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingMaintenance(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Maintenance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingMaintenance ? "Edit Maintenance" : "Add New Maintenance"}
                </DialogTitle>
                <DialogDescription>
                  {editingMaintenance
                    ? "Update maintenance record"
                    : "Schedule a new maintenance activity"}
                </DialogDescription>
              </DialogHeader>
              <MaintenanceForm
                maintenance={editingMaintenance}
                onClose={handleCloseForm}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by asset name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Scheduled Date</TableHead>
                <TableHead>Performed By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredMaintenance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No maintenance records found
                  </TableCell>
                </TableRow>
              ) : (
                filteredMaintenance.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.asset_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{record.maintenance_type}</Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(record.scheduled_date), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      {record.performed_by_name || "Unassigned"}
                    </TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(record)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default MaintenanceTab;
