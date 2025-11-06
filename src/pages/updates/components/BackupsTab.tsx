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
import BackupForm from "./BackupForm";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface BackupRecord {
  id: string;
  backup_name: string;
  backup_type: string;
  backup_date: string;
  status: string;
  verified_by: string | null;
  verified_at: string | null;
  file_size: number | null;
  storage_path: string | null;
  notes: string;
  verified_by_name?: string;
  [key: string]: any;
}

const BackupsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBackup, setEditingBackup] = useState<any>(null);

  // Fetch backups
  const { data: backups = [], isLoading } = useQuery<BackupRecord[]>({
    queryKey: ["backups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("backups")
        .select("*")
        .order("backup_date", { ascending: false });

      if (error) throw error;

      // Fetch verified user names separately
      if (data && data.length > 0) {
        const userIds = data.map(b => b.verified_by).filter(Boolean);
        const { data: users } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);

        return data.map(b => ({
          ...b,
          verified_by_name: users?.find(u => u.user_id === b.verified_by)?.full_name
        })) as BackupRecord[];
      }

      return data as BackupRecord[] || [];
    },
  });

  // Filter backups
  const filteredBackups = backups.filter((backup) =>
    backup.backup_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate weekly backup success for chart
  const weeklyData = backups.reduce((acc: any[], backup) => {
    const date = new Date(backup.backup_date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = format(weekStart, "MMM dd");

    const existing = acc.find((item) => item.week === weekKey);
    if (existing) {
      if (backup.status === "Success") {
        existing.success += 1;
      } else if (backup.status === "Failed") {
        existing.failed += 1;
      }
      existing.total += 1;
    } else {
      acc.push({
        week: weekKey,
        success: backup.status === "Success" ? 1 : 0,
        failed: backup.status === "Failed" ? 1 : 0,
        total: 1,
      });
    }
    return acc;
  }, []);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      "In Progress": "secondary",
      Success: "default",
      Failed: "destructive",
      Partial: "outline",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const handleEdit = (backup: any) => {
    setEditingBackup(backup);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingBackup(null);
  };

  const successRate =
    backups.length > 0
      ? Math.round(
          (backups.filter((b) => b.status === "Success").length / backups.length) * 100
        )
      : 0;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Backup Success Rate</CardTitle>
          <CardDescription>Weekly backup completion status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-1">Overall Success Rate</p>
            <p className="text-3xl font-bold text-green-600">{successRate}%</p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="success" fill="hsl(var(--primary))" name="Success" />
              <Bar dataKey="failed" fill="hsl(var(--destructive))" name="Failed" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Backup History</CardTitle>
              <CardDescription>Recent system and server backups</CardDescription>
            </div>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingBackup(null)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Backup
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingBackup ? "Edit Backup" : "Add New Backup"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingBackup
                      ? "Update backup record"
                      : "Create a new backup record"}
                  </DialogDescription>
                </DialogHeader>
                <BackupForm backup={editingBackup} onClose={handleCloseForm} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search backups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Backup Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verified By</TableHead>
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
                ) : filteredBackups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No backup records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBackups.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell className="font-medium">{backup.backup_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{backup.backup_type}</Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(backup.backup_date), "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>{getStatusBadge(backup.status)}</TableCell>
                      <TableCell>
                        {backup.verified_by_name || "Not verified"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(backup)}
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
    </>
  );
};

export default BackupsTab;
