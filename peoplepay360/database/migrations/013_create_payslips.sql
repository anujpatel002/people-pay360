CREATE TABLE IF NOT EXISTS payslips (
  id            CHAR(36)      NOT NULL DEFAULT (UUID()),
  payrun_id     CHAR(36)      NOT NULL,
  employee_id   CHAR(36)      NOT NULL,
  contract_id   CHAR(36)      NOT NULL,
  gross         DECIMAL(14,2) NOT NULL DEFAULT 0 CHECK (gross >= 0),
  deductions    DECIMAL(14,2) NOT NULL DEFAULT 0 CHECK (deductions >= 0),
  net           DECIMAL(14,2) NOT NULL DEFAULT 0 CHECK (net >= 0),
  worked_days   DECIMAL(5,2)  NOT NULL DEFAULT 0 CHECK (worked_days >= 0),
  status        VARCHAR(20)   NOT NULL DEFAULT 'Draft',
  warning_codes JSON          NOT NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_payslip_per_employee_per_run UNIQUE (payrun_id, employee_id),
  CONSTRAINT chk_payslip_status  CHECK (status IN ('Draft','Computed','Validated','Paid')),
  CONSTRAINT chk_net_lte_gross   CHECK (net <= gross),
  CONSTRAINT fk_payslip_payrun   FOREIGN KEY (payrun_id)   REFERENCES payruns(id)   ON DELETE RESTRICT,
  CONSTRAINT fk_payslip_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
  CONSTRAINT fk_payslip_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_payslips_payrun_id   ON payslips(payrun_id);
CREATE INDEX idx_payslips_employee_id ON payslips(employee_id);
CREATE INDEX idx_payslips_status      ON payslips(status);
