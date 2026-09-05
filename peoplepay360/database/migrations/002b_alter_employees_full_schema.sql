-- Migration: 002b_alter_employees_full_schema
-- Removes old plain-text columns, adds missing constraints and indexes

-- Drop old redundant plain-text columns (replaced by ID-based columns)
ALTER TABLE employees
  DROP COLUMN job_position,
  DROP COLUMN department,
  DROP COLUMN company;

-- Add missing constraints
ALTER TABLE employees
  ADD CONSTRAINT uq_employee_number  UNIQUE      (employee_number),
  ADD CONSTRAINT chk_employment_type CHECK       (employment_type IN ('full_time', 'part_time', 'contractor'));

-- Add missing indexes
CREATE INDEX idx_employees_department_id   ON employees (department_id);
CREATE INDEX idx_employees_job_position_id ON employees (job_position_id);
CREATE INDEX idx_employees_company_id      ON employees (company_id);
CREATE INDEX idx_employees_employment_type ON employees (employment_type);
CREATE INDEX idx_employees_status          ON employees (status);

-- Recreate triggers (drop first in case they exist)
DROP TRIGGER IF EXISTS trg_employee_no_self_manager;
DROP TRIGGER IF EXISTS trg_employee_no_self_manager_upd;

CREATE TRIGGER trg_employee_no_self_manager
BEFORE INSERT ON employees
FOR EACH ROW
  IF NEW.manager_id IS NOT NULL AND NEW.manager_id = NEW.id THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Employee cannot be their own manager';
  END IF;

CREATE TRIGGER trg_employee_no_self_manager_upd
BEFORE UPDATE ON employees
FOR EACH ROW
  IF NEW.manager_id IS NOT NULL AND NEW.manager_id = NEW.id THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Employee cannot be their own manager';
  END IF;
