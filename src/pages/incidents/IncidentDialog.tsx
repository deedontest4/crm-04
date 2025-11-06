import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";

interface IncidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incident: any | null;
  onSuccess: () => void;
}

export default function IncidentDialog({ open, onOpenChange, incident, onSuccess }: IncidentDialogProps) {
  const { profile, isAdmin, isManagerOrAbove } = useAuth();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    impacted_service: "",
    severity: "medium",
    priority: "medium",
    status: "open",
    assigned_to: "unassigned",
    root_cause: "",
    resolution_summary: "",
  });

  useEffect(() => {
    if (open) {
      fetchUsers();
      if (incident) {
        setFormData({
          title: incident.title || "",
          description: incident.description || "",
          impacted_service: incident.impacted_service || "",
          severity: incident.severity || "medium",
          priority: incident.priority || "medium",
          status: incident.status || "open",
          assigned_to: incident.assigned_to || "unassigned",
          root_cause: incident.root_cause || "",
          resolution_summary: incident.resolution_summary || "",
        });
      } else {
        setFormData({
          title: "",
          description: "",
          impacted_service: "",
          severity: "medium",
          priority: "medium",
          status: "open",
          assigned_to: "unassigned",
          root_cause: "",
          resolution_summary: "",
        });
      }
      setAttachments([]);
    }
  }, [open, incident]);

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("user_id, full_name, email").eq("status", "active");
    if (data) setUsers(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  const uploadAttachments = async (incidentId: string) => {
    if (!profile || attachments.length === 0) return;

    for (const file of attachments) {
      const filePath = `${profile.user_id}/${incidentId}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("incident-attachments")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        continue;
      }

      await supabase.from("incident_attachments").insert({
        incident_id: incidentId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        uploaded_by: profile.user_id,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    // Validation for closing
    if (formData.status === "closed") {
      if (!formData.root_cause || !formData.resolution_summary) {
        toast.error("Root Cause and Resolution Summary are required to close an incident");
        return;
      }
    }

    setLoading(true);

    try {
      const dataToSave: any = {
        ...formData,
        assigned_to: formData.assigned_to === "unassigned" ? null : formData.assigned_to,
      };

      if (formData.status === "resolved" && !incident?.resolved_at) {
        dataToSave.resolved_at = new Date().toISOString();
      }

      if (formData.status === "closed" && !incident?.closed_at) {
        dataToSave.closed_at = new Date().toISOString();
      }

      if (incident) {
        // Update existing incident
        const { error } = await supabase
          .from("incidents")
          .update(dataToSave)
          .eq("id", incident.id);

        if (error) throw error;
        
        await uploadAttachments(incident.id);
        toast.success("Incident updated successfully");
      } else {
        // Create new incident
        dataToSave.reported_by = profile.user_id;
        
        const { data: newIncident, error } = await supabase
          .from("incidents")
          .insert(dataToSave)
          .select()
          .single();

        if (error) throw error;
        
        await uploadAttachments(newIncident.id);
        toast.success("Incident created successfully");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving incident:", error);
      toast.error(error.message || "Failed to save incident");
    } finally {
      setLoading(false);
    }
  };

  const canEditAssignment = isAdmin || isManagerOrAbove;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{incident ? "Edit Incident" : "Create Incident"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="impacted_service">Impacted Service *</Label>
              <Input
                id="impacted_service"
                value={formData.impacted_service}
                onChange={(e) => setFormData({ ...formData, impacted_service: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="severity">Severity *</Label>
              <Select value={formData.severity} onValueChange={(value) => setFormData({ ...formData, severity: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority *</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status *</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({ ...formData, status: value })}
                disabled={!canEditAssignment}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="assigned_to">Assigned To</Label>
              <Select 
                value={formData.assigned_to} 
                onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
                disabled={!canEditAssignment}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      {user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="root_cause">Root Cause</Label>
              <Textarea
                id="root_cause"
                value={formData.root_cause}
                onChange={(e) => setFormData({ ...formData, root_cause: e.target.value })}
                rows={2}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="resolution_summary">Resolution Summary</Label>
              <Textarea
                id="resolution_summary"
                value={formData.resolution_summary}
                onChange={(e) => setFormData({ ...formData, resolution_summary: e.target.value })}
                rows={2}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="attachments">Attachments</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="attachments"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("attachments")?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Files
                </Button>
                {attachments.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {attachments.length} file(s) selected
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : incident ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
