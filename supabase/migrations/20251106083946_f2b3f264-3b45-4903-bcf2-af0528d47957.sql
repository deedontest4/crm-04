-- Create tickets table for IT support tickets
CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'pending', 'resolved', 'closed')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category text NOT NULL CHECK (category IN ('hardware', 'software', 'network', 'access', 'other')),
  created_by uuid REFERENCES public.profiles(user_id) NOT NULL,
  assigned_to uuid REFERENCES public.profiles(user_id),
  resolved_by uuid REFERENCES public.profiles(user_id),
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create assets table for IT assets management
CREATE TABLE public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_tag text UNIQUE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('laptop', 'desktop', 'monitor', 'phone', 'tablet', 'server', 'network_device', 'software_license', 'other')),
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'maintenance', 'retired')),
  brand text,
  model text,
  serial_number text,
  purchase_date date,
  warranty_expiry date,
  assigned_to uuid REFERENCES public.profiles(user_id),
  location text,
  notes text,
  created_by uuid REFERENCES public.profiles(user_id) NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create updates table for system/software updates
CREATE TABLE public.updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  update_type text NOT NULL CHECK (update_type IN ('security', 'feature', 'bug_fix', 'maintenance')),
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'failed', 'cancelled')),
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  affected_systems text,
  scheduled_date timestamp with time zone,
  completed_date timestamp with time zone,
  created_by uuid REFERENCES public.profiles(user_id) NOT NULL,
  performed_by uuid REFERENCES public.profiles(user_id),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create monitoring table for system monitoring events
CREATE TABLE public.monitoring (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name text NOT NULL,
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  status text NOT NULL DEFAULT 'normal' CHECK (status IN ('normal', 'warning', 'critical', 'unknown')),
  alert_triggered boolean NOT NULL DEFAULT false,
  alert_message text,
  threshold_value numeric,
  acknowledged boolean NOT NULL DEFAULT false,
  acknowledged_by uuid REFERENCES public.profiles(user_id),
  acknowledged_at timestamp with time zone,
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamp with time zone,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create compliance table for compliance checks and audits
CREATE TABLE public.compliance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_name text NOT NULL,
  category text NOT NULL CHECK (category IN ('security', 'data_protection', 'access_control', 'backup', 'policy', 'other')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'compliant', 'non_compliant', 'needs_review')),
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description text,
  findings text,
  remediation_plan text,
  last_checked timestamp with time zone,
  next_check_due timestamp with time zone,
  checked_by uuid REFERENCES public.profiles(user_id),
  assigned_to uuid REFERENCES public.profiles(user_id),
  created_by uuid REFERENCES public.profiles(user_id) NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tickets table
CREATE POLICY "Users can view tickets they created or are assigned to"
  ON public.tickets FOR SELECT
  USING (
    auth.uid() = created_by 
    OR auth.uid() = assigned_to 
    OR has_role(auth.uid(), 'tech_lead'::app_role)
    OR has_role(auth.uid(), 'management'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Users can create tickets"
  ON public.tickets FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Tech leads and admins can update tickets"
  ON public.tickets FOR UPDATE
  USING (
    has_role(auth.uid(), 'tech_lead'::app_role)
    OR has_role(auth.uid(), 'management'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can delete tickets"
  ON public.tickets FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for assets table
CREATE POLICY "Tech leads and above can view all assets"
  ON public.assets FOR SELECT
  USING (
    has_role(auth.uid(), 'tech_lead'::app_role)
    OR has_role(auth.uid(), 'management'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Tech leads and admins can create assets"
  ON public.assets FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'tech_lead'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Tech leads and admins can update assets"
  ON public.assets FOR UPDATE
  USING (
    has_role(auth.uid(), 'tech_lead'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can delete assets"
  ON public.assets FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for updates table
CREATE POLICY "Tech leads and above can view updates"
  ON public.updates FOR SELECT
  USING (
    has_role(auth.uid(), 'tech_lead'::app_role)
    OR has_role(auth.uid(), 'management'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Tech leads and admins can manage updates"
  ON public.updates FOR ALL
  USING (
    has_role(auth.uid(), 'tech_lead'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- RLS Policies for monitoring table
CREATE POLICY "Tech leads and above can view monitoring"
  ON public.monitoring FOR SELECT
  USING (
    has_role(auth.uid(), 'tech_lead'::app_role)
    OR has_role(auth.uid(), 'management'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "System can insert monitoring data"
  ON public.monitoring FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Tech leads can acknowledge alerts"
  ON public.monitoring FOR UPDATE
  USING (
    has_role(auth.uid(), 'tech_lead'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can delete monitoring records"
  ON public.monitoring FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for compliance table
CREATE POLICY "Management and admins can view compliance"
  ON public.compliance FOR SELECT
  USING (
    has_role(auth.uid(), 'management'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Management and admins can manage compliance"
  ON public.compliance FOR ALL
  USING (
    has_role(auth.uid(), 'management'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Create indexes for performance
CREATE INDEX idx_tickets_created_by ON public.tickets(created_by);
CREATE INDEX idx_tickets_assigned_to ON public.tickets(assigned_to);
CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_tickets_priority ON public.tickets(priority);
CREATE INDEX idx_tickets_created_at ON public.tickets(created_at DESC);

CREATE INDEX idx_assets_assigned_to ON public.assets(assigned_to);
CREATE INDEX idx_assets_status ON public.assets(status);
CREATE INDEX idx_assets_type ON public.assets(type);

CREATE INDEX idx_updates_status ON public.updates(status);
CREATE INDEX idx_updates_scheduled_date ON public.updates(scheduled_date);
CREATE INDEX idx_updates_severity ON public.updates(severity);

CREATE INDEX idx_monitoring_service_name ON public.monitoring(service_name);
CREATE INDEX idx_monitoring_status ON public.monitoring(status);
CREATE INDEX idx_monitoring_alert_triggered ON public.monitoring(alert_triggered);
CREATE INDEX idx_monitoring_created_at ON public.monitoring(created_at DESC);

CREATE INDEX idx_compliance_status ON public.compliance(status);
CREATE INDEX idx_compliance_category ON public.compliance(category);
CREATE INDEX idx_compliance_next_check_due ON public.compliance(next_check_due);

-- Create triggers for updated_at columns
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_updates_updated_at
  BEFORE UPDATE ON public.updates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_compliance_updated_at
  BEFORE UPDATE ON public.compliance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Generate unique ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number text;
  year_suffix text;
BEGIN
  year_suffix := to_char(now(), 'YY');
  SELECT 'TKT-' || year_suffix || '-' || LPAD((COUNT(*) + 1)::text, 5, '0')
  INTO new_number
  FROM tickets
  WHERE ticket_number LIKE 'TKT-' || year_suffix || '-%';
  
  RETURN new_number;
END;
$$;

-- Trigger to auto-generate ticket numbers
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_ticket_number_trigger
  BEFORE INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();