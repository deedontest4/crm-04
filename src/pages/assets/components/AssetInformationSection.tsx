import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Save, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import FormInput from "@/components/common/FormInput";
import FormSelect from "@/components/common/FormSelect";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";

interface AssetInformationSectionProps {
  assetId?: string | null;
  assetData?: any;
  onSuccess: () => void;
}

const ASSET_TYPES = [
  { value: 'Hardware', label: 'Hardware' },
  { value: 'Software', label: 'Software' },
  { value: 'License', label: 'License' }
];

const CATEGORIES = [
  { value: 'Laptop', label: 'Laptop' },
  { value: 'Desktop', label: 'Desktop' },
  { value: 'Server', label: 'Server' },
  { value: 'Network', label: 'Network' },
  { value: 'Peripheral', label: 'Peripheral' },
  { value: 'Other', label: 'Other' }
];

const STATUSES = [
  { value: 'Active', label: 'Active' },
  { value: 'Repair', label: 'Repair' },
  { value: 'Discarded', label: 'Discarded' },
  { value: 'Checked In', label: 'Checked In' },
  { value: 'Checked Out', label: 'Checked Out' }
];

const CONFIDENTIALITY_LEVELS = [
  { value: 'Confidential', label: 'Confidential' },
  { value: 'Internal', label: 'Internal' },
  { value: 'Public', label: 'Public' }
];

const DEPARTMENTS = [
  { value: 'Engineering', label: 'Engineering' },
  { value: 'IT', label: 'IT' }
];

const SITES = [
  { value: 'Pune', label: 'Pune' },
  { value: 'GmbH', label: 'GmbH' }
];

