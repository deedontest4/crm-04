import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AssetInformationSection } from "./components/AssetInformationSection";
import LoadingSpinner from "@/components/common/LoadingSpinner";

const EditAsset = () => {
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
            <h1 className="text-3xl font-bold tracking-tight">Edit Asset</h1>
            <p className="text-muted-foreground">Update asset information - {assetData?.asset_tag}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <AssetInformationSection
            assetId={id || null}
            assetData={assetData}
            onSuccess={() => {
              navigate('/assets');
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default EditAsset;
