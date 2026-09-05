CREATE TABLE IF NOT EXISTS employees (
  id           CHAR(36)     NOT NULL DEFAULT (UUID()),
  first_name   VARCHAR(100) NOT NULL,
  last_name    VARCHAR(100) NOT NULL,
  work_email   VARCHAR(255) NOT NULL,
  phone        VARCHAR(30),
  job_title    VARCHAR(100),
  job_position VARCHAR(100),
  department   VARCHAR(100),
  manager_id   CHAR(36)     DEFAULT NULL,
  schedule_id  CHAR(36)     DEFAULT NULL,
  company      VARCHAR(100),
  location     VARCHAR(100),
  status       VARCHAR(20)  NOT NULL DEFAULT 'active',
  hire_date    DATE         NOT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_employee_work_email UNIQUE (work_email),
  CONSTRAINT chk_employee_status CHECK (status IN ('active', 'archived')),
  CONSTRAINT fk_employee_manager  FOREIGN KEY (manager_id)  REFERENCES employees(id) ON DELETE SET NULL,
  CONSTRAINT fk_employee_schedule FOREIGN KEY (schedule_id) REFERENCES working_schedules(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TRIGGER trg_employee_no_self_manager
BEFORE INSERT ON employees
FOR EACH ROW
  IF NEW.manager_id IS NOT NULL AND NEW.manager_id = NEW.id THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Employee cannot be their own manager';
  END IF;

CREATE TRIGGER trg_employee_no_self_manager_upd
BEFORE UPDATE ON employees
FOR EACH ROW
  IF NEW.manager_id IS NOT NULL AND NEW.manager_id = NEW.id THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Employee cannot be their own manager';
  END IF;
