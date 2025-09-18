-- Update financial_goals table to use new goal types
-- First, update existing records to use new types
UPDATE financial_goals SET type = 'revenue' WHERE type = 'income';
UPDATE financial_goals SET type = 'clients' WHERE type = 'expense';

-- Add constraint to ensure only valid types are allowed
ALTER TABLE financial_goals DROP CONSTRAINT IF EXISTS financial_goals_type_check;
ALTER TABLE financial_goals ADD CONSTRAINT financial_goals_type_check 
CHECK (type IN ('revenue', 'clients'));