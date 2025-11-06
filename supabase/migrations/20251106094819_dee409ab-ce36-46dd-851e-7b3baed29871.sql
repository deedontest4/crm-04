-- Add missing columns to assets table
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS purchased_from text,
ADD COLUMN IF NOT EXISTS cost numeric(12,2),
ADD COLUMN IF NOT EXISTS processor text,
ADD COLUMN IF NOT EXISTS ram text,
ADD COLUMN IF NOT EXISTS storage text,
ADD COLUMN IF NOT EXISTS confidentiality_level text DEFAULT 'Internal',
ADD COLUMN IF NOT EXISTS department text,
ADD COLUMN IF NOT EXISTS site text,
ADD COLUMN IF NOT EXISTS asset_photo text;

-- Create asset_allocations table for check-in/out tracking
CREATE TABLE IF NOT EXISTS public.asset_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('Check-In', 'Check-Out')),
  user_id uuid REFERENCES public.profiles(user_id),
  department text,
  transaction_date timestamp with time zone NOT NULL DEFAULT now(),
  remarks text,
  status text NOT NULL DEFAULT 'Active',
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create warranties table
CREATE TABLE IF NOT EXISTS public.warranties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  vendor text NOT NULL,
  start_date date NOT NULL,
  expiry_date date NOT NULL,
  coverage_notes text,
  renewal_status text NOT NULL DEFAULT 'Active' CHECK (renewal_status IN ('Active', 'Expiring', 'Expired')),
  attachment_url text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create licenses table for software management
CREATE TABLE IF NOT EXISTS public.licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  software_name text NOT NULL,
  license_key text,
  vendor text NOT NULL,
  purchase_date date,
  expiry_date date,
  seats_total integer DEFAULT 1,
  seats_used integer DEFAULT 0,
  cost numeric(12,2),
  renewal_status text DEFAULT 'Active' CHECK (renewal_status IN ('Active', 'Expiring', 'Expired')),
  notes text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create asset_software_links table (junction table)
CREATE TABLE IF NOT EXISTS public.asset_software_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  license_id uuid NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
  assigned_date timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(asset_id, license_id)
);

-- Create activity_logs table for audit trail
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  description text,
  performed_by uuid NOT NULL,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.asset_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_software_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for asset_allocations
CREATE POLICY "Tech leads and above can view allocations"
ON public.asset_allocations FOR SELECT
USING (
  has_role(auth.uid(), 'tech_lead'::app_role) OR 
  has_role(auth.uid(), 'management'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Tech leads and admins can manage allocations"
ON public.asset_allocations FOR ALL
USING (
  has_role(auth.uid(), 'tech_lead'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- RLS Policies for warranties
CREATE POLICY "Tech leads and above can view warranties"
ON public.warranties FOR SELECT
USING (
  has_role(auth.uid(), 'tech_lead'::app_role) OR 
  has_role(auth.uid(), 'management'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Tech leads and admins can manage warranties"
ON public.warranties FOR ALL
USING (
  has_role(auth.uid(), 'tech_lead'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- RLS Policies for licenses
CREATE POLICY "Tech leads and above can view licenses"
ON public.licenses FOR SELECT
USING (
  has_role(auth.uid(), 'tech_lead'::app_role) OR 
  has_role(auth.uid(), 'management'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Tech leads and admins can manage licenses"
ON public.licenses FOR ALL
USING (
  has_role(auth.uid(), 'tech_lead'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- RLS Policies for asset_software_links
CREATE POLICY "Tech leads and above can view software links"
ON public.asset_software_links FOR SELECT
USING (
  has_role(auth.uid(), 'tech_lead'::app_role) OR 
  has_role(auth.uid(), 'management'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Tech leads and admins can manage software links"
ON public.asset_software_links FOR ALL
USING (
  has_role(auth.uid(), 'tech_lead'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- RLS Policies for activity_logs
CREATE POLICY "Tech leads and above can view activity logs"
ON public.activity_logs FOR SELECT
USING (
  has_role(auth.uid(), 'tech_lead'::app_role) OR 
  has_role(auth.uid(), 'management'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "System can insert activity logs"
ON public.activity_logs FOR INSERT
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_asset_allocations_asset_id ON public.asset_allocations(asset_id);
CREATE INDEX IF NOT EXISTS idx_warranties_asset_id ON public.warranties(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_software_links_asset_id ON public.asset_software_links(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_software_links_license_id ON public.asset_software_links(license_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);

-- Create trigger to update warranties renewal status
CREATE OR REPLACE FUNCTION update_warranty_renewal_status()
RETURNS trigger AS $$
BEGIN
  IF NEW.expiry_date <= CURRENT_DATE THEN
    NEW.renewal_status = 'Expired';
  ELSIF NEW.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN
    NEW.renewal_status = 'Expiring';
  ELSE
    NEW.renewal_status = 'Active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_warranty_status_trigger
BEFORE INSERT OR UPDATE ON public.warranties
FOR EACH ROW
EXECUTE FUNCTION update_warranty_renewal_status();

-- Create trigger to update license renewal status
CREATE OR REPLACE FUNCTION update_license_renewal_status()
RETURNS trigger AS $$
BEGIN
  IF NEW.expiry_date IS NOT NULL THEN
    IF NEW.expiry_date <= CURRENT_DATE THEN
      NEW.renewal_status = 'Expired';
    ELSIF NEW.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN
      NEW.renewal_status = 'Expiring';
    ELSE
      NEW.renewal_status = 'Active';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_license_status_trigger
BEFORE INSERT OR UPDATE ON public.licenses
FOR EACH ROW
EXECUTE FUNCTION update_license_renewal_status();

-- Add trigger to update warranties updated_at
CREATE TRIGGER update_warranties_updated_at
BEFORE UPDATE ON public.warranties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger to update licenses updated_at
CREATE TRIGGER update_licenses_updated_at
BEFORE UPDATE ON public.licenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();