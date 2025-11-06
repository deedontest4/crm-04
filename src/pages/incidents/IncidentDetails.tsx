import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Download, FileText, Clock, AlertTriangle } from "lucide-react";
import IncidentComments from "./IncidentComments";
import IncidentTimeline from "./IncidentTimeline";
import { toast } from "sonner";

interface IncidentDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incident: any;
}

export default function IncidentDetails({ open, onOpenChange, incident }: IncidentDetailsProps) {
  const [attachments, setAttachments] = useState<any[]>([]);
  const [reportedByName, setReportedByName] = useState("");
  const [assignedToName, setAssignedToName] = useState("");

  useEffect(() => {
    if (incident && open) {
      fetchAttachments();
      fetchUserNames();
    }
  }, [incident, open]);

  const fetchAttachments = async () => {
    const { data } = await supabase
      .from("incident_attachments")
      .select("*")
      .eq("incident_id", incident.id);
    if (data) setAttachments(data);
  };

  const fetchUserNames = async () => {
    if (incident.reported_by) {
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", incident.reported_by)
        .single();
      if (data) setReportedByName(data.full_name);
    }

    if (incident.assigned_to) {
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", incident.assigned_to)
        .single();
      if (data) setAssignedToName(data.full_name);
    }
  };

  const downloadAttachment = async (attachment: any) => {
    try {
      const { data, error } = await supabase.storage
        .from("incident-attachments")
        .download(attachment.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download file");
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

  if (!incident) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{incident.ticket_number} - {incident.title}</span>
            <div className="flex gap-2">
              <Badge variant={getSeverityColor(incident.severity)}>
                Severity: {incident.severity}
              </Badge>
              <Badge variant={getPriorityColor(incident.priority)}>
                Priority: {incident.priority}
              </Badge>
              <Badge variant={getStatusColor(incident.status)}>
                {incident.status}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* SLA Status */}
          {(incident.sla_response_breached || incident.sla_resolution_breached) && (
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">SLA Breach Alert</span>
                </div>
                <div className="mt-2 space-y-1 text-sm">
                  {incident.sla_response_breached && (
                    <p>• Response time SLA breached (Target: {incident.sla_target_response_hours}h)</p>
                  )}
                  {incident.sla_resolution_breached && (
                    <p>• Resolution time SLA breached (Target: {incident.sla_target_resolution_hours}h)</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Impacted Service</p>
              <p className="text-sm">{incident.impacted_service}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Reported By</p>
              <p className="text-sm">{reportedByName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Assigned To</p>
              <p className="text-sm">{assignedToName || "Unassigned"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created</p>
              <p className="text-sm">{format(new Date(incident.created_at), "PPp")}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">SLA Response Time</p>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <p className="text-sm">{incident.sla_target_response_hours}h</p>
                {incident.first_response_at && (
                  <Badge variant="default" className="text-xs">Met</Badge>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">SLA Resolution Time</p>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <p className="text-sm">{incident.sla_target_resolution_hours}h</p>
              </div>
            </div>
          </div>

          {incident.description && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
              <p className="text-sm whitespace-pre-wrap">{incident.description}</p>
            </div>
          )}

          {incident.root_cause && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Root Cause</p>
              <p className="text-sm whitespace-pre-wrap">{incident.root_cause}</p>
            </div>
          )}

          {incident.resolution_summary && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Resolution Summary</p>
              <p className="text-sm whitespace-pre-wrap">{incident.resolution_summary}</p>
            </div>
          )}

          {attachments.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Attachments</p>
              <div className="space-y-2">
                {attachments.map((att) => (
                  <div key={att.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">{att.file_name}</span>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => downloadAttachment(att)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <IncidentTimeline incidentId={incident.id} createdAt={new Date(incident.created_at)} />
          
          <IncidentComments incidentId={incident.id} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
