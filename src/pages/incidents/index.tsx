import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, AlertCircle, Activity, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import IncidentDialog from "./IncidentDialog";
import IncidentDetails from "./IncidentDetails";
import DataTable, { Column } from "@/components/common/DataTable";

export default function Incidents() {
  const { profile } = useAuth();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    critical: 0,
    avgResolutionTime: 0,
  });

  useEffect(() => {
    fetchIncidents();
  }, []);

  useEffect(() => {
    applyFilters();
    calculateStats();
  }, [incidents, searchQuery, statusFilter, severityFilter, priorityFilter]);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("incidents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch profile names separately
      const incidentsWithProfiles = await Promise.all(
        (data || []).map(async (incident) => {
          let reported_by_profile = null;
          let assigned_to_profile = null;

          if (incident.reported_by) {
            const { data: reportedBy } = await supabase
              .from("profiles")
              .select("full_name, email")
              .eq("user_id", incident.reported_by)
              .single();
            reported_by_profile = reportedBy;
          }

          if (incident.assigned_to) {
            const { data: assignedTo } = await supabase
              .from("profiles")
              .select("full_name, email")
              .eq("user_id", incident.assigned_to)
              .single();
            assigned_to_profile = assignedTo;
          }

          return {
            ...incident,
            reported_by_profile,
            assigned_to_profile,
          };
        })
      );

      setIncidents(incidentsWithProfiles);
    } catch (error: any) {
      console.error("Error fetching incidents:", error);
      toast.error("Failed to load incidents");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = incidents;

    if (searchQuery) {
      filtered = filtered.filter(
        (inc) =>
          inc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inc.ticket_number?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((inc) => inc.status === statusFilter);
    }

    if (severityFilter !== "all") {
      filtered = filtered.filter((inc) => inc.severity === severityFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((inc) => inc.priority === priorityFilter);
    }

    setFilteredIncidents(filtered);
  };

  const calculateStats = () => {
    const total = incidents.length;
    const active = incidents.filter((inc) => inc.status === "open" || inc.status === "investigating").length;
    const critical = incidents.filter((inc) => inc.severity === "critical").length;

    const resolvedIncidents = incidents.filter((inc) => inc.resolved_at);
    let avgResolutionTime = 0;
    if (resolvedIncidents.length > 0) {
      const totalTime = resolvedIncidents.reduce((acc, inc) => {
        const created = new Date(inc.created_at).getTime();
        const resolved = new Date(inc.resolved_at).getTime();
        return acc + (resolved - created);
      }, 0);
      avgResolutionTime = Math.round(totalTime / resolvedIncidents.length / (1000 * 60 * 60)); // hours
    }

    setStats({ total, active, critical, avgResolutionTime });
  };

  const handleEdit = (incident: any) => {
    setSelectedIncident(incident);
    setDialogOpen(true);
  };

  const handleView = (incident: any) => {
    setSelectedIncident(incident);
    setDetailsOpen(true);
  };

  const handleDelete = async (incident: any) => {
    if (!confirm("Are you sure you want to delete this incident?")) return;

    try {
      const { error } = await supabase.from("incidents").delete().eq("id", incident.id);
      if (error) throw error;
      toast.success("Incident deleted");
      fetchIncidents();
    } catch (error: any) {
      console.error("Error deleting incident:", error);
      toast.error("Failed to delete incident");
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "secondary";
      case "low": return "outline";
      default: return "outline";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "secondary";
      case "low": return "outline";
      default: return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "destructive";
      case "investigating": return "secondary";
      case "resolved": return "default";
      case "closed": return "outline";
      default: return "outline";
    }
  };

  const columns: Column<any>[] = [
    {
      key: "ticket_number",
      header: "ID",
      render: (value, row) => (
        <Button variant="link" onClick={() => handleView(row)} className="p-0 h-auto">
          {value}
        </Button>
      ),
    },
    {
      key: "title",
      header: "Title",
    },
    {
      key: "impacted_service",
      header: "Impacted Service",
    },
    {
      key: "severity",
      header: "Severity",
      render: (value) => (
        <Badge variant={getSeverityColor(value)}>{value}</Badge>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      render: (value) => (
        <Badge variant={getPriorityColor(value)}>{value}</Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (value) => (
        <Badge variant={getStatusColor(value)}>{value}</Badge>
      ),
    },
    {
      key: "sla_response_breached",
      header: "SLA",
      render: (value, row) => {
        if (row.sla_response_breached || row.sla_resolution_breached) {
          return <Badge variant="destructive">Breached</Badge>;
        }
        if (row.status === 'resolved' || row.status === 'closed') {
          return <Badge variant="default">Met</Badge>;
        }
        return <Badge variant="secondary">On Track</Badge>;
      },
    },
    {
      key: "assigned_to_profile",
      header: "Assigned To",
      render: (value) => value?.full_name || "Unassigned",
    },
    {
      key: "created_at",
      header: "Created",
      render: (value) => format(new Date(value), "PP"),
    },
    {
      key: "id",
      header: "Actions",
      render: (_, row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => handleView(row)}>
            View
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleEdit(row)}>
            Edit
          </Button>
          {profile?.role === "admin" && (
            <Button size="sm" variant="ghost" onClick={() => handleDelete(row)}>
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex-shrink-0 p-6 pb-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Incident Management</h1>
            <p className="text-muted-foreground">Track and resolve system incidents</p>
          </div>
          <Button onClick={() => { setSelectedIncident(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            New Incident
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                <Activity className="h-5 w-5 text-destructive" />
                {stats.active}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Critical</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                {stats.critical}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Resolution Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {stats.avgResolutionTime}h
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 pt-0">
        <DataTable
          data={filteredIncidents}
          columns={columns}
          loading={loading}
          searchable={false}
          emptyStateTitle="No incidents found"
          emptyStateDescription="Create your first incident to get started"
        />
      </div>

      <IncidentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        incident={selectedIncident}
        onSuccess={fetchIncidents}
      />

      <IncidentDetails
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        incident={selectedIncident}
      />
    </div>
  );
}
