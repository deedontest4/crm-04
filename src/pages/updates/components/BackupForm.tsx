import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import FormInput from "@/components/common/FormInput";
import FormSelect from "@/components/common/FormSelect";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface BackupFormProps {
  backup?: any;
  onClose: () => void;
}

const BackupForm = ({ backup, onClose }: BackupFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    backup_name: "",
    backup_type: "System",
    backup_date: "",
    status: "In Progress",
    verified_by: "",
    notes: "",
  });

  // Fetch tech leads and admins for verification
  const { data: users = [] } = useQuery({
    queryKey: ["tech-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("role", ["tech_lead", "admin"])
        .order("full_name");

      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (backup) {
      setFormData({
        backup_name: backup.backup_name || "",
        backup_type: backup.backup_type || "System",
        backup_date: backup.backup_date
          ? new Date(backup.backup_date).toISOString().slice(0, 16)
          : "",
        status: backup.status || "In Progress",
        verified_by: backup.verified_by || "",
        notes: backup.notes || "",
      });
    }
  }, [backup]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (backup) {
        const { error } = await supabase
          .from("backups")
          .update(data)
          .eq("id", backup.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("backups").insert([
          {
            ...data,
            created_by: user?.id,
          },
        ]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backups"] });
      toast({
        title: "Success",
        description: backup
          ? "Backup record updated successfully"
          : "Backup record created successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save backup",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: any = {
      backup_name: formData.backup_name,
      backup_type: formData.backup_type,
      backup_date: new Date(formData.backup_date).toISOString(),
      status: formData.status,
      notes: formData.notes,
    };

    if (formData.verified_by) {
      submitData.verified_by = formData.verified_by;
      submitData.verified_at = new Date().toISOString();
    }

    saveMutation.mutate(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormInput
        id="backup_name"
        label="Backup Name"
        value={formData.backup_name}
        onChange={(value) => setFormData({ ...formData, backup_name: value })}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <FormSelect
          id="backup_type"
          label="Backup Type"
          value={formData.backup_type}
          onChange={(value) => setFormData({ ...formData, backup_type: value })}
          options={[
            { value: "System", label: "System" },
            { value: "Server", label: "Server" },
            { value: "Database", label: "Database" },
            { value: "Full", label: "Full" },
          ]}
          required
        />
        <FormSelect
          id="status"
          label="Status"
          value={formData.status}
          onChange={(value) => setFormData({ ...formData, status: value })}
          options={[
            { value: "In Progress", label: "In Progress" },
            { value: "Success", label: "Success" },
            { value: "Failed", label: "Failed" },
            { value: "Partial", label: "Partial" },
          ]}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="backup_date">Backup Date & Time</Label>
        <input
          type="datetime-local"
          id="backup_date"
          value={formData.backup_date}
          onChange={(e) =>
            setFormData({ ...formData, backup_date: e.target.value })
          }
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          required
        />
      </div>

      <FormSelect
        id="verified_by"
        label="Verified By"
        value={formData.verified_by}
        onChange={(value) => setFormData({ ...formData, verified_by: value })}
        options={[
          { value: "", label: "Not verified" },
          ...users.map((u) => ({
            value: u.user_id,
            label: u.full_name,
          })),
        ]}
      />

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes..."
          rows={3}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving..." : backup ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
};

export default BackupForm;
