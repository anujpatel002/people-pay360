-- Migration: 015_alter_employees.sql
-- Widens employee column sizes to match the updated spec.
-- FK constraints and indexes were already applied in 002.

ALTER TABLE employees
  MODIFY COLUMN employee_number  VARCHAR(50),
  MODIFY COLUMN private_address  TEXT,
  MODIFY COLUMN avatar_url       TEXT,
  MODIFY COLUMN bank_account     VARCHAR(100),
  MODIFY COLUMN iban             VARCHAR(100);