export function AssetInformationSection({ assetId, assetData, onSuccess }: AssetInformationSectionProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    asset_tag: '',
    type: 'Hardware',
    category: '',
    brand: '',
    model: '',
    serial_number: '',
    description: '',
    purchased_from: '',
    purchase_date: '',
    cost: '',
    processor: '',
    ram: '',
    storage: '',
    confidentiality_level: 'Internal',
    department: '',
    site: '',
    status: 'Active',
    assigned_to: '',
    asset_photo: ''
  });

  useEffect(() => {
    if (assetData) {
      setFormData({
        name: assetData.name || '',
        asset_tag: assetData.asset_tag || '',
        type: assetData.type || 'Hardware',
        category: assetData.category || '',
        brand: assetData.brand || '',
        model: assetData.model || '',
        serial_number: assetData.serial_number || '',
        description: assetData.description || '',
        purchased_from: assetData.purchased_from || '',
        purchase_date: assetData.purchase_date || '',
        cost: assetData.cost?.toString() || '',
        processor: assetData.processor || '',
        ram: assetData.ram || '',
        storage: assetData.storage || '',
        confidentiality_level: assetData.confidentiality_level || 'Internal',
        department: assetData.department || '',
        site: assetData.site || '',
        status: assetData.status || 'Active',
        assigned_to: assetData.assigned_to || '',
        asset_photo: assetData.asset_photo || ''
      });
      if (assetData.asset_photo) {
        setImagePreview(assetData.asset_photo);
      }
    }
  }, [assetData]);

  const showHardwareFields = ['Laptop', 'Desktop', 'Server'].includes(formData.category);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return formData.asset_photo || null;

    setUploading(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('asset-images')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('asset-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      toast({
        title: "Image Upload Error",
        description: error.message,
        variant: "destructive"
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.type || !formData.category || !formData.brand || !formData.model) {
      toast({
        title: "Validation Error",
        description: "Name, Type, Category, Brand, and Model are required fields.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Upload image if there's a new one
      const imageUrl = await uploadImage();

      const payload: any = {
        ...formData,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        assigned_to: formData.assigned_to || null,
        asset_photo: imageUrl,
        created_by: user?.id
      };

      // Auto-generate asset tag if not provided
      if (!assetId && !formData.asset_tag) {
        const { count } = await supabase
          .from('assets')
          .select('*', { count: 'exact', head: true });
        payload.asset_tag = `AST-${String((count || 0) + 1).padStart(5, '0')}`;
      }

      if (assetId) {
        const { error } = await supabase
          .from('assets')
          .update(payload)
          .eq('id', assetId);

        if (error) throw error;

        // Log activity
        await supabase.from('activity_logs').insert({
          entity_type: 'asset',
          entity_id: assetId,
          action: 'Updated',
          description: `Asset ${formData.asset_tag} was updated`,
          performed_by: user?.id
        });

        toast({
          title: "Success",
          description: "Asset updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('assets')
          .insert(payload);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Asset created successfully"
        });
      }

      onSuccess();
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
        <h3 className="text-lg font-semibold mb-4">Asset Information</h3>
        <Separator />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormInput
          id="name"
          label="Asset Name"
          value={formData.name}
          onChange={(value) => setFormData({ ...formData, name: value })}
          placeholder="e.g., Laptop for Engineering Team"
          required
        />
        <FormInput
          id="asset_tag"
          label="Asset Tag ID"
          value={formData.asset_tag}
          onChange={(value) => setFormData({ ...formData, asset_tag: value })}
          placeholder="Auto-generated if blank"
        />
        <FormSelect
          id="type"
          label="Asset Type"
          value={formData.type}
          onChange={(value) => setFormData({ ...formData, type: value })}
          options={ASSET_TYPES}
          required
        />
        <FormSelect
          id="category"
          label="Category"
          value={formData.category}
          onChange={(value) => setFormData({ ...formData, category: value })}
          options={CATEGORIES}
          required
        />
        <FormInput
          id="brand"
          label="Brand"
          value={formData.brand}
          onChange={(value) => setFormData({ ...formData, brand: value })}
          required
        />
        <FormInput
          id="model"
          label="Model"
          value={formData.model}
          onChange={(value) => setFormData({ ...formData, model: value })}
          required
        />
        <FormInput
          id="serial_number"
          label="Serial Number"
          value={formData.serial_number}
          onChange={(value) => setFormData({ ...formData, serial_number: value })}
        />
        <FormInput
          id="purchased_from"
          label="Purchased From"
          value={formData.purchased_from}
          onChange={(value) => setFormData({ ...formData, purchased_from: value })}
        />
        <FormInput
          id="purchase_date"
          label="Purchase Date"
          type="date"
          value={formData.purchase_date}
          onChange={(value) => setFormData({ ...formData, purchase_date: value })}
        />
        <FormInput
          id="cost"
          label="Cost (₹)"
          type="number"
          value={formData.cost}
          onChange={(value) => setFormData({ ...formData, cost: value })}
          placeholder="0.00"
        />

        {showHardwareFields && (
          <>
            <FormInput
              id="processor"
              label="Processor"
              value={formData.processor}
              onChange={(value) => setFormData({ ...formData, processor: value })}
            />
            <FormInput
              id="ram"
              label="RAM"
              value={formData.ram}
              onChange={(value) => setFormData({ ...formData, ram: value })}
              placeholder="e.g., 16GB"
            />
            <FormInput
              id="storage"
              label="Storage"
              value={formData.storage}
              onChange={(value) => setFormData({ ...formData, storage: value })}
              placeholder="e.g., 512GB SSD"
            />
          </>
        )}

        <FormSelect
          id="confidentiality_level"
          label="Confidentiality Level"
          value={formData.confidentiality_level}
          onChange={(value) => setFormData({ ...formData, confidentiality_level: value })}
          options={CONFIDENTIALITY_LEVELS}
        />
        <FormSelect
          id="department"
          label="Department"
          value={formData.department}
          onChange={(value) => setFormData({ ...formData, department: value })}
          options={DEPARTMENTS}
        />
        <FormSelect
          id="site"
          label="Site"
          value={formData.site}
          onChange={(value) => setFormData({ ...formData, site: value })}
          options={SITES}
        />
        <FormSelect
          id="status"
          label="Status"
          value={formData.status}
          onChange={(value) => setFormData({ ...formData, status: value })}
          options={STATUSES}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter asset description..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="asset_image">Add Image</Label>
        <div className="space-y-4">
          {imagePreview && (
            <div className="relative w-full h-48 border rounded-lg overflow-hidden">
              <img 
                src={imagePreview} 
                alt="Asset preview" 
                className="w-full h-full object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                  setFormData({ ...formData, asset_photo: '' });
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Input
              id="asset_image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="flex-1"
            />
            <Upload className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">
            Upload JPG, PNG, or GIF. Max file size: 5MB
          </p>
        </div>
      </div>

      <Button onClick={handleSave} disabled={loading || uploading} className="w-full">
        <Save className="mr-2 h-4 w-4" />
        {loading || uploading ? 'Saving...' : assetId ? 'Update Asset' : 'Create Asset'}
      </Button>
    </div>
  );
}
