import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import FormInput from "@/components/common/FormInput";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { Plus, Trash2, Shield } from "lucide-react";

interface WarrantySectionProps {
  assetId: string;
}

export function WarrantySection({ assetId }: WarrantySectionProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [warranties, setWarranties] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    vendor: '',
    start_date: '',
    expiry_date: '',
    coverage_notes: ''
  });

  useEffect(() => {
    loadWarranties();
  }, [assetId]);

  const loadWarranties = async () => {
    const { data } = await supabase
      .from('warranties')
      .select('*')
      .eq('asset_id', assetId)
      .order('expiry_date', { ascending: false });

    if (data) setWarranties(data);
  };

  const handleSubmit = async () => {
    if (!formData.vendor || !formData.start_date || !formData.expiry_date) {
      toast({
        title: "Validation Error",
        description: "Vendor, start date, and expiry date are required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('warranties')
        .insert({
          asset_id: assetId,
          ...formData,
          created_by: user?.id
        });

      if (error) throw error;

      // Log activity
      await supabase.from('activity_logs').insert({
        entity_type: 'warranty',
        entity_id: assetId,
        action: 'Added',
        description: `Warranty added for vendor ${formData.vendor}`,
        performed_by: user?.id
      });

      toast({
        title: "Success",
        description: "Warranty added successfully"
      });

      setFormData({ vendor: '', start_date: '', expiry_date: '', coverage_notes: '' });
      setShowForm(false);
      loadWarranties();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this warranty?')) return;

    try {
      const { error } = await supabase
        .from('warranties')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Warranty deleted successfully"
      });

      loadWarranties();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getRenewalBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge variant="default">Active</Badge>;
      case 'Expiring':
        return <Badge variant="secondary">Expiring Soon</Badge>;
      case 'Expired':
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-1">Warranty Management</h3>
          <p className="text-sm text-muted-foreground">Track warranty information and renewal dates</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Warranty
        </Button>
      </div>
      <Separator />

      {showForm && (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              id="vendor"
              label="Vendor"
              value={formData.vendor}
              onChange={(value) => setFormData({ ...formData, vendor: value })}
              required
            />
            <FormInput
              id="start_date"
              label="Start Date"
              type="date"
              value={formData.start_date}
              onChange={(value) => setFormData({ ...formData, start_date: value })}
              required
            />
            <FormInput
              id="expiry_date"
              label="Expiry Date"
              type="date"
              value={formData.expiry_date}
              onChange={(value) => setFormData({ ...formData, expiry_date: value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverage_notes">Coverage Notes</Label>
            <Textarea
              id="coverage_notes"
              value={formData.coverage_notes}
              onChange={(e) => setFormData({ ...formData, coverage_notes: e.target.value })}
              placeholder="Enter warranty coverage details..."
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={loading}>
              <Shield className="mr-2 h-4 w-4" />
              {loading ? 'Saving...' : 'Save Warranty'}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Coverage Notes</TableHead>
              <TableHead className="w-[80px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {warranties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No warranties found
                </TableCell>
              </TableRow>
            ) : (
              warranties.map((warranty) => (
                <TableRow key={warranty.id}>
                  <TableCell className="font-medium">{warranty.vendor}</TableCell>
                  <TableCell>{format(new Date(warranty.start_date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{format(new Date(warranty.expiry_date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{getRenewalBadge(warranty.renewal_status)}</TableCell>
                  <TableCell className="max-w-xs truncate">{warranty.coverage_notes || '-'}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(warranty.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
