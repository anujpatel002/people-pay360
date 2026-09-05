CREATE TABLE IF NOT EXISTS attendance_records (
  id                CHAR(36)    NOT NULL DEFAULT (UUID()),
  employee_id       CHAR(36)    NOT NULL,
  date              DATE        NOT NULL,
  check_in          DATETIME    NOT NULL,
  check_out         DATETIME    DEFAULT NULL,
  worked_minutes    INT         DEFAULT NULL CHECK (worked_minutes >= 0),
  overtime_minutes  INT         NOT NULL DEFAULT 0 CHECK (overtime_minutes >= 0),
  status            VARCHAR(20) NOT NULL DEFAULT 'Present',
  is_manual_entry   TINYINT(1)  NOT NULL DEFAULT 0,
  correction_reason TEXT        DEFAULT NULL,
  corrected_by      CHAR(36)    DEFAULT NULL,
  corrected_at      DATETIME    DEFAULT NULL,
  created_at        DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT chk_attendance_status CHECK (status IN ('Present','Late','Absent','Overtime','Corrected')),
  CONSTRAINT chk_checkout_after_checkin CHECK (check_out IS NULL OR check_out > check_in),
  CONSTRAINT fk_attendance_employee   FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
  CONSTRAINT fk_attendance_corrected  FOREIGN KEY (corrected_by) REFERENCES users(id)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_attendance_employee_id ON attendance_records(employee_id);
CREATE INDEX idx_attendance_date        ON attendance_records(date);
CREATE INDEX idx_attendance_status      ON attendance_records(status);
