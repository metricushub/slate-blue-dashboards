-- Clean up fake/demo data from the system

-- Delete fake team members
DELETE FROM team_members 
WHERE email LIKE '%metricushub.com.br%' 
   OR name ILIKE '%ronald%'
   OR name ILIKE '%test%' 
   OR name ILIKE '%demo%' 
   OR name ILIKE '%fake%' 
   OR name ILIKE '%exemplo%';

-- Delete any remaining fake clients
DELETE FROM clients 
WHERE name ILIKE '%test%' 
   OR name ILIKE '%demo%' 
   OR name ILIKE '%fake%' 
   OR name ILIKE '%exemplo%'
   OR name ILIKE '%sample%'
   OR website LIKE '%example.com%';

-- Delete any fake leads  
DELETE FROM leads
WHERE name ILIKE '%test%'
   OR name ILIKE '%demo%'
   OR name ILIKE '%fake%'
   OR name ILIKE '%exemplo%'
   OR email LIKE '%test%'
   OR email LIKE '%example.com%';

-- Delete any fake tasks
DELETE FROM tasks
WHERE title ILIKE '%test%'
   OR title ILIKE '%demo%'
   OR title ILIKE '%fake%'
   OR title ILIKE '%exemplo%';

-- Delete any fake notes
DELETE FROM notes
WHERE title ILIKE '%test%'
   OR title ILIKE '%demo%'
   OR title ILIKE '%fake%'
   OR title ILIKE '%exemplo%'
   OR content ILIKE '%test%'
   OR content ILIKE '%demo%';

-- Delete any fake optimizations
DELETE FROM optimizations
WHERE title ILIKE '%test%'
   OR title ILIKE '%demo%'
   OR title ILIKE '%fake%'
   OR title ILIKE '%exemplo%';

-- Reset sequences if needed
-- This ensures clean IDs for new records