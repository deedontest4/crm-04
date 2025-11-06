import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import FormSelect from "@/components/common/FormSelect";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { Plus, Trash2, Key } from "lucide-react";

interface SoftwareLinksSectionProps {
  assetId: string;
}

export function SoftwareLinksSection({ assetId }: SoftwareLinksSectionProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<string>('');

  useEffect(() => {
    loadLinks();
    loadLicenses();
  }, [assetId]);

  const loadLinks = async () => {
    const { data } = await supabase
      .from('asset_software_links')
      .select('*, licenses(*)')
      .eq('asset_id', assetId)
      .order('assigned_date', { ascending: false });

    if (data) setLinks(data);
  };

  const loadLicenses = async () => {
    const { data } = await supabase
      .from('licenses')
      .select('*')
      .order('software_name');

    if (data) {
      setLicenses(data.map(l => ({ 
        value: l.id, 
        label: `${l.software_name} (${l.vendor})`
      })));
    }
  };

  const handleAdd = async () => {
    if (!selectedLicense) {
      toast({
        title: "Validation Error",
        description: "Please select a license",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('asset_software_links')
        .insert({
          asset_id: assetId,
          license_id: selectedLicense,
          created_by: user?.id
        });

      if (error) throw error;

      // Update seats_used count
      const { data: licenseData } = await supabase
        .from('licenses')
        .select('seats_used')
        .eq('id', selectedLicense)
        .single();
      
      if (licenseData) {
        await supabase
          .from('licenses')
          .update({ seats_used: (licenseData.seats_used || 0) + 1 })
          .eq('id', selectedLicense);
      }

      // Log activity
      await supabase.from('activity_logs').insert({
        entity_type: 'asset',
        entity_id: assetId,
        action: 'Software Linked',
        description: 'Software license linked to asset',
        performed_by: user?.id
      });

      toast({
        title: "Success",
        description: "Software linked successfully"
      });

      setSelectedLicense('');
      setShowForm(false);
      loadLinks();
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

  const handleDelete = async (linkId: string, licenseId: string) => {
    if (!confirm('Are you sure you want to remove this software link?')) return;

    try {
      const { error } = await supabase
        .from('asset_software_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;

      // Decrement seats_used count
      const { data: licenseData } = await supabase
        .from('licenses')
        .select('seats_used')
        .eq('id', licenseId)
        .single();
      
      if (licenseData && (licenseData.seats_used || 0) > 0) {
        await supabase
          .from('licenses')
          .update({ seats_used: licenseData.seats_used - 1 })
          .eq('id', licenseId);
      }

      toast({
        title: "Success",
        description: "Software link removed successfully"
      });

      loadLinks();
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
        return <Badge className="bg-green-500">Active</Badge>;
      case 'Expiring':
        return <Badge className="bg-yellow-500">Expiring</Badge>;
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
          <h3 className="text-lg font-semibold mb-1">Software Links</h3>
          <p className="text-sm text-muted-foreground">Associate software licenses with this asset</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Link Software
        </Button>
      </div>
      <Separator />

      {showForm && (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <FormSelect
            id="license"
            label="Select Software License"
            value={selectedLicense}
            onChange={setSelectedLicense}
            options={licenses}
            placeholder="Choose a license..."
          />

          <div className="flex gap-2">
            <Button onClick={handleAdd} disabled={loading}>
              <Key className="mr-2 h-4 w-4" />
              {loading ? 'Linking...' : 'Link Software'}
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
              <TableHead>Software Name</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>License Key</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {links.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No software linked to this asset
                </TableCell>
              </TableRow>
            ) : (
              links.map((link) => (
                <TableRow key={link.id}>
                  <TableCell className="font-medium">{link.licenses.software_name}</TableCell>
                  <TableCell>{link.licenses.vendor}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {link.licenses.license_key ? '****-****-****' : 'N/A'}
                    </code>
                  </TableCell>
                  <TableCell>
                    {link.licenses.expiry_date 
                      ? format(new Date(link.licenses.expiry_date), 'dd/MM/yyyy')
                      : 'No expiry'}
                  </TableCell>
                  <TableCell>{getRenewalBadge(link.licenses.renewal_status)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(link.id, link.license_id)}
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
