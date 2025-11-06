import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";

interface SubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: any;
  onSuccess: () => void;
}

export function SubscriptionDialog({
  open,
  onOpenChange,
  subscription,
  onSuccess,
}: SubscriptionDialogProps) {
  const { toast } = useToast();
  const { profile } = useAuth();

  const [formData, setFormData] = useState({
    tool_name: "",
    vendor: "",
    category: "",
    cost: "",
    billing_cycle: "monthly",
    renewal_date: "",
    status: "active",
    seats_total: "",
    seats_used: "",
    notes: "",
  });

  useEffect(() => {
    if (subscription) {
      setFormData({
        tool_name: subscription.tool_name || "",
        vendor: subscription.vendor || "",
        category: subscription.category || "",
        cost: subscription.cost?.toString() || "",
        billing_cycle: subscription.billing_cycle || "monthly",
        renewal_date: subscription.renewal_date || "",
        status: subscription.status || "active",
        seats_total: subscription.seats_total?.toString() || "",
        seats_used: subscription.seats_used?.toString() || "",
        notes: subscription.notes || "",
      });
    } else {
      setFormData({
        tool_name: "",
        vendor: "",
        category: "",
        cost: "",
        billing_cycle: "monthly",
        renewal_date: "",
        status: "active",
        seats_total: "",
        seats_used: "",
        notes: "",
      });
    }
  }, [subscription, open]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        tool_name: formData.tool_name,
        vendor: formData.vendor,
        category: formData.category,
        cost: parseFloat(formData.cost) || 0,
        billing_cycle: formData.billing_cycle,
        renewal_date: formData.renewal_date,
        status: formData.status,
        seats_total: formData.seats_total ? parseInt(formData.seats_total) : null,
        seats_used: formData.seats_used ? parseInt(formData.seats_used) : null,
        notes: formData.notes || null,
        created_by: profile?.user_id,
      };

      if (subscription) {
        const { error } = await supabase
          .from("subscriptions")
          .update(payload)
          .eq("id", subscription.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("subscriptions").insert([payload]);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: subscription ? "Subscription updated" : "Subscription added",
        description: `The subscription has been ${subscription ? "updated" : "added"} successfully.`,
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {subscription ? "Edit Subscription" : "Add Subscription"}
          </DialogTitle>
          <DialogDescription>
            {subscription
              ? "Update subscription details"
              : "Add a new tool subscription to track"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tool_name">Tool Name *</Label>
              <Input
                id="tool_name"
                value={formData.tool_name}
                onChange={(e) => setFormData({ ...formData, tool_name: e.target.value })}
                placeholder="e.g., Slack, GitHub, Figma"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor *</Label>
              <Input
                id="vendor"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                placeholder="e.g., Slack Technologies"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Communication">Communication</SelectItem>
                  <SelectItem value="Development">Development</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Project Management">Project Management</SelectItem>
                  <SelectItem value="Analytics">Analytics</SelectItem>
                  <SelectItem value="Security">Security</SelectItem>
                  <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Cost *</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billing_cycle">Billing Cycle *</Label>
              <Select
                value={formData.billing_cycle}
                onValueChange={(value) => setFormData({ ...formData, billing_cycle: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select billing cycle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="renewal_date">Renewal Date *</Label>
              <Input
                id="renewal_date"
                type="date"
                value={formData.renewal_date}
                onChange={(e) => setFormData({ ...formData, renewal_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expiring">Expiring Soon</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="seats_total">Total Seats</Label>
                <Input
                  id="seats_total"
                  type="number"
                  value={formData.seats_total}
                  onChange={(e) => setFormData({ ...formData, seats_total: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seats_used">Used Seats</Label>
                <Input
                  id="seats_used"
                  type="number"
                  value={formData.seats_used}
                  onChange={(e) => setFormData({ ...formData, seats_used: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes or details"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? "Saving..."
                : subscription
                ? "Update"
                : "Add Subscription"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
