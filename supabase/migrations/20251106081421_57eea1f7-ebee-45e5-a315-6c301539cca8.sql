-- Delete page access records for Skills, Approvals, Skill Explorer, and Projects
DELETE FROM page_access 
WHERE page_id IN (
  SELECT id FROM pages 
  WHERE route IN ('/skills', '/approvals', '/skill-explorer', '/projects')
);

-- Delete the pages themselves
DELETE FROM pages 
WHERE route IN ('/skills', '/approvals', '/skill-explorer', '/projects');