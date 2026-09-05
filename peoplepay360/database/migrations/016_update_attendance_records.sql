-- Adds schedule snapshots and immutable correction history to existing attendance data.

ALTER TABLE attendance_records
  ADD COLUMN schedule_id CHAR(36) DEFAULT NULL,
  ADD COLUMN scheduled_minutes INT DEFAULT NULL CHECK (scheduled_minutes >= 0),
  ADD COLUMN break_minutes INT NOT NULL DEFAULT 0 CHECK (break_minutes >= 0),
  ADD COLUMN open_session_employee_id CHAR(36)
    GENERATED ALWAYS AS (IF(check_out IS NULL, employee_id, NULL)) STORED;

ALTER TABLE attendance_records
  MODIFY COLUMN status VARCHAR(30) NOT NULL DEFAULT 'Present',
  DROP CHECK chk_attendance_status,
  DROP CHECK chk_checkout_after_checkin,
  DROP CHECK chk_correction_fields,
  ADD CONSTRAINT chk_attendance_status CHECK (status IN ('Present','Late','Absent','Overtime','Missing Check-Out','Corrected')),
  ADD CONSTRAINT chk_attendance_checkout_after_checkin CHECK (check_out IS NULL OR check_out > check_in),
  ADD CONSTRAINT chk_attendance_scheduled_minutes CHECK (scheduled_minutes IS NULL OR scheduled_minutes >= break_minutes),
  ADD CONSTRAINT chk_attendance_correction_fields CHECK (
    is_manual_entry = 0 OR (
      is_manual_entry = 1
      AND correction_reason IS NOT NULL
      AND LENGTH(TRIM(correction_reason)) > 0
      AND corrected_by IS NOT NULL
      AND corrected_at IS NOT NULL
    )
  ),
  ADD CONSTRAINT fk_attendance_schedule FOREIGN KEY (schedule_id) REFERENCES working_schedules(id) ON DELETE RESTRICT,
  ADD UNIQUE KEY uq_attendance_open_session (open_session_employee_id);

CREATE TABLE attendance_corrections (
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

CREATE INDEX idx_attendance_employee_date ON attendance_records(employee_id, date);
CREATE INDEX idx_attendance_schedule_id ON attendance_records(schedule_id);
CREATE INDEX idx_attendance_corrections_attendance_id ON attendance_corrections(attendance_id);
CREATE INDEX idx_attendance_corrections_corrected_by ON attendance_corrections(corrected_by);
CREATE INDEX idx_attendance_corrections_corrected_at ON attendance_corrections(corrected_at);