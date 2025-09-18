-- Add paid_at column to track actual payment/receipt date
ALTER TABLE financial_entries 
ADD COLUMN paid_at date;