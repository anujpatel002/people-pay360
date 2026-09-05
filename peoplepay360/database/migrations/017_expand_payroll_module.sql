-- Payroll is additive to the initial payrun/payslip tables.  The original
-- tables remain valid so deployments with existing payroll data are preserved.
CREATE TABLE IF NOT EXISTS payroll_periods (
  id CHAR(36) NOT NULL DEFAULT (UUID()), name VARCHAR(150) NOT NULL,
  company_id CHAR(36) NULL, period_start DATE NOT NULL, period_end DATE NOT NULL,
  payment_date DATE NULL, frequency VARCHAR(20) NOT NULL DEFAULT 'Monthly',
  status VARCHAR(20) NOT NULL DEFAULT 'Open', created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id), UNIQUE KEY uq_payroll_period_range (company_id, period_start, period_end),
  CONSTRAINT chk_payroll_period_dates CHECK (period_end >= period_start),
  CONSTRAINT chk_payroll_period_status CHECK (status IN ('Open','Processing','Closed')),
  CONSTRAINT fk_payroll_period_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS salary_structure_versions (
  id CHAR(36) NOT NULL DEFAULT (UUID()), structure_id CHAR(36) NOT NULL,
  version INT NOT NULL, effective_from DATE NULL, effective_to DATE NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Active', created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id), UNIQUE KEY uq_structure_version (structure_id, version),
  CONSTRAINT fk_structure_version_structure FOREIGN KEY (structure_id) REFERENCES salary_structures(id) ON DELETE RESTRICT,
  CONSTRAINT fk_structure_version_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS salary_rule_versions (
  id CHAR(36) NOT NULL DEFAULT (UUID()), structure_version_id CHAR(36) NOT NULL,
  rule_code VARCHAR(50) NOT NULL, rule_name VARCHAR(150) NOT NULL, category VARCHAR(30) NOT NULL,
  sequence INT NOT NULL, computation_method VARCHAR(30) NOT NULL, amount DECIMAL(14,2) NULL,
  percentage DECIMAL(7,4) NULL, percentage_base_type VARCHAR(20) NULL,
  percentage_base_code VARCHAR(50) NULL, formula TEXT NULL, is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id), UNIQUE KEY uq_rule_version_code (structure_version_id, rule_code),
  CONSTRAINT fk_rule_version_structure FOREIGN KEY (structure_version_id) REFERENCES salary_structure_versions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE payruns
  ADD COLUMN period_id CHAR(36) NULL AFTER name,
  ADD COLUMN company_id CHAR(36) NULL AFTER period_id,
  ADD COLUMN structure_version_id CHAR(36) NULL AFTER structure_id,
  ADD COLUMN total_deductions DECIMAL(16,2) NOT NULL DEFAULT 0 AFTER total_gross,
  ADD COLUMN total_employer_contributions DECIMAL(16,2) NOT NULL DEFAULT 0 AFTER total_deductions,
  ADD COLUMN employee_count INT NOT NULL DEFAULT 0 AFTER warning_count,
  ADD COLUMN computed_at DATETIME NULL, ADD COLUMN computed_by CHAR(36) NULL,
  ADD COLUMN validated_at DATETIME NULL, ADD COLUMN validated_by CHAR(36) NULL,
  ADD COLUMN currency_code VARCHAR(10) NOT NULL DEFAULT 'INR';
ALTER TABLE payruns ADD CONSTRAINT fk_payrun_period FOREIGN KEY (period_id) REFERENCES payroll_periods(id) ON DELETE SET NULL;
ALTER TABLE payruns ADD CONSTRAINT fk_payrun_structure_version FOREIGN KEY (structure_version_id) REFERENCES salary_structure_versions(id) ON DELETE RESTRICT;
ALTER TABLE payruns ADD CONSTRAINT fk_payrun_computed_by FOREIGN KEY (computed_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE payruns ADD CONSTRAINT fk_payrun_validated_by FOREIGN KEY (validated_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE payslips
  MODIFY COLUMN contract_id CHAR(36) NULL,
  ADD COLUMN structure_id CHAR(36) NULL AFTER contract_id,
  ADD COLUMN structure_version_id CHAR(36) NULL AFTER structure_id,
  ADD COLUMN employee_name_snapshot VARCHAR(255) NULL, ADD COLUMN employee_code_snapshot VARCHAR(100) NULL,
  ADD COLUMN department_snapshot VARCHAR(255) NULL, ADD COLUMN job_position_snapshot VARCHAR(255) NULL,
  ADD COLUMN contract_reference_snapshot VARCHAR(150) NULL, ADD COLUMN company_name_snapshot VARCHAR(255) NULL,
  ADD COLUMN currency_code VARCHAR(10) NOT NULL DEFAULT 'INR',
  ADD COLUMN employer_contributions DECIMAL(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN worked_minutes INT NOT NULL DEFAULT 0, ADD COLUMN overtime_minutes INT NOT NULL DEFAULT 0,
  ADD COLUMN warning_count INT NOT NULL DEFAULT 0;
ALTER TABLE payslips ADD CONSTRAINT fk_payslip_structure_version FOREIGN KEY (structure_version_id) REFERENCES salary_structure_versions(id) ON DELETE RESTRICT;
ALTER TABLE payslip_lines
  ADD COLUMN source_value DECIMAL(14,2) NULL, ADD COLUMN calculation_description TEXT NULL;

CREATE TABLE IF NOT EXISTS payroll_inputs (
  id CHAR(36) NOT NULL DEFAULT(UUID()), payrun_id CHAR(36) NOT NULL, payslip_id CHAR(36) NULL,
  employee_id CHAR(36) NOT NULL, code VARCHAR(50) NOT NULL, name VARCHAR(150) NOT NULL,
  category VARCHAR(30) NOT NULL, value DECIMAL(14,2) NOT NULL, unit VARCHAR(20) NULL,
  source VARCHAR(20) NOT NULL, source_reference VARCHAR(255) NULL, is_manual TINYINT(1) NOT NULL DEFAULT 0,
  reason TEXT NULL, created_by CHAR(36) NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY(id),
  CONSTRAINT fk_input_payrun FOREIGN KEY(payrun_id) REFERENCES payruns(id) ON DELETE RESTRICT,
  CONSTRAINT fk_input_payslip FOREIGN KEY(payslip_id) REFERENCES payslips(id) ON DELETE SET NULL,
  CONSTRAINT fk_input_employee FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
  CONSTRAINT fk_input_creator FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE INDEX idx_inputs_run_employee ON payroll_inputs(payrun_id, employee_id);
CREATE TABLE IF NOT EXISTS payroll_warnings (
  id CHAR(36) NOT NULL DEFAULT(UUID()), payrun_id CHAR(36) NOT NULL, payslip_id CHAR(36) NULL, employee_id CHAR(36) NULL,
  code VARCHAR(60) NOT NULL, message TEXT NOT NULL, severity VARCHAR(10) NOT NULL, blocking TINYINT(1) NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'OPEN', resolution_note TEXT NULL, resolved_by CHAR(36) NULL, resolved_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY(id), CONSTRAINT fk_warning_run FOREIGN KEY(payrun_id) REFERENCES payruns(id) ON DELETE CASCADE,
  CONSTRAINT fk_warning_slip FOREIGN KEY(payslip_id) REFERENCES payslips(id) ON DELETE CASCADE,
  CONSTRAINT fk_warning_employee FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE SET NULL,
  CONSTRAINT fk_warning_resolver FOREIGN KEY(resolved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE INDEX idx_warnings_run ON payroll_warnings(payrun_id, status, blocking);
CREATE TABLE IF NOT EXISTS payroll_payments (
  id CHAR(36) NOT NULL DEFAULT(UUID()), payrun_id CHAR(36) NOT NULL, payslip_id CHAR(36) NOT NULL, employee_id CHAR(36) NOT NULL,
  amount DECIMAL(14,2) NOT NULL, currency_code VARCHAR(10) NOT NULL DEFAULT 'INR', payment_method VARCHAR(50) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending', payment_reference VARCHAR(150) NULL, provider VARCHAR(100) NULL,
  failure_reason TEXT NULL, initiated_at DATETIME NULL, completed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY(id), UNIQUE KEY uq_payment_payslip(payslip_id), CONSTRAINT fk_payment_run FOREIGN KEY(payrun_id) REFERENCES payruns(id) ON DELETE RESTRICT,
  CONSTRAINT fk_payment_slip FOREIGN KEY(payslip_id) REFERENCES payslips(id) ON DELETE RESTRICT,
  CONSTRAINT fk_payment_employee FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS payslip_deliveries (
  id CHAR(36) NOT NULL DEFAULT(UUID()), payrun_id CHAR(36) NOT NULL, payslip_id CHAR(36) NOT NULL, employee_id CHAR(36) NOT NULL,
  recipient_email VARCHAR(255) NOT NULL, delivery_type VARCHAR(30) NOT NULL DEFAULT 'EMAIL', provider VARCHAR(100) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending', provider_message_id VARCHAR(255) NULL, attempt_count INT NOT NULL DEFAULT 0,
  error_message TEXT NULL, sent_at DATETIME NULL, last_attempt_at DATETIME NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY(id), UNIQUE KEY uq_delivery_payslip(payslip_id),
  CONSTRAINT fk_delivery_run FOREIGN KEY(payrun_id) REFERENCES payruns(id) ON DELETE RESTRICT,
  CONSTRAINT fk_delivery_slip FOREIGN KEY(payslip_id) REFERENCES payslips(id) ON DELETE RESTRICT,
  CONSTRAINT fk_delivery_employee FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS payroll_audit_logs (
  id CHAR(36) NOT NULL DEFAULT(UUID()), entity_type VARCHAR(50) NOT NULL, entity_id CHAR(36) NOT NULL, action VARCHAR(80) NOT NULL,
  old_status VARCHAR(20) NULL, new_status VARCHAR(20) NULL, changed_fields JSON NULL, performed_by CHAR(36) NULL,
  performed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, metadata JSON NULL, PRIMARY KEY(id),
  CONSTRAINT fk_audit_actor FOREIGN KEY(performed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE INDEX idx_audit_entity ON payroll_audit_logs(entity_type, entity_id, performed_at);
CREATE TABLE IF NOT EXISTS payslip_calculation_traces (
  id CHAR(36) NOT NULL DEFAULT(UUID()), payslip_id CHAR(36) NOT NULL, payslip_line_id CHAR(36) NULL,
  rule_code VARCHAR(50) NOT NULL, input_name VARCHAR(100) NOT NULL, input_value DECIMAL(16,4) NULL,
  formula TEXT NULL, result DECIMAL(16,4) NOT NULL, sequence INT NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id), CONSTRAINT fk_trace_slip FOREIGN KEY(payslip_id) REFERENCES payslips(id) ON DELETE CASCADE,
  CONSTRAINT fk_trace_line FOREIGN KEY(payslip_line_id) REFERENCES payslip_lines(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
