-- Migration 020: Add company_id to contracts and salary_structures.
-- payruns already has company_id (added in migration 017).
-- Backfill contracts.company_id from the employee's company context.
-- salary_structures.company_id is nullable (global structures allowed).

-- ─── contracts.company_id ─────────────────────────────────────────────────────
ALTER TABLE contracts
  ADD COLUMN company_id CHAR(36) NULL
    COMMENT 'FK → companies.id — inherited from employee company context';

-- Backfill from employee's company
UPDATE contracts c
  JOIN employees e ON e.id = c.employee_id
SET c.company_id = e.company_id
WHERE e.company_id IS NOT NULL;

ALTER TABLE contracts
  ADD KEY idx_contract_company_id (company_id),
  ADD KEY idx_contract_employee_start_end (employee_id, start_date, end_date),
  ADD KEY idx_contract_status_end (status, end_date);

ALTER TABLE contracts
  ADD CONSTRAINT fk_contract_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

-- ─── salary_structures.company_id ────────────────────────────────────────────
ALTER TABLE salary_structures
  ADD COLUMN company_id CHAR(36) NULL
    COMMENT 'FK → companies.id — NULL means global/shared structure';

ALTER TABLE salary_structures
  ADD KEY idx_salary_structure_company_id (company_id);

ALTER TABLE salary_structures
  ADD CONSTRAINT fk_salary_structure_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

-- ─── payruns — add missing indexes ───────────────────────────────────────────
-- payruns.company_id already exists from migration 017; add composite indexes
CREATE INDEX IF NOT EXISTS idx_payrun_company_period
  ON payruns (company_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_payrun_company_status
  ON payruns (company_id, status);
