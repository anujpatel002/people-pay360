-- Migration 023: Backfill company_id on employees, contracts, payruns and ensure alert dedup key
-- 1. Ensure multi-company records exist
INSERT INTO companies (id, code, name, currency_code, is_active)
VALUES 
  ('6ead8c86-a96e-11f1-b2f6-3a217fae9be6', 'PEOPLEPAY360', 'PeoplePay360 Inc.', 'INR', 1),
  ('7fa91b97-b07f-11f1-c3a7-4b328abf0cf7', 'TECHNOVA', 'TechNova Solutions Ltd.', 'USD', 1),
  ('8ab02c08-c180-11f1-d4b8-5c439bcf1da8', 'ACME_GLOBAL', 'Acme Global Enterprises', 'EUR', 1)
ON DUPLICATE KEY UPDATE 
  name = VALUES(name), 
  currency_code = VALUES(currency_code), 
  is_active = 1;

-- 2. Backfill employees.company_id for all employees
UPDATE employees 
SET company_id = '6ead8c86-a96e-11f1-b2f6-3a217fae9be6' 
WHERE company_id IS NULL;

-- 3. Backfill contracts.company_id from employee
UPDATE contracts c
JOIN employees e ON e.id = c.employee_id
SET c.company_id = e.company_id
WHERE c.company_id IS NULL;

-- 4. Backfill payruns.company_id
UPDATE payruns 
SET company_id = '6ead8c86-a96e-11f1-b2f6-3a217fae9be6' 
WHERE company_id IS NULL;
