-- Create system_updates table for tracking OS and software updates
CREATE TABLE IF NOT EXISTS public.system_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_name TEXT NOT NULL,
  os_version TEXT NOT NULL,
  update_version TEXT NOT NULL,
  patch_id TEXT NOT NULL,
  update_type TEXT NOT NULL CHECK (update_type IN ('Security', 'Feature', 'Critical', 'Optional')),
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Installed', 'Failed', 'Verified')),
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT now(),
  installed_on TIMESTAMP WITH TIME ZONE,
  remarks TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create maintenance table for scheduled maintenance activities
CREATE TABLE IF NOT EXISTS public.maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES public.assets(id),
  asset_name TEXT NOT NULL,
  maintenance_type TEXT NOT NULL CHECK (maintenance_type IN ('Preventive', 'Corrective', 'Scheduled', 'Emergency')),
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  performed_by UUID,
  status TEXT NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'In Progress', 'Completed', 'Cancelled')),
  description TEXT,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create backups table for system and server backups
CREATE TABLE IF NOT EXISTS public.backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_name TEXT NOT NULL,
  backup_type TEXT NOT NULL CHECK (backup_type IN ('System', 'Server', 'Database', 'Full')),
  backup_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'In Progress' CHECK (status IN ('In Progress', 'Success', 'Failed', 'Partial')),
  verified_by UUID,
  verified_at TIMESTAMP WITH TIME ZONE,
  file_size BIGINT,
  storage_path TEXT,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;

-- RLS Policies for system_updates
CREATE POLICY "Tech leads and above can view system updates"
  ON public.system_updates FOR SELECT
  USING (
    has_role(auth.uid(), 'tech_lead'::app_role) OR 
    has_role(auth.uid(), 'management'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Tech leads and admins can manage system updates"
  ON public.system_updates FOR ALL
  USING (
    has_role(auth.uid(), 'tech_lead'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- RLS Policies for maintenance
CREATE POLICY "Tech leads and above can view maintenance"
  ON public.maintenance FOR SELECT
  USING (
    has_role(auth.uid(), 'tech_lead'::app_role) OR 
    has_role(auth.uid(), 'management'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Tech leads and admins can manage maintenance"
  ON public.maintenance FOR ALL
  USING (
    has_role(auth.uid(), 'tech_lead'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- RLS Policies for backups
CREATE POLICY "Tech leads and above can view backups"
  ON public.backups FOR SELECT
  USING (
    has_role(auth.uid(), 'tech_lead'::app_role) OR 
    has_role(auth.uid(), 'management'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Tech leads and admins can manage backups"
  ON public.backups FOR ALL
  USING (
    has_role(auth.uid(), 'tech_lead'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Triggers for updated_at
CREATE TRIGGER update_system_updates_updated_at
  BEFORE UPDATE ON public.system_updates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenance_updated_at
  BEFORE UPDATE ON public.maintenance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to send maintenance reminders
CREATE OR REPLACE FUNCTION public.send_maintenance_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Send notifications for maintenance scheduled in 1 day
  INSERT INTO notifications (user_id, title, message, type, related_record_type, related_record_id)
  SELECT 
    p.user_id,
    'Maintenance Reminder',
    'Scheduled maintenance for ' || m.asset_name || ' is due tomorrow (' || m.scheduled_date::date || ')',
    'warning',
    'maintenance',
    m.id
  FROM maintenance m
  CROSS JOIN profiles p
  WHERE m.status = 'Scheduled'
    AND m.scheduled_date::date = CURRENT_DATE + INTERVAL '1 day'
    AND (p.role IN ('tech_lead', 'admin') OR p.user_id = m.performed_by)
    AND NOT EXISTS (
      SELECT 1 FROM notifications n 
      WHERE n.related_record_id = m.id 
        AND n.related_record_type = 'maintenance'
        AND n.created_at::date = CURRENT_DATE
        AND n.user_id = p.user_id
    );
END;
$$;