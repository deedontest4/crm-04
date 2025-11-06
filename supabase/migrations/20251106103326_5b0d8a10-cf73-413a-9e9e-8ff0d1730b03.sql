-- Drop the existing status check constraint
ALTER TABLE public.assets DROP CONSTRAINT IF EXISTS assets_status_check;

-- Add new check constraint with the correct status values used in the application
ALTER TABLE public.assets ADD CONSTRAINT assets_status_check 
CHECK (status IN ('Active', 'Repair', 'Discarded', 'Checked In', 'Checked Out'));

-- Update the default value to match the application
ALTER TABLE public.assets ALTER COLUMN status SET DEFAULT 'Active';

-- Update any existing rows with 'available' status to 'Active'
UPDATE public.assets SET status = 'Active' WHERE status = 'available';