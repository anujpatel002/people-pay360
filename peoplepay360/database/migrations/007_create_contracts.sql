CREATE TABLE IF NOT EXISTS contracts (
  id            CHAR(36)      NOT NULL DEFAULT (UUID()),
  employee_id   CHAR(36)      NOT NULL,
  contract_ref  VARCHAR(50)   DEFAULT NULL,
  status        VARCHAR(20)   NOT NULL DEFAULT 'New',
  department    VARCHAR(100)  DEFAULT NULL,
  job_position  VARCHAR(100)  DEFAULT NULL,
  wage          DECIMAL(12,2) NOT NULL CHECK (wage >= 0),
  start_date    DATE          NOT NULL,
  end_date      DATE          DEFAULT NULL,
  schedule_id   CHAR(36)      DEFAULT NULL,
  structure_id  CHAR(36)      DEFAULT NULL,
  notes         TEXT          DEFAULT NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT chk_contract_status CHECK (status IN ('New','Running','Expired','Cancelled')),
  CONSTRAINT chk_contract_dates  CHECK (end_date IS NULL OR end_date > start_date),
  CONSTRAINT fk_contract_employee  FOREIGN KEY (employee_id)  REFERENCES employees(id)         ON DELETE RESTRICT,
  CONSTRAINT fk_contract_schedule  FOREIGN KEY (schedule_id)  REFERENCES working_schedules(id) ON DELETE RESTRICT,
  CONSTRAINT fk_contract_structure FOREIGN KEY (structure_id) REFERENCES salary_structures(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_contracts_employee_id ON contracts(employee_id);
CREATE INDEX idx_contracts_status      ON contracts(status);
CREATE INDEX idx_contracts_dates       ON contracts(start_date, end_date);
