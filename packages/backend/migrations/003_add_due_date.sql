-- Add due_date column to issues table
ALTER TABLE issues ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;

-- Create index for efficient overdue queries
CREATE INDEX IF NOT EXISTS idx_issues_due_date ON issues (due_date) WHERE due_date IS NOT NULL;

