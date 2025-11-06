-- Add Subscriptions page to pages table
INSERT INTO public.pages (name, route, description)
VALUES ('Subscriptions', '/subscriptions', 'Track and manage tool subscriptions')
ON CONFLICT (route) DO NOTHING;

-- Set up page access for Subscriptions page
INSERT INTO public.page_access (page_id, role_name, has_access)
SELECT 
  p.id,
  role_name,
  CASE 
    WHEN role_name IN ('admin', 'management', 'tech_lead') THEN true
    ELSE false
  END as has_access
FROM public.pages p
CROSS JOIN (
  SELECT 'admin' as role_name
  UNION SELECT 'management'
  UNION SELECT 'tech_lead'
  UNION SELECT 'employee'
) roles
WHERE p.route = '/subscriptions'
ON CONFLICT (page_id, role_name) DO NOTHING;