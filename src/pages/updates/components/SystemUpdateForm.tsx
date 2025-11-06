import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import FormInput from "@/components/common/FormInput";
import FormSelect from "@/components/common/FormSelect";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface SystemUpdateFormProps {
  update?: any;
  onClose: () => void;
}

const SystemUpdateForm = ({ update, onClose }: SystemUpdateFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    device_name: "",
    os_version: "",
    update_version: "",
    patch_id: "",
    update_type: "Security",
    status: "Pending",
    installed_on: "",
    remarks: "",
  });

  useEffect(() => {
    if (update) {
      setFormData({
        device_name: update.device_name || "",
        os_version: update.os_version || "",
        update_version: update.update_version || "",
        patch_id: update.patch_id || "",
        update_type: update.update_type || "Security",
        status: update.status || "Pending",
        installed_on: update.installed_on
          ? new Date(update.installed_on).toISOString().split("T")[0]
          : "",
        remarks: update.remarks || "",
      });
    }
  }, [update]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (update) {
        const { error } = await supabase
          .from("system_updates")
          .update(data)
          .eq("id", update.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("system_updates").insert([
          {
            ...data,
            created_by: user?.id,
          },
        ]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-updates"] });
      toast({
        title: "Success",
        description: update
          ? "Update record updated successfully"
          : "Update record created successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save update",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: any = {
      device_name: formData.device_name,
      os_version: formData.os_version,
      update_version: formData.update_version,
      patch_id: formData.patch_id,
      update_type: formData.update_type,
      status: formData.status,
      remarks: formData.remarks,
    };

    if (formData.installed_on) {
      submitData.installed_on = new Date(formData.installed_on).toISOString();
    }

    saveMutation.mutate(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormInput
        id="device_name"
        label="Device Name"
        value={formData.device_name}
        onChange={(value) => setFormData({ ...formData, device_name: value })}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <FormInput
          id="os_version"
          label="OS Version"
          value={formData.os_version}
          onChange={(value) => setFormData({ ...formData, os_version: value })}
          required
        />
        <FormInput
          id="update_version"
          label="Update Version"
          value={formData.update_version}
          onChange={(value) => setFormData({ ...formData, update_version: value })}
          required
        />
      </div>

      <FormInput
        id="patch_id"
        label="Patch ID"
        value={formData.patch_id}
        onChange={(value) => setFormData({ ...formData, patch_id: value })}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <FormSelect
          id="update_type"
          label="Update Type"
          value={formData.update_type}
          onChange={(value) => setFormData({ ...formData, update_type: value })}
          options={[
            { value: "Security", label: "Security" },
            { value: "Feature", label: "Feature" },
            { value: "Critical", label: "Critical" },
            { value: "Optional", label: "Optional" },
          ]}
          required
        />
        <FormSelect
          id="status"
          label="Status"
          value={formData.status}
          onChange={(value) => setFormData({ ...formData, status: value })}
          options={[
            { value: "Pending", label: "Pending" },
            { value: "Installed", label: "Installed" },
            { value: "Failed", label: "Failed" },
            { value: "Verified", label: "Verified" },
          ]}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="installed_on">Installed On</Label>
        <input
          type="date"
          id="installed_on"
          value={formData.installed_on}
          onChange={(e) =>
            setFormData({ ...formData, installed_on: e.target.value })
          }
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="remarks">Remarks</Label>
        <Textarea
          id="remarks"
          value={formData.remarks}
          onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
          placeholder="Additional notes..."
          rows={3}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving..." : update ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
};

export default SystemUpdateForm;
