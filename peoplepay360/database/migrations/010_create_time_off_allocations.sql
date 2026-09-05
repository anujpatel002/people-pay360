CREATE TABLE IF NOT EXISTS time_off_allocations (
  id             CHAR(36)      NOT NULL DEFAULT (UUID()),
  employee_id    CHAR(36)      NOT NULL,
  type_id        CHAR(36)      NOT NULL,
  year           SMALLINT      NOT NULL CHECK (year >= 2000),
  total_days     DECIMAL(6,2)  NOT NULL CHECK (total_days > 0),
  used_days      DECIMAL(6,2)  NOT NULL DEFAULT 0 CHECK (used_days >= 0),
  validity_start DATE          NOT NULL,
  validity_end   DATE          NOT NULL,
  approver_id    CHAR(36)      DEFAULT NULL,
  status         VARCHAR(20)   NOT NULL DEFAULT 'Approved',
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_employee_type_year   UNIQUE (employee_id, type_id, year),
  CONSTRAINT chk_allocation_status   CHECK (status IN ('Draft','Confirmed','Approved','Refused')),
  CONSTRAINT chk_allocation_validity CHECK (validity_end > validity_start),
  CONSTRAINT chk_used_lte_total      CHECK (used_days <= total_days),
  CONSTRAINT fk_allocation_employee  FOREIGN KEY (employee_id) REFERENCES employees(id)      ON DELETE RESTRICT,
  CONSTRAINT fk_allocation_type      FOREIGN KEY (type_id)     REFERENCES time_off_types(id) ON DELETE RESTRICT,
  CONSTRAINT fk_allocation_approver  FOREIGN KEY (approver_id) REFERENCES users(id)          ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_allocations_employee_id ON time_off_allocations(employee_id);
CREATE INDEX idx_allocations_type_id     ON time_off_allocations(type_id);
