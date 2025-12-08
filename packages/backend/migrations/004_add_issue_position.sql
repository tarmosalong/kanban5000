-- Add position column to issues table for ordering within status columns
ALTER TABLE issues ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Create index for efficient ordering queries
CREATE INDEX IF NOT EXISTS idx_issues_status_position ON issues (status_id, position);

-- Initialize positions based on created_at (oldest first, lowest position)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY status_id ORDER BY created_at ASC) as new_position
  FROM issues
)
UPDATE issues SET position = ranked.new_position
FROM ranked
WHERE issues.id = ranked.id;

