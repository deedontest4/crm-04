-- Add asset management sub-routes to pages table
DO $$
DECLARE
  v_page_id uuid;
BEGIN
  -- Insert /assets/add page and store its ID
  INSERT INTO pages (name, description, route, created_at, updated_at)
  VALUES ('Add Asset', 'Create a new asset', '/assets/add', now(), now())
  RETURNING id INTO v_page_id;
  
  -- Grant access to admin, management, and tech_lead
  INSERT INTO page_access (page_id, role_name, has_access, updated_at)
  VALUES 
    (v_page_id, 'admin', true, now()),
    (v_page_id, 'management', true, now()),
    (v_page_id, 'tech_lead', true, now()),
    (v_page_id, 'employee', false, now());

  -- Insert /assets/edit/:id page
  INSERT INTO pages (name, description, route, created_at, updated_at)
  VALUES ('Edit Asset', 'Edit asset details', '/assets/edit/:id', now(), now())
  RETURNING id INTO v_page_id;
  
  INSERT INTO page_access (page_id, role_name, has_access, updated_at)
  VALUES 
    (v_page_id, 'admin', true, now()),
    (v_page_id, 'management', true, now()),
    (v_page_id, 'tech_lead', true, now()),
    (v_page_id, 'employee', false, now());

  -- Insert /assets/checkout/:id page
  INSERT INTO pages (name, description, route, created_at, updated_at)
  VALUES ('Check Out Asset', 'Check out an asset', '/assets/checkout/:id', now(), now())
  RETURNING id INTO v_page_id;
  
  INSERT INTO page_access (page_id, role_name, has_access, updated_at)
  VALUES 
    (v_page_id, 'admin', true, now()),
    (v_page_id, 'management', true, now()),
    (v_page_id, 'tech_lead', true, now()),
    (v_page_id, 'employee', false, now());

  -- Insert /assets/checkin/:id page
  INSERT INTO pages (name, description, route, created_at, updated_at)
  VALUES ('Check In Asset', 'Check in an asset', '/assets/checkin/:id', now(), now())
  RETURNING id INTO v_page_id;
  
  INSERT INTO page_access (page_id, role_name, has_access, updated_at)
  VALUES 
    (v_page_id, 'admin', true, now()),
    (v_page_id, 'management', true, now()),
    (v_page_id, 'tech_lead', true, now()),
    (v_page_id, 'employee', false, now());

  -- Insert /assets/warranty/:id page
  INSERT INTO pages (name, description, route, created_at, updated_at)
  VALUES ('Asset Warranty', 'Manage asset warranty', '/assets/warranty/:id', now(), now())
  RETURNING id INTO v_page_id;
  
  INSERT INTO page_access (page_id, role_name, has_access, updated_at)
  VALUES 
    (v_page_id, 'admin', true, now()),
    (v_page_id, 'management', true, now()),
    (v_page_id, 'tech_lead', true, now()),
    (v_page_id, 'employee', false, now());

  -- Insert /assets/software/:id page
  INSERT INTO pages (name, description, route, created_at, updated_at)
  VALUES ('Asset Software', 'Manage asset software', '/assets/software/:id', now(), now())
  RETURNING id INTO v_page_id;
  
  INSERT INTO page_access (page_id, role_name, has_access, updated_at)
  VALUES 
    (v_page_id, 'admin', true, now()),
    (v_page_id, 'management', true, now()),
    (v_page_id, 'tech_lead', true, now()),
    (v_page_id, 'employee', false, now());

  -- Insert /assets/audit/:id page
  INSERT INTO pages (name, description, route, created_at, updated_at)
  VALUES ('Asset Audit', 'View asset audit history', '/assets/audit/:id', now(), now())
  RETURNING id INTO v_page_id;
  
  INSERT INTO page_access (page_id, role_name, has_access, updated_at)
  VALUES 
    (v_page_id, 'admin', true, now()),
    (v_page_id, 'management', true, now()),
    (v_page_id, 'tech_lead', true, now()),
    (v_page_id, 'employee', false, now());
END $$;