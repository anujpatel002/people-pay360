CREATE TABLE IF NOT EXISTS attendance_records (
  id                CHAR(36)    NOT NULL DEFAULT (UUID()),
  employee_id       CHAR(36)    NOT NULL,
  schedule_id       CHAR(36)    DEFAULT NULL,
  date              DATE        NOT NULL,
  check_in          DATETIME    NOT NULL,
  check_out         DATETIME    DEFAULT NULL,
  scheduled_minutes INT         DEFAULT NULL CHECK (scheduled_minutes >= 0),
  break_minutes     INT         NOT NULL DEFAULT 0 CHECK (break_minutes >= 0),
  worked_minutes    INT         DEFAULT NULL CHECK (worked_minutes >= 0),
  overtime_minutes  INT         NOT NULL DEFAULT 0 CHECK (overtime_minutes >= 0),
  status            VARCHAR(30) NOT NULL DEFAULT 'Present',
  is_manual_entry   TINYINT(1)  NOT NULL DEFAULT 0,
  correction_reason TEXT        DEFAULT NULL,
  corrected_by      CHAR(36)    DEFAULT NULL,
  corrected_at      DATETIME    DEFAULT NULL,
  created_at        DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  open_session_employee_id CHAR(36)
    GENERATED ALWAYS AS (IF(check_out IS NULL, employee_id, NULL)) STORED,
  PRIMARY KEY (id),
  CONSTRAINT chk_attendance_status CHECK (status IN ('Present','Late','Absent','Overtime','Missing Check-Out','Corrected')),
  CONSTRAINT chk_attendance_checkout_after_checkin CHECK (check_out IS NULL OR check_out > check_in),
  CONSTRAINT chk_attendance_scheduled_minutes CHECK (scheduled_minutes IS NULL OR scheduled_minutes >= break_minutes),
  CONSTRAINT chk_attendance_correction_fields CHECK (
    is_manual_entry = 0 OR (
      is_manual_entry = 1
      AND correction_reason IS NOT NULL
      AND LENGTH(TRIM(correction_reason)) > 0
      AND corrected_at IS NOT NULL
    )
  ),
  CONSTRAINT fk_attendance_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
  CONSTRAINT fk_attendance_schedule FOREIGN KEY (schedule_id) REFERENCES working_schedules(id) ON DELETE RESTRICT,
  CONSTRAINT fk_attendance_corrected FOREIGN KEY (corrected_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_attendance_open_session (open_session_employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_attendance_employee_id ON attendance_records(employee_id);
CREATE INDEX idx_attendance_date ON attendance_records(date);
CREATE INDEX idx_attendance_status ON attendance_records(status);
CREATE INDEX idx_attendance_employee_date ON attendance_records(employee_id, date);
CREATE INDEX idx_attendance_schedule_id ON attendance_records(schedule_id);

CREATE TABLE IF NOT EXISTS attendance_corrections (
  id                         CHAR(36)    NOT NULL DEFAULT (UUID()),
  attendance_id              CHAR(36)    NOT NULL,
  original_check_in          DATETIME    NOT NULL,
  original_check_out         DATETIME    DEFAULT NULL,
  original_worked_minutes    INT         DEFAULT NULL,
  original_overtime_minutes  INT         NOT NULL DEFAULT 0,
  original_status            VARCHAR(30) NOT NULL,
  corrected_check_in         DATETIME    NOT NULL,
  corrected_check_out        DATETIME    DEFAULT NULL,
  corrected_worked_minutes   INT         DEFAULT NULL,
  corrected_overtime_minutes INT         NOT NULL DEFAULT 0,
  corrected_status            VARCHAR(30) NOT NULL,
  correction_reason          TEXT        NOT NULL,
  corrected_by               CHAR(36)    NOT NULL,
  corrected_at               DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at                 DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT chk_correction_checkout_after_checkin CHECK (corrected_check_out IS NULL OR corrected_check_out > corrected_check_in),
  CONSTRAINT chk_correction_reason CHECK (LENGTH(TRIM(correction_reason)) > 0),
  CONSTRAINT chk_original_worked_minutes CHECK (original_worked_minutes IS NULL OR original_worked_minutes >= 0),
  CONSTRAINT chk_corrected_worked_minutes CHECK (corrected_worked_minutes IS NULL OR corrected_worked_minutes >= 0),
  CONSTRAINT chk_original_overtime_minutes CHECK (original_overtime_minutes >= 0),
  CONSTRAINT chk_corrected_overtime_minutes CHECK (corrected_overtime_minutes >= 0),
  CONSTRAINT fk_attendance_correction_attendance FOREIGN KEY (attendance_id) REFERENCES attendance_records(id) ON DELETE RESTRICT,
  CONSTRAINT fk_attendance_correction_user FOREIGN KEY (corrected_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_attendance_corrections_attendance_id ON attendance_corrections(attendance_id);
CREATE INDEX idx_attendance_corrections_corrected_by ON attendance_corrections(corrected_by);
CREATE INDEX idx_attendance_corrections_corrected_at ON attendance_corrections(corrected_at);
