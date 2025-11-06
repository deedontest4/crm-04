import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AuditHistorySection } from "./components/AuditHistorySection";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const AssetAudit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [assetData, setAssetData] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadAssetData();
    }
  }, [id]);

  const loadAssetData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setAssetData(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      navigate('/assets');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex-shrink-0 p-6 border-b">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/assets')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Audit History</h1>
            <p className="text-muted-foreground">View all asset activity logs - {assetData?.asset_tag}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Asset Information</CardTitle>
              <CardDescription>Current asset details</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-3 gap-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Asset Tag</dt>
                  <dd className="text-sm mt-1">{assetData?.asset_tag}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Model</dt>
                  <dd className="text-sm mt-1">{assetData?.model}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Brand</dt>
                  <dd className="text-sm mt-1">{assetData?.brand}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                  <dd className="text-sm mt-1">{assetData?.status}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Department</dt>
                  <dd className="text-sm mt-1">{assetData?.department || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Category</dt>
                  <dd className="text-sm mt-1">{assetData?.category}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <AuditHistorySection assetId={id || ""} entityType="asset" />
        </div>
      </div>
    </div>
  );
};

export default AssetAudit;
