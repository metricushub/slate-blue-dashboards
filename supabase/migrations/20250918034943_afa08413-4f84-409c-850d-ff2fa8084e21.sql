-- Remove all existing constraints on financial_goals type column
ALTER TABLE financial_goals DROP CONSTRAINT IF EXISTS financial_goals_type_check;

-- Update existing records to use new types
UPDATE financial_goals SET type = 'revenue' WHERE type = 'income';
UPDATE financial_goals SET type = 'clients' WHERE type = 'expense';

-- Add new constraint with correct values
ALTER TABLE financial_goals ADD CONSTRAINT financial_goals_type_check 
CHECK (type IN ('revenue', 'clients'));