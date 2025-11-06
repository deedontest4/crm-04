-- Insert missing pages into the pages table
INSERT INTO pages (name, description, route) VALUES
  ('Tickets', 'Manage support tickets and requests', '/tickets'),
  ('Assets', 'Track and manage company assets', '/assets'),
  ('Updates', 'System updates and release notes', '/updates'),
  ('Monitoring', 'Monitor system performance and health', '/monitoring'),
  ('Compliance', 'Compliance tracking and reports', '/compliance')
ON CONFLICT (route) DO NOTHING;

-- Create page_access entries for all roles for the new pages
INSERT INTO page_access (page_id, role_name, has_access)
SELECT 
  p.id,
  r.role_name,
  CASE 
    -- Tickets: accessible to all roles
    WHEN p.route = '/tickets' THEN true
    -- Assets: accessible to tech_lead, management, admin
    WHEN p.route = '/assets' AND r.role_name IN ('tech_lead', 'management', 'admin') THEN true
    -- Updates: accessible to tech_lead, management, admin
    WHEN p.route = '/updates' AND r.role_name IN ('tech_lead', 'management', 'admin') THEN true
    -- Monitoring: accessible to tech_lead, management, admin
    WHEN p.route = '/monitoring' AND r.role_name IN ('tech_lead', 'management', 'admin') THEN true
    -- Compliance: accessible to management, admin
    WHEN p.route = '/compliance' AND r.role_name IN ('management', 'admin') THEN true
    ELSE false
  END
FROM pages p
CROSS JOIN (
  SELECT 'admin' as role_name
  UNION ALL SELECT 'management'
  UNION ALL SELECT 'tech_lead'
  UNION ALL SELECT 'employee'
) r
WHERE p.route IN ('/tickets', '/assets', '/updates', '/monitoring', '/compliance')
ON CONFLICT (page_id, role_name) DO NOTHING;