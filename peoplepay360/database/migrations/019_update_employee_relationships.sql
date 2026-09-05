-- Migration 019: Add structured FK columns to employees for Company, Department,
-- and Employment Type. Also backfills employment_type_id from existing employment_type
-- free-text column (full_time → FULL_TIME, part_time → PART_TIME, contractor → CONTRACTOR).
-- The old employment_type VARCHAR column is kept for backward compatibility;
-- remove it in a later migration after application code is fully migrated.

-- Step 1: Add nullable structured FK columns first (required for backfill)
ALTER TABLE employees
  ADD COLUMN company_id          CHAR(36) NULL
    COMMENT 'FK → companies.id — structured company relationship',
  ADD COLUMN department_id       CHAR(36) NULL
    COMMENT 'FK → departments.id — NULL displays as Unassigned in dashboard',
  ADD COLUMN employment_type_id     CHAR(36) NULL
    COMMENT 'FK → employment_type.id';

-- Step 2: Backfill employment_type_id from existing free-text employment_type column
UPDATE employees e
  JOIN employment_type et
    ON et.code = CASE
         WHEN e.employment_type = 'full_time'   THEN 'FULL_TIME'
         WHEN e.employment_type = 'part_time'   THEN 'PART_TIME'
         WHEN e.employment_type = 'contractor'  THEN 'CONTRACTOR'
         ELSE NULL
       END
SET e.employment_type_id = et.id
WHERE et.deleted_at IS NULL;

-- Step 3: Add composite performance indexes on employees
ALTER TABLE employees
  ADD KEY idx_emp_company_id         (company_id),
  ADD KEY idx_emp_department_id      (department_id),
  ADD KEY idx_emp_employment_type_id (employment_type_id),
  ADD KEY idx_emp_company_dept       (company_id, department_id),
  ADD KEY idx_emp_company_emp_type   (company_id, employment_type_id);

-- Step 4: Add FKs (as non-enforced initially — enforce after full backfill validation)
ALTER TABLE employees
  ADD CONSTRAINT fk_employee_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_employee_department
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_employee_employment_type
    FOREIGN KEY (employment_type_id) REFERENCES employment_type(id) ON DELETE RESTRICT;
