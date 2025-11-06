-- Create incidents table
CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  impacted_service TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  assigned_to UUID,
  reported_by UUID NOT NULL,
  root_cause TEXT,
  resolution_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Create incident_comments table
CREATE TABLE IF NOT EXISTS public.incident_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create incident_attachments table
CREATE TABLE IF NOT EXISTS public.incident_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for incident attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('incident-attachments', 'incident-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_attachments ENABLE ROW LEVEL SECURITY;

-- Incidents RLS policies
CREATE POLICY "Users can view all incidents"
  ON public.incidents FOR SELECT
  USING (true);

CREATE POLICY "Users can create incidents"
  ON public.incidents FOR INSERT
  WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Admins and management can update incidents"
  ON public.incidents FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'management'::app_role) OR
    auth.uid() = reported_by
  );

CREATE POLICY "Admins can delete incidents"
  ON public.incidents FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Incident comments RLS policies
CREATE POLICY "Users can view all comments"
  ON public.incident_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can create comments"
  ON public.incident_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON public.incident_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.incident_comments FOR DELETE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Incident attachments RLS policies
CREATE POLICY "Users can view all attachments"
  ON public.incident_attachments FOR SELECT
  USING (true);

CREATE POLICY "Users can upload attachments"
  ON public.incident_attachments FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Admins can delete attachments"
  ON public.incident_attachments FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for incident-attachments bucket
CREATE POLICY "Users can view incident attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'incident-attachments');

CREATE POLICY "Users can upload incident attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'incident-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own attachments"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'incident-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can delete incident attachments"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'incident-attachments');

-- Function to generate incident number
CREATE OR REPLACE FUNCTION public.generate_incident_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  year_suffix TEXT;
BEGIN
  year_suffix := to_char(now(), 'YY');
  SELECT 'INC-' || year_suffix || '-' || LPAD((COUNT(*) + 1)::text, 5, '0')
  INTO new_number
  FROM incidents
  WHERE ticket_number LIKE 'INC-' || year_suffix || '-%';
  
  RETURN new_number;
END;
$$;

-- Trigger to auto-generate incident number
CREATE OR REPLACE FUNCTION public.set_incident_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := generate_incident_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_incident_number_trigger
  BEFORE INSERT ON public.incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.set_incident_number();

-- Trigger to update updated_at
CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON public.incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to log incident actions to activity_logs
CREATE OR REPLACE FUNCTION public.log_incident_action()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_logs (entity_type, entity_id, action, description, performed_by, metadata)
    VALUES (
      'incident',
      NEW.id,
      'created',
      'Created incident: ' || NEW.title,
      NEW.reported_by,
      jsonb_build_object('ticket_number', NEW.ticket_number, 'severity', NEW.severity)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      INSERT INTO activity_logs (entity_type, entity_id, action, description, performed_by, metadata)
      VALUES (
        'incident',
        NEW.id,
        'status_changed',
        'Changed status from ' || OLD.status || ' to ' || NEW.status,
        auth.uid(),
        jsonb_build_object('ticket_number', NEW.ticket_number, 'old_status', OLD.status, 'new_status', NEW.status)
      );
    END IF;
    
    IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
      INSERT INTO activity_logs (entity_type, entity_id, action, description, performed_by, metadata)
      VALUES (
        'incident',
        NEW.id,
        'assigned',
        'Incident assigned',
        auth.uid(),
        jsonb_build_object('ticket_number', NEW.ticket_number, 'assigned_to', NEW.assigned_to)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_incident_action_trigger
  AFTER INSERT OR UPDATE ON public.incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.log_incident_action();

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE incident_comments;