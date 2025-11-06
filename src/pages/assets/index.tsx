import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Settings, Edit, ArrowUpFromLine, ArrowDownToLine, Trash2, Shield, Link, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const Assets = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*, assigned_user:profiles!assigned_to(full_name, email)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssets(data || []);
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

  const handleSelectAsset = (assetId: string) => {
    const newSelected = new Set(selectedAssets);
    if (newSelected.has(assetId)) {
      newSelected.delete(assetId);
    } else {
      newSelected.add(assetId);
    }
    setSelectedAssets(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAssets(new Set(filteredAssets.map(a => a.id)));
    } else {
      setSelectedAssets(new Set());
    }
  };

  const handleEdit = () => {
    if (selectedAssets.size === 1) {
      const assetId = Array.from(selectedAssets)[0];
      navigate(`/assets/edit/${assetId}`);
    }
  };

  const handleCheckOut = () => {
    if (selectedAssets.size === 1) {
      const assetId = Array.from(selectedAssets)[0];
      navigate(`/assets/checkout/${assetId}`);
    }
  };

  const handleCheckIn = () => {
    if (selectedAssets.size === 1) {
      const assetId = Array.from(selectedAssets)[0];
      navigate(`/assets/checkin/${assetId}`);
    }
  };

  const handleWarranty = () => {
    if (selectedAssets.size === 1) {
      const assetId = Array.from(selectedAssets)[0];
      navigate(`/assets/warranty/${assetId}`);
    }
  };

  const handleSoftware = () => {
    if (selectedAssets.size === 1) {
      const assetId = Array.from(selectedAssets)[0];
      navigate(`/assets/software/${assetId}`);
    }
  };

  const handleAudit = () => {
    if (selectedAssets.size === 1) {
      const assetId = Array.from(selectedAssets)[0];
      navigate(`/assets/audit/${assetId}`);
    }
  };

  const handleDelete = async () => {
    if (selectedAssets.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedAssets.size} asset(s)?`)) return;

    try {
      const { error } = await supabase
        .from('assets')
        .delete()
        .in('id', Array.from(selectedAssets));

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedAssets.size} asset(s) deleted successfully`
      });

      setSelectedAssets(new Set());
      loadAssets();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset.asset_tag?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.serial_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || asset.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || asset.status === statusFilter;
    const matchesDepartment = departmentFilter === "all" || asset.department === departmentFilter;

    return matchesSearch && matchesCategory && matchesStatus && matchesDepartment;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge variant="default">Active</Badge>;
      case 'Checked Out':
        return <Badge variant="secondary">Checked Out</Badge>;
      case 'Repair':
        return <Badge className="bg-yellow-500">Repair</Badge>;
      case 'Discarded':
        return <Badge variant="destructive">Discarded</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex-shrink-0 p-6 pb-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Asset Management</h1>
            <p className="text-muted-foreground">Manage hardware, software & inventory</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/assets/add')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Asset
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={handleEdit}
                  disabled={selectedAssets.size !== 1}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Asset
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleCheckOut}
                  disabled={selectedAssets.size !== 1}
                >
                  <ArrowUpFromLine className="mr-2 h-4 w-4" />
                  Check Out
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleCheckIn}
                  disabled={selectedAssets.size !== 1}
                >
                  <ArrowDownToLine className="mr-2 h-4 w-4" />
                  Check In
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleWarranty}
                  disabled={selectedAssets.size !== 1}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Add Warranty
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleSoftware}
                  disabled={selectedAssets.size !== 1}
                >
                  <Link className="mr-2 h-4 w-4" />
                  Add Software
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleAudit}
                  disabled={selectedAssets.size !== 1}
                >
                  <History className="mr-2 h-4 w-4" />
                  View Audit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDelete}
                  disabled={selectedAssets.size === 0}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Asset
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by asset tag, model, serial number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Laptop">Laptop</SelectItem>
              <SelectItem value="Desktop">Desktop</SelectItem>
              <SelectItem value="Server">Server</SelectItem>
              <SelectItem value="Network">Network</SelectItem>
              <SelectItem value="Peripheral">Peripheral</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Repair">Repair</SelectItem>
              <SelectItem value="Discarded">Discarded</SelectItem>
              <SelectItem value="Checked In">Checked In</SelectItem>
              <SelectItem value="Checked Out">Checked Out</SelectItem>
            </SelectContent>
          </Select>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="Engineering">Engineering</SelectItem>
              <SelectItem value="IT">IT</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedAssets.size === filteredAssets.length && filteredAssets.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Asset Tag</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead>Warranty Expiry</TableHead>
                <TableHead>Cost (₹)</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : filteredAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center text-muted-foreground">
                    No assets found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedAssets.has(asset.id)}
                        onCheckedChange={() => handleSelectAsset(asset.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{asset.asset_tag}</TableCell>
                    <TableCell>{asset.brand}</TableCell>
                    <TableCell>{asset.model}</TableCell>
                    <TableCell>{asset.category}</TableCell>
                    <TableCell>{asset.department || '-'}</TableCell>
                    <TableCell>{asset.assigned_user?.full_name || '-'}</TableCell>
                    <TableCell>{getStatusBadge(asset.status)}</TableCell>
                    <TableCell>
                      {asset.purchase_date ? format(new Date(asset.purchase_date), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      {asset.warranty_expiry ? format(new Date(asset.warranty_expiry), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell>{asset.cost ? `₹${asset.cost.toLocaleString()}` : '-'}</TableCell>
                    <TableCell>{format(new Date(asset.updated_at), 'dd/MM/yyyy')}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredAssets.length} of {assets.length} assets
          {selectedAssets.size > 0 && ` • ${selectedAssets.size} selected`}
        </div>
      </div>

    </div>
  );
};

export default Assets;
