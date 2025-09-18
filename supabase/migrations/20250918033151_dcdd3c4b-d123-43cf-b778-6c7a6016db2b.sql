-- Add client_id column to financial_entries table
ALTER TABLE financial_entries 
ADD COLUMN client_id uuid;

-- Add foreign key reference to clients table (optional but good practice)
ALTER TABLE financial_entries
ADD CONSTRAINT fk_financial_entries_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;