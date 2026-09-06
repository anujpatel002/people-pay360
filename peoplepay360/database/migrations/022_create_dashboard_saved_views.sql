-- Migration 022: Create dashboard_saved_views table
-- Stores reusable user-specific Dashboard filter combinations.
-- Saved views reference structured IDs (company_id, department_id, employment_type_id),
-- not display names. Soft deletion preserves historical references.

CREATE TABLE IF NOT EXISTS dashboard_saved_views (
  id                 CHAR(36)     NOT NULL DEFAULT (UUID()),
  user_id            CHAR(36)     NOT NULL,
  name               VARCHAR(255) NOT NULL,
  period             VARCHAR(7)   NULL     COMMENT 'YYYY-MM format',
  company_id         CHAR(36)     NULL,
  department_id      CHAR(36)     NULL,
  employment_type_id CHAR(36)     NULL,
  is_default         TINYINT(1)   NOT NULL DEFAULT 0,
  created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at         DATETIME     NULL,
  PRIMARY KEY (id),
  -- (user_id, name) unique among non-deleted views — enforced in app layer
  KEY idx_saved_view_user_id         (user_id),
  KEY idx_saved_view_user_default    (user_id, is_default),
  CONSTRAINT fk_saved_view_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_saved_view_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
  CONSTRAINT fk_saved_view_department
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  CONSTRAINT fk_saved_view_employment_type
    FOREIGN KEY (employment_type_id) REFERENCES employment_type(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
