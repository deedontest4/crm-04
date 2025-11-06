import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { AssetInformationSection } from "./components/AssetInformationSection";
const AddAsset = () => {
  const navigate = useNavigate();
  return <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex-shrink-0 p-6 border-b">
        <div className="flex items-center gap-4 mb-4">
          
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add New Asset</h1>
            
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <AssetInformationSection assetId={null} assetData={null} onSuccess={() => {
          navigate('/assets');
        }} />
        </div>
      </div>
    </div>;
};
export default AddAsset;