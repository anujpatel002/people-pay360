CREATE TABLE IF NOT EXISTS time_off_requests (
  id              CHAR(36)     NOT NULL DEFAULT (UUID()),
  employee_id     CHAR(36)     NOT NULL,
  type_id         CHAR(36)     NOT NULL,
  allocation_id   CHAR(36)     DEFAULT NULL,
  start_date      DATE         NOT NULL,
  end_date        DATE         NOT NULL,
  days            DECIMAL(6,2) NOT NULL CHECK (days > 0),
  status          VARCHAR(20)  NOT NULL DEFAULT 'Confirmed',
  reason          TEXT         DEFAULT NULL,
  refusal_reason  TEXT         DEFAULT NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT chk_request_status CHECK (status IN ('Draft','Confirmed','Approved','Refused','Cancelled')),
  CONSTRAINT chk_request_dates  CHECK (end_date >= start_date),
  CONSTRAINT fk_request_employee   FOREIGN KEY (employee_id)   REFERENCES employees(id)             ON DELETE RESTRICT,
  CONSTRAINT fk_request_type       FOREIGN KEY (type_id)       REFERENCES time_off_types(id)        ON DELETE RESTRICT,
  CONSTRAINT fk_request_allocation FOREIGN KEY (allocation_id) REFERENCES time_off_allocations(id)  ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_requests_employee_id ON time_off_requests(employee_id);
CREATE INDEX idx_requests_type_id     ON time_off_requests(type_id);
CREATE INDEX idx_requests_status      ON time_off_requests(status);
CREATE INDEX idx_requests_dates       ON time_off_requests(start_date, end_date);
