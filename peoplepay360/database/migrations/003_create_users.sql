CREATE TABLE IF NOT EXISTS users (
  id            CHAR(36)     NOT NULL DEFAULT (UUID()),
  employee_id   CHAR(36)     NOT NULL,
  name          VARCHAR(150) NOT NULL,
  work_email    VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(50)  NOT NULL,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_user_work_email  UNIQUE (work_email),
  CONSTRAINT uq_user_employee_id UNIQUE (employee_id),
  CONSTRAINT chk_user_role CHECK (role IN ('Employee','HR Manager','HR Payroll User','HR Payroll Manager','Admin')),
  CONSTRAINT fk_user_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
