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

interface MaintenanceFormProps {
  maintenance?: any;
  onClose: () => void;
}

const MaintenanceForm = ({ maintenance, onClose }: MaintenanceFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    asset_name: "",
    maintenance_type: "Scheduled",
    scheduled_date: "",
    performed_by: "",
    status: "Scheduled",
    description: "",
    notes: "",
  });

  // Fetch tech leads and admins for assignment
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
    if (maintenance) {
      setFormData({
        asset_name: maintenance.asset_name || "",
        maintenance_type: maintenance.maintenance_type || "Scheduled",
        scheduled_date: maintenance.scheduled_date
          ? new Date(maintenance.scheduled_date).toISOString().slice(0, 16)
          : "",
        performed_by: maintenance.performed_by || "",
        status: maintenance.status || "Scheduled",
        description: maintenance.description || "",
        notes: maintenance.notes || "",
      });
    }
  }, [maintenance]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (maintenance) {
        const { error } = await supabase
          .from("maintenance")
          .update(data)
          .eq("id", maintenance.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("maintenance").insert([
          {
            ...data,
            created_by: user?.id,
          },
        ]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      toast({
        title: "Success",
        description: maintenance
          ? "Maintenance record updated successfully"
          : "Maintenance record created successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save maintenance",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: any = {
      asset_name: formData.asset_name,
      maintenance_type: formData.maintenance_type,
      scheduled_date: new Date(formData.scheduled_date).toISOString(),
      status: formData.status,
      description: formData.description,
      notes: formData.notes,
    };

    if (formData.performed_by) {
      submitData.performed_by = formData.performed_by;
    }

    saveMutation.mutate(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormInput
        id="asset_name"
        label="Asset Name"
        value={formData.asset_name}
        onChange={(value) => setFormData({ ...formData, asset_name: value })}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <FormSelect
          id="maintenance_type"
          label="Maintenance Type"
          value={formData.maintenance_type}
          onChange={(value) => setFormData({ ...formData, maintenance_type: value })}
          options={[
            { value: "Preventive", label: "Preventive" },
            { value: "Corrective", label: "Corrective" },
            { value: "Scheduled", label: "Scheduled" },
            { value: "Emergency", label: "Emergency" },
          ]}
          required
        />
        <FormSelect
          id="status"
          label="Status"
          value={formData.status}
          onChange={(value) => setFormData({ ...formData, status: value })}
          options={[
            { value: "Scheduled", label: "Scheduled" },
            { value: "In Progress", label: "In Progress" },
            { value: "Completed", label: "Completed" },
            { value: "Cancelled", label: "Cancelled" },
          ]}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="scheduled_date">Scheduled Date & Time</Label>
        <input
          type="datetime-local"
          id="scheduled_date"
          value={formData.scheduled_date}
          onChange={(e) =>
            setFormData({ ...formData, scheduled_date: e.target.value })
          }
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          required
        />
      </div>

      <FormSelect
        id="performed_by"
        label="Performed By"
        value={formData.performed_by}
        onChange={(value) => setFormData({ ...formData, performed_by: value })}
        options={[
          { value: "", label: "Select a user" },
          ...users.map((u) => ({
            value: u.user_id,
            label: u.full_name,
          })),
        ]}
      />

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Maintenance description..."
          rows={3}
        />
      </div>

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
          {saveMutation.isPending ? "Saving..." : maintenance ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
};

export default MaintenanceForm;
