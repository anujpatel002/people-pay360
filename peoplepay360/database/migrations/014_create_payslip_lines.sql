CREATE TABLE IF NOT EXISTS payslip_lines (
  id          CHAR(36)      NOT NULL DEFAULT (UUID()),
  payslip_id  CHAR(36)      NOT NULL,
  rule_code   VARCHAR(50)   NOT NULL,
  rule_name   VARCHAR(150)  NOT NULL,
  category    VARCHAR(20)   NOT NULL,
  amount      DECIMAL(14,2) NOT NULL,
  sequence    INT           NOT NULL CHECK (sequence > 0),
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_line_rule_per_payslip UNIQUE (payslip_id, rule_code),
  CONSTRAINT chk_line_category CHECK (category IN ('Basic','Allowance','Gross','Deduction','Net','Other')),
  CONSTRAINT fk_payslip_line FOREIGN KEY (payslip_id) REFERENCES payslips(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_payslip_lines_payslip_id ON payslip_lines(payslip_id);
CREATE INDEX idx_payslip_lines_sequence   ON payslip_lines(payslip_id, sequence);
