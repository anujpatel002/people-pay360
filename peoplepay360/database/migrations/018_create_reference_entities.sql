-- Migration 018: Core reference/dimension entities required for Dashboard module
-- Creates companies, employment_type, and departments as first-class relational dimensions.
-- Existing employees.company_id, department_id, employment_type free-text fields are
-- preserved for now; Migration 019 adds structured FKs.

-- ─── Companies ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id            CHAR(36)     NOT NULL DEFAULT (UUID()),
  code          VARCHAR(50)  NOT NULL,
  name          VARCHAR(255) NOT NULL,
  currency_code CHAR(3)      NOT NULL DEFAULT 'INR',
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    DATETIME     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_company_code (code),
  KEY idx_company_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Employment Types ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employment_type (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  code        VARCHAR(50)  NOT NULL,
  name        VARCHAR(150) NOT NULL,
  description TEXT         NULL,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  DATETIME     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_employment_type_code (code),
  KEY idx_employment_type_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed recommended initial values
INSERT IGNORE INTO employment_type (id, code, name) VALUES
  (UUID(), 'FULL_TIME',   'Full-Time'),
  (UUID(), 'PART_TIME',   'Part-Time'),
  (UUID(), 'CONTRACTOR',  'Contractor');

-- ─── Departments ──────────────────────────────────────────────────────────────
-- Departments belong to a company; manager_employee_id is optional.
-- FK to employees is deferred (employees added after departments in most setups);
-- use SET NULL on delete to avoid hard dependency loop.
CREATE TABLE IF NOT EXISTS departments (
  id                  CHAR(36)     NOT NULL DEFAULT (UUID()),
  company_id          CHAR(36)     NOT NULL,
  code                VARCHAR(50)  NOT NULL,
  name                VARCHAR(255) NOT NULL,
  manager_employee_id CHAR(36)     NULL,
  is_active           TINYINT(1)   NOT NULL DEFAULT 1,
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at          DATETIME     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_department_company_code (company_id, code),
  KEY idx_department_company_id (company_id),
  KEY idx_department_company_active (company_id, is_active),
  CONSTRAINT fk_department_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT,
  CONSTRAINT fk_department_manager
    FOREIGN KEY (manager_employee_id) REFERENCES employees(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
