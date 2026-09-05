CREATE TABLE IF NOT EXISTS time_off_types (
  id                  CHAR(36)     NOT NULL DEFAULT (UUID()),
  name                VARCHAR(100) NOT NULL,
  unit                VARCHAR(10)  NOT NULL,
  allocation_required TINYINT(1)   NOT NULL DEFAULT 1,
  approval_mode       VARCHAR(40)  NOT NULL DEFAULT 'time_off',
  is_paid             TINYINT(1)   NOT NULL DEFAULT 1,
  work_entry          VARCHAR(50)  DEFAULT NULL,
  color               VARCHAR(7)   DEFAULT NULL,
  is_active           TINYINT(1)   NOT NULL DEFAULT 1,
  notes               TEXT         DEFAULT NULL,
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_time_off_type_name UNIQUE (name),
  CONSTRAINT chk_time_off_unit CHECK (unit IN ('days','hours')),
  CONSTRAINT chk_approval_mode CHECK (approval_mode IN ('no_validation','time_off','set_by_time_off_officer'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
