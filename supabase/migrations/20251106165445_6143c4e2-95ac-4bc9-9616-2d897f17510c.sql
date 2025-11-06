-- Add priority and SLA tracking fields to incidents table
ALTER TABLE public.incidents
ADD COLUMN priority text NOT NULL DEFAULT 'medium',
ADD COLUMN sla_target_response_hours integer DEFAULT 4,
ADD COLUMN sla_target_resolution_hours integer DEFAULT 24,
ADD COLUMN first_response_at timestamp with time zone,
ADD COLUMN sla_response_breached boolean DEFAULT false,
ADD COLUMN sla_resolution_breached boolean DEFAULT false;

-- Add check constraint for priority
ALTER TABLE public.incidents
ADD CONSTRAINT incidents_priority_check 
CHECK (priority IN ('low', 'medium', 'high', 'critical'));

-- Create function to calculate SLA targets based on priority
CREATE OR REPLACE FUNCTION public.set_incident_sla_targets()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set SLA targets based on priority
  CASE NEW.priority
    WHEN 'critical' THEN
      NEW.sla_target_response_hours := 1;
      NEW.sla_target_resolution_hours := 4;
    WHEN 'high' THEN
      NEW.sla_target_response_hours := 2;
      NEW.sla_target_resolution_hours := 8;
    WHEN 'medium' THEN
      NEW.sla_target_response_hours := 4;
      NEW.sla_target_resolution_hours := 24;
    WHEN 'low' THEN
      NEW.sla_target_response_hours := 8;
      NEW.sla_target_resolution_hours := 72;
  END CASE;
  
  RETURN NEW;
END;
$$;

-- Create trigger to set SLA targets on insert/update
CREATE TRIGGER set_incident_sla_targets_trigger
BEFORE INSERT OR UPDATE OF priority ON public.incidents
FOR EACH ROW
EXECUTE FUNCTION public.set_incident_sla_targets();

-- Create function to check and update SLA breach status
CREATE OR REPLACE FUNCTION public.check_incident_sla_breach()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check response SLA breach
  IF NEW.first_response_at IS NULL AND 
     (now() - NEW.created_at) > (NEW.sla_target_response_hours || ' hours')::interval THEN
    NEW.sla_response_breached := true;
  END IF;
  
  -- Check resolution SLA breach
  IF NEW.status NOT IN ('resolved', 'closed') AND
     (now() - NEW.created_at) > (NEW.sla_target_resolution_hours || ' hours')::interval THEN
    NEW.sla_resolution_breached := true;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to check SLA breaches on update
CREATE TRIGGER check_incident_sla_breach_trigger
BEFORE UPDATE ON public.incidents
FOR EACH ROW
EXECUTE FUNCTION public.check_incident_sla_breach();

-- Update log_incident_action to track first response
CREATE OR REPLACE FUNCTION public.log_incident_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_logs (entity_type, entity_id, action, description, performed_by, metadata)
    VALUES (
      'incident',
      NEW.id,
      'created',
      'Created incident: ' || NEW.title,
      NEW.reported_by,
      jsonb_build_object(
        'ticket_number', NEW.ticket_number, 
        'severity', NEW.severity,
        'priority', NEW.priority
      )
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Track first response
    IF OLD.first_response_at IS NULL AND 
       (OLD.status = 'open' AND NEW.status = 'investigating') THEN
      NEW.first_response_at := now();
      
      INSERT INTO activity_logs (entity_type, entity_id, action, description, performed_by, metadata)
      VALUES (
        'incident',
        NEW.id,
        'first_response',
        'First response provided',
        auth.uid(),
        jsonb_build_object(
          'ticket_number', NEW.ticket_number,
          'response_time_hours', EXTRACT(EPOCH FROM (now() - OLD.created_at))/3600
        )
      );
    END IF;
    
    IF OLD.status != NEW.status THEN
      INSERT INTO activity_logs (entity_type, entity_id, action, description, performed_by, metadata)
      VALUES (
        'incident',
        NEW.id,
        'status_changed',
        'Changed status from ' || OLD.status || ' to ' || NEW.status,
        auth.uid(),
        jsonb_build_object(
          'ticket_number', NEW.ticket_number, 
          'old_status', OLD.status, 
          'new_status', NEW.status
        )
      );
    END IF;
    
    IF OLD.priority != NEW.priority THEN
      INSERT INTO activity_logs (entity_type, entity_id, action, description, performed_by, metadata)
      VALUES (
        'incident',
        NEW.id,
        'priority_changed',
        'Changed priority from ' || OLD.priority || ' to ' || NEW.priority,
        auth.uid(),
        jsonb_build_object(
          'ticket_number', NEW.ticket_number,
          'old_priority', OLD.priority,
          'new_priority', NEW.priority
        )
      );
    END IF;
    
    IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
      INSERT INTO activity_logs (entity_type, entity_id, action, description, performed_by, metadata)
      VALUES (
        'incident',
        NEW.id,
        'assigned',
        CASE 
          WHEN NEW.assigned_to IS NULL THEN 'Unassigned incident'
          ELSE 'Incident assigned'
        END,
        auth.uid(),
        jsonb_build_object(
          'ticket_number', NEW.ticket_number, 
          'assigned_to', NEW.assigned_to
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;