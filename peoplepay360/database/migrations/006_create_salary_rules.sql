CREATE TABLE IF NOT EXISTS salary_rules (
  id                 CHAR(36)       NOT NULL DEFAULT (UUID()),
  structure_id       CHAR(36)       NOT NULL,
  code               VARCHAR(50)    NOT NULL,
  name               VARCHAR(150)   NOT NULL,
  category           VARCHAR(20)    NOT NULL,
  sequence           INT            NOT NULL,
  computation_method VARCHAR(30)    NOT NULL,
  amount             DECIMAL(14,2)  DEFAULT NULL CHECK (amount >= 0),
  percentage         DECIMAL(7,4)   DEFAULT NULL CHECK (percentage >= 0 AND percentage <= 100),
  formula            TEXT           DEFAULT NULL,
  is_active          TINYINT(1)     NOT NULL DEFAULT 1,
  created_at         DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_rule_code_per_structure UNIQUE (structure_id, code),
  CONSTRAINT chk_rule_category CHECK (category IN ('Basic','Allowance','Gross','Deduction','Net','Other')),
  CONSTRAINT chk_rule_sequence CHECK (sequence > 0),
  CONSTRAINT chk_computation_method CHECK (computation_method IN ('fixed_amount','percentage_of_gross','formula')),
  CONSTRAINT fk_salary_rule_structure FOREIGN KEY (structure_id) REFERENCES salary_structures(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_salary_rules_structure_id ON salary_rules(structure_id);
CREATE INDEX idx_salary_rules_sequence     ON salary_rules(structure_id, sequence);
