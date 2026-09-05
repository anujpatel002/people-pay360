-- Migration 021: Create dashboard_alerts table
-- Stores actionable alert instances with full lifecycle management,
-- source-record references, severity, and deduplication identity keys.

CREATE TABLE IF NOT EXISTS dashboard_alerts (
  id                 CHAR(36)      NOT NULL DEFAULT (UUID()),
  company_id         CHAR(36)      NOT NULL,
  type               VARCHAR(60)   NOT NULL
    COMMENT 'MISSING_BANK_DETAILS | DUPLICATE_PAYSLIP | UNVALIDATED_PAYRUN | EXPIRING_CONTRACT',
  severity           VARCHAR(10)   NOT NULL DEFAULT 'WARNING'
    COMMENT 'INFO | WARNING | CRITICAL',
  title              VARCHAR(255)  NOT NULL,
  message            TEXT          NOT NULL,
  -- Source-record references (nullable — not all alerts have a single entity)
  entity_type        VARCHAR(50)   NULL
    COMMENT 'Employee | Payrun | Payslip | Contract',
  entity_id          CHAR(36)      NULL,
  employee_id        CHAR(36)      NULL,
  -- Lifecycle
  status             VARCHAR(15)   NOT NULL DEFAULT 'OPEN'
    COMMENT 'OPEN | ACKNOWLEDGED | RESOLVED | DISMISSED',
  blocking           TINYINT(1)    NOT NULL DEFAULT 0,
  metadata           JSON          NULL,
  -- Deduplication fingerprint — stable deterministic key per alert identity
  dedup_key          VARCHAR(255)  NOT NULL
    COMMENT 'Deterministic key used for upsert deduplication',
  -- Temporal tracking
  first_detected_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_detected_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  resolved_at        DATETIME      NULL,
  resolved_by        CHAR(36)      NULL,
  -- Audit
  created_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  -- Deduplication: only one OPEN/ACKNOWLEDGED alert per unique dedup_key
  UNIQUE KEY uq_alert_dedup_open (dedup_key, status),
  -- Performance indexes per spec §20
  KEY idx_alert_company_status      (company_id, status),
  KEY idx_alert_company_type_status (company_id, type, status),
  KEY idx_alert_company_employee    (company_id, employee_id),
  KEY idx_alert_entity              (entity_type, entity_id),
  KEY idx_alert_last_detected       (last_detected_at),
  CONSTRAINT chk_alert_severity
    CHECK (severity IN ('INFO','WARNING','CRITICAL')),
  CONSTRAINT chk_alert_status
    CHECK (status IN ('OPEN','ACKNOWLEDGED','RESOLVED','DISMISSED')),
  CONSTRAINT fk_alert_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_alert_employee
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL,
  CONSTRAINT fk_alert_resolver
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
