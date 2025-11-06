import { useState, useEffect } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AssetInformationSection } from "./AssetInformationSection";
import { CheckInOutSection } from "./CheckInOutSection";
import { WarrantySection } from "./WarrantySection";
import { SoftwareLinksSection } from "./SoftwareLinksSection";
import { AuditHistorySection } from "./AuditHistorySection";

interface AssetDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId?: string | null;
  onSuccess: () => void;
}

export function AssetDrawer({ open, onOpenChange, assetId, onSuccess }: AssetDrawerProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [assetData, setAssetData] = useState<any>(null);

  useEffect(() => {
    if (open && assetId) {
      loadAssetData();
    } else if (open && !assetId) {
      setAssetData(null);
    }
  }, [open, assetId]);

  const loadAssetData = async () => {
    if (!assetId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', assetId)
        .single();

      if (error) throw error;
      setAssetData(data);
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

  const handleClose = () => {
    setAssetData(null);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-3xl ml-auto h-screen">
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle>{assetId ? 'Edit Asset' : 'Add New Asset'}</DrawerTitle>
              <DrawerDescription>
                {assetId ? 'Update asset information and manage related records' : 'Create a new asset record'}
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-8 py-6">
            <AssetInformationSection
              assetId={assetId}
              assetData={assetData}
              onSuccess={() => {
                onSuccess();
                if (!assetId) {
                  handleClose();
                } else {
                  loadAssetData();
                }
              }}
            />

            {assetId && (
              <>
                <CheckInOutSection assetId={assetId} />
                <WarrantySection assetId={assetId} />
                <SoftwareLinksSection assetId={assetId} />
                <AuditHistorySection assetId={assetId} entityType="asset" />
              </>
            )}
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
