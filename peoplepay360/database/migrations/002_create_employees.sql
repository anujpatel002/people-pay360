CREATE TABLE IF NOT EXISTS employees (
  id                      CHAR(36)      NOT NULL DEFAULT (UUID()),
  employee_number         VARCHAR(50)   UNIQUE,

  first_name              VARCHAR(100)  NOT NULL,
  last_name               VARCHAR(100)  NOT NULL,
  work_email              VARCHAR(255)  NOT NULL,
  phone                   VARCHAR(30),
  private_address         TEXT,
  emergency_contact       VARCHAR(150),
  emergency_contact_phone VARCHAR(30),
  avatar_url              TEXT,

  job_title               VARCHAR(100),
  job_position_id         CHAR(36),
  department_id           CHAR(36),
  manager_id              CHAR(36)      DEFAULT NULL,
  employment_type         VARCHAR(20)   NOT NULL DEFAULT 'full_time',
  company_id              CHAR(36),
  location                VARCHAR(100),

  schedule_id             CHAR(36)      DEFAULT NULL,

  hire_date               DATE          NOT NULL,
  current_contract_id     CHAR(36)      DEFAULT NULL,

  bank_account            VARCHAR(100),
  iban                    VARCHAR(100),
  swift                   VARCHAR(20),

  status                  VARCHAR(20)   NOT NULL DEFAULT 'active',

  created_at              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by              CHAR(36),
  updated_by              CHAR(36),
  archived_at             DATETIME,
  archived_by             CHAR(36),

  PRIMARY KEY (id),

  CONSTRAINT uq_employee_work_email   UNIQUE  (work_email),
  CONSTRAINT uq_employee_number       UNIQUE  (employee_number),
  CONSTRAINT chk_employee_status      CHECK   (status          IN ('active', 'archived')),
  CONSTRAINT chk_employment_type      CHECK   (employment_type IN ('full_time', 'part_time', 'contractor')),

  CONSTRAINT fk_employee_manager      FOREIGN KEY (manager_id)   REFERENCES employees(id) ON DELETE SET NULL,
  CONSTRAINT fk_employee_schedule     FOREIGN KEY (schedule_id)  REFERENCES working_schedules(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Indexes
CREATE INDEX idx_employees_department_id    ON employees (department_id);
CREATE INDEX idx_employees_job_position_id  ON employees (job_position_id);
CREATE INDEX idx_employees_company_id       ON employees (company_id);
CREATE INDEX idx_employees_employment_type  ON employees (employment_type);
CREATE INDEX idx_employees_status           ON employees (status);

-- Triggers: prevent self-referencing manager
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
