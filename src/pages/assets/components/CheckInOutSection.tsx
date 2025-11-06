import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import FormSelect from "@/components/common/FormSelect";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

interface CheckInOutSectionProps {
  assetId: string;
}

export function CheckInOutSection({ assetId }: CheckInOutSectionProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [transactionType, setTransactionType] = useState<string>('Check-Out');
  const [userId, setUserId] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    loadHistory();
    loadUsers();
  }, [assetId]);

  const loadUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('user_id, full_name, email')
      .order('full_name');
    
    if (data) {
      setUsers(data.map(u => ({ value: u.user_id, label: u.full_name || u.email })));
    }
  };

  const loadHistory = async () => {
    const { data } = await supabase
      .from('asset_allocations')
      .select('*, profiles(full_name, email)')
      .eq('asset_id', assetId)
      .order('transaction_date', { ascending: false });

    if (data) setHistory(data);
  };

  const handleSubmit = async () => {
    if (!transactionType) {
      toast({
        title: "Validation Error",
        description: "Transaction type is required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Insert allocation record
      const { error: allocError } = await supabase
        .from('asset_allocations')
        .insert({
          asset_id: assetId,
          transaction_type: transactionType,
          user_id: userId || null,
          department: department || null,
          remarks,
          created_by: user?.id
        });

      if (allocError) throw allocError;

      // Update asset status
      const newStatus = transactionType === 'Check-Out' ? 'Checked Out' : 'Checked In';
      const { error: assetError } = await supabase
        .from('assets')
        .update({ 
          status: newStatus,
          assigned_to: transactionType === 'Check-Out' ? userId || null : null
        })
        .eq('id', assetId);

      if (assetError) throw assetError;

      // Log activity
      await supabase.from('activity_logs').insert({
        entity_type: 'asset',
        entity_id: assetId,
        action: transactionType,
        description: `Asset ${transactionType === 'Check-Out' ? 'checked out' : 'checked in'}`,
        performed_by: user?.id
      });

      toast({
        title: "Success",
        description: `Asset ${transactionType === 'Check-Out' ? 'checked out' : 'checked in'} successfully`
      });

      // Reset form
      setTransactionType('Check-Out');
      setUserId('');
      setDepartment('');
      setRemarks('');
      loadHistory();
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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Check-In / Check-Out</h3>
        <Separator />
      </div>

      <div className="space-y-4">
        <FormSelect
          id="transaction_type"
          label="Transaction Type"
          value={transactionType}
          onChange={setTransactionType}
          options={[
            { value: 'Check-Out', label: 'Check-Out' },
            { value: 'Check-In', label: 'Check-In' }
          ]}
          required
        />

        <FormSelect
          id="user"
          label="User"
          value={userId}
          onChange={setUserId}
          options={users}
          placeholder="Select user (optional)"
        />

        <FormSelect
          id="department"
          label="Department"
          value={department}
          onChange={setDepartment}
          options={[
            { value: 'Engineering', label: 'Engineering' },
            { value: 'IT', label: 'IT' }
          ]}
          placeholder="Select department (optional)"
        />

        <div className="space-y-2">
          <Label htmlFor="remarks">Remarks</Label>
          <Textarea
            id="remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Enter any remarks..."
            rows={2}
          />
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {transactionType === 'Check-Out' ? (
            <ArrowUpFromLine className="mr-2 h-4 w-4" />
          ) : (
            <ArrowDownToLine className="mr-2 h-4 w-4" />
          )}
          {loading ? 'Processing...' : `Submit ${transactionType}`}
        </Button>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Transaction History</h4>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No transaction history
                  </TableCell>
                </TableRow>
              ) : (
                history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{format(new Date(item.transaction_date), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell>
                      <Badge variant={item.transaction_type === 'Check-Out' ? 'default' : 'secondary'}>
                        {item.transaction_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.profiles?.full_name || item.profiles?.email || '-'}</TableCell>
                    <TableCell>{item.department || '-'}</TableCell>
                    <TableCell>{item.remarks || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
