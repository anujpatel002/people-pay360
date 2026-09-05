CREATE TABLE IF NOT EXISTS payruns (
  id            CHAR(36)       NOT NULL DEFAULT (UUID()),
  name          VARCHAR(150)   NOT NULL,
  period_start  DATE           NOT NULL,
  period_end    DATE           NOT NULL,
  structure_id  CHAR(36)       NOT NULL,
  status        VARCHAR(20)    NOT NULL DEFAULT 'Draft',
  total_gross   DECIMAL(16,2)  NOT NULL DEFAULT 0 CHECK (total_gross >= 0),
  total_net     DECIMAL(16,2)  NOT NULL DEFAULT 0 CHECK (total_net >= 0),
  warning_count INT            NOT NULL DEFAULT 0 CHECK (warning_count >= 0),
  paid_at       DATETIME       DEFAULT NULL,
  paid_by       CHAR(36)       DEFAULT NULL,
  created_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT chk_payrun_status CHECK (status IN ('Draft','Computed','Validated','Paid')),
  CONSTRAINT chk_payrun_period CHECK (period_end > period_start),
  CONSTRAINT fk_payrun_structure FOREIGN KEY (structure_id) REFERENCES salary_structures(id) ON DELETE RESTRICT,
  CONSTRAINT fk_payrun_paid_by   FOREIGN KEY (paid_by)      REFERENCES users(id)             ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_payruns_status       ON payruns(status);
CREATE INDEX idx_payruns_period       ON payruns(period_start, period_end);
CREATE INDEX idx_payruns_structure_id ON payruns(structure_id);
