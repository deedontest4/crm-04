-- Drop all skill-related tables
DROP TABLE IF EXISTS approval_audit_logs CASCADE;
DROP TABLE IF EXISTS approval_logs CASCADE;
DROP TABLE IF EXISTS approval_history CASCADE;
DROP TABLE IF EXISTS skill_rating_history CASCADE;
DROP TABLE IF EXISTS subskill_rating_history CASCADE;
DROP TABLE IF EXISTS employee_ratings CASCADE;
DROP TABLE IF EXISTS user_skills CASCADE;
DROP TABLE IF EXISTS subskills CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS skill_categories CASCADE;
DROP TABLE IF EXISTS skill_explorer_presets CASCADE;
DROP TABLE IF EXISTS user_category_preferences CASCADE;

-- Drop gamification and goal tables
DROP TABLE IF EXISTS goal_progress_history CASCADE;
DROP TABLE IF EXISTS personal_goals CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS user_gamification CASCADE;
DROP TABLE IF EXISTS leaderboard_history CASCADE;

-- Drop project tables
DROP TABLE IF EXISTS project_skill_validations CASCADE;
DROP TABLE IF EXISTS project_required_skills CASCADE;
DROP TABLE IF EXISTS project_reminders CASCADE;
DROP TABLE IF EXISTS project_allocation_history CASCADE;
DROP TABLE IF EXISTS project_assignments CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- Drop training tables
DROP TABLE IF EXISTS training_participation CASCADE;
DROP TABLE IF EXISTS training_budgets CASCADE;

-- Drop activity log tables
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;