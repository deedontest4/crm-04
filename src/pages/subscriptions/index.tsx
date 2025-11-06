import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, DollarSign, AlertCircle, RefreshCw, CreditCard, Edit, Trash2 } from "lucide-react";
import DataTable, { Column } from "@/components/common/DataTable";
import PageHeader from "@/components/common/PageHeader";
import { SubscriptionDialog } from "./components/SubscriptionDialog";
import { format } from "date-fns";

interface Subscription {
  id: string;
  tool_name: string;
  vendor: string;
  cost: number;
  billing_cycle: string;
  renewal_date: string;
  status: string;
  category: string;
  seats_total?: number;
  seats_used?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export default function Subscriptions() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .order("renewal_date", { ascending: true });

      if (error) throw error;
      return data as Subscription[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("subscriptions")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      toast({
        title: "Subscription deleted",
        description: "The subscription has been removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary"> = {
      active: "default",
      expiring: "secondary",
      expired: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const columns: Column<Subscription>[] = [
    {
      key: "tool_name",
      header: "Tool Name",
      sortable: true,
    },
    {
      key: "vendor",
      header: "Vendor",
      sortable: true,
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
    },
    {
      key: "cost",
      header: "Cost",
      sortable: true,
      render: (value: number) => `$${value?.toFixed(2) || "0.00"}`,
    },
    {
      key: "billing_cycle",
      header: "Billing Cycle",
      sortable: true,
    },
    {
      key: "renewal_date",
      header: "Renewal Date",
      sortable: true,
      render: (value: string) => format(new Date(value), "MMM dd, yyyy"),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: getStatusBadge,
    },
    {
      key: "seats_used",
      header: "Seats",
      render: (value: number | undefined, row: Subscription) => 
        row.seats_total ? `${value || 0}/${row.seats_total}` : "N/A",
    },
    {
      key: "id",
      header: "Actions",
      render: (value: string, row: Subscription) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(row)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(value)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleEdit = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this subscription?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddNew = () => {
    setSelectedSubscription(null);
    setIsDialogOpen(true);
  };

  const totalMonthlyCost = subscriptions?.reduce((acc, sub) => {
    const cost = sub.cost || 0;
    if (sub.billing_cycle === "monthly") return acc + cost;
    if (sub.billing_cycle === "yearly") return acc + cost / 12;
    return acc;
  }, 0) || 0;

  const activeCount = subscriptions?.filter((s) => s.status === "active").length || 0;
  const expiringCount = subscriptions?.filter((s) => s.status === "expiring").length || 0;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex-shrink-0 p-6 pb-0">
        <PageHeader
          title="Subscriptions"
          description="Track and manage all your tool subscriptions"
          action={{
            label: "Add Subscription",
            onClick: handleAddNew,
            icon: Plus,
          }}
        />
      </div>

      <div className="flex-1 overflow-auto p-6 pt-4 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Monthly Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalMonthlyCost.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Estimated monthly spend</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCount}</div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expiringCount}</div>
              <p className="text-xs text-muted-foreground">Renew within 30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Subscriptions</CardTitle>
            <CardDescription>
              Manage your tool subscriptions, track renewals, and monitor costs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={subscriptions || []}
              columns={columns}
              loading={isLoading}
              searchPlaceholder="Search subscriptions..."
              emptyStateTitle="No subscriptions yet"
              emptyStateDescription="Start by adding your first tool subscription"
              emptyStateIcon={CreditCard}
            />
          </CardContent>
        </Card>
      </div>

      <SubscriptionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        subscription={selectedSubscription}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
          setIsDialogOpen(false);
          setSelectedSubscription(null);
        }}
      />
    </div>
  );
}
