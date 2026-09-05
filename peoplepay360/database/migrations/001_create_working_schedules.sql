CREATE TABLE IF NOT EXISTS working_schedules (
  id           CHAR(36)       NOT NULL DEFAULT (UUID()),
  name         VARCHAR(100)   NOT NULL,
  company      VARCHAR(100)   NOT NULL,
  timezone     VARCHAR(60)    NOT NULL DEFAULT 'UTC',
  weekly_hours DECIMAL(5,2)   NOT NULL CHECK (weekly_hours >= 0),
  days         JSON           NOT NULL,
  is_active    TINYINT(1)     NOT NULL DEFAULT 1,
  created_at   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_schedule_name_company UNIQUE (name, company)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
