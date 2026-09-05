# Database Schema — PeoplePay360

All tables use `UUID` primary keys. `created_at` and `updated_at` are `TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()` on every table unless noted. Soft deletes use status/isActive columns — no hard deletes except `payslip_lines`. Foreign keys use `ON DELETE RESTRICT` unless noted.

---

## Table Index

1. `working_schedules`
2. `employees`
3. `users`
4. `refresh_tokens`
5. `contracts`
6. `attendance_records`
7. `time_off_types`
8. `time_off_allocations`
9. `time_off_requests`
10. `salary_structures`
11. `salary_rules`
12. `payruns`
13. `payslips`
14. `payslip_lines`

---

## Relationship Overview

### Notation
```
||--||   One-to-One   (exactly one on each side)
||--|<   One-to-Many  (one on left, many on right)
>|--|<   Many-to-Many (resolved via junction table)
```

### One-to-One (1:1)

| Table A | | Table B | Via Column | Note |
|---|---|---|---|---|
| `employees` | `||--||` | `users` | `users.employee_id` | UNIQUE constraint — one login per employee |

### One-to-Many (1:N)

| One (Parent) | | Many (Child) | Via Column | Note |
|---|---|---|---|---|
| `employees` | `||--|<` | `employees` | `employees.manager_id` | Self-referential — employee hierarchy |
| `employees` | `||--|<` | `refresh_tokens` | via `users` chain | Indirect — user has many tokens |
| `employees` | `||--|<` | `contracts` | `contracts.employee_id` | Employee has many contracts over time |
| `employees` | `||--|<` | `attendance_records` | `attendance_records.employee_id` | Daily check-in records per employee |
| `employees` | `||--|<` | `time_off_allocations` | `time_off_allocations.employee_id` | Leave balance grants per employee |
| `employees` | `||--|<` | `time_off_requests` | `time_off_requests.employee_id` | Leave requests per employee |
| `employees` | `||--|<` | `payslips` | `payslips.employee_id` | One payslip per employee per payrun |
| `users` | `||--|<` | `refresh_tokens` | `refresh_tokens.user_id` | Many tokens per user (rotation) |
| `working_schedules` | `||--|<` | `employees` | `employees.schedule_id` | Many employees share one schedule |
| `working_schedules` | `||--|<` | `contracts` | `contracts.schedule_id` | Many contracts reference one schedule |
| `working_schedules` | `||--|<` | `attendance_records` | `attendance_records.schedule_id` | Records linked to schedule for OT calc |
| `salary_structures` | `||--|<` | `salary_rules` | `salary_rules.structure_id` | Structure has many ordered rules |
| `salary_structures` | `||--|<` | `contracts` | `contracts.structure_id` | Many contracts use one structure |
| `salary_structures` | `||--|<` | `payruns` | `payruns.structure_id` | Many payruns use one structure |
| `contracts` | `||--|<` | `payslips` | `payslips.contract_id` | Contract snapshotted on each payslip |
| `time_off_types` | `||--|<` | `time_off_allocations` | `time_off_allocations.type_id` | Many allocations per leave type |
| `time_off_types` | `||--|<` | `time_off_requests` | `time_off_requests.type_id` | Many requests per leave type |
| `time_off_allocations` | `||--|<` | `time_off_requests` | `time_off_requests.allocation_id` | Requests drawn from an allocation |
| `payruns` | `||--|<` | `payslips` | `payslips.payrun_id` | Many payslips per payrun batch |
| `payslips` | `||--|<` | `payslip_lines` | `payslip_lines.payslip_id` | Many rule lines per payslip |

### Many-to-Many (M:N)

> No direct M:N join tables exist. The following pairs have an M:N nature resolved via an intermediate table:

| Table A | Junction Table | Table B | Note |
|---|---|---|---|
| `employees` | `time_off_allocations` | `time_off_types` | Employee ↔ leave type balance per year |
| `employees` | `payslips` | `payruns` | Employee ↔ payrun batch (one payslip each) |
| `salary_structures` | `salary_rules` | *(rules are owned, not shared)* | Rules belong exclusively to one structure |

### Full Diagram

```
working_schedules ||--|< employees          (schedule_id)
working_schedules ||--|< contracts          (schedule_id)
working_schedules ||--|< attendance_records (schedule_id)

employees ||--|| users                      (employee_id, UNIQUE)
employees ||--|< employees                  (manager_id, self-ref)
employees ||--|< contracts                  (employee_id)
employees ||--|< attendance_records         (employee_id)
employees ||--|< time_off_allocations       (employee_id)
employees ||--|< time_off_requests          (employee_id)
employees ||--|< payslips                   (employee_id)

users     ||--|< refresh_tokens             (user_id)

salary_structures ||--|< salary_rules       (structure_id)
salary_structures ||--|< contracts          (structure_id)
salary_structures ||--|< payruns            (structure_id)

contracts ||--|< payslips                   (contract_id)

time_off_types ||--|< time_off_allocations  (type_id)
time_off_types ||--|< time_off_requests     (type_id)
time_off_allocations ||--|< time_off_requests (allocation_id)

payruns   ||--|< payslips                   (payrun_id)
payslips  ||--|< payslip_lines              (payslip_id)
```

---

## 1. `working_schedules`

Stores reusable weekly work patterns. `weekly_hours` is computed from `days` JSON and stored on save.

```sql
CREATE TABLE working_schedules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(100)   NOT NULL,
  company      VARCHAR(100)   NOT NULL,
  timezone     VARCHAR(60)    NOT NULL DEFAULT 'UTC',
  weekly_hours NUMERIC(5,2)   NOT NULL CHECK (weekly_hours >= 0),
  days         JSONB          NOT NULL,
  is_active    BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_schedule_name_company UNIQUE (name, company)
);
```

**`days` JSONB element shape:**
```json
{
  "day": "monday",
  "active": true,
  "start": "09:00",
  "end": "18:00",
  "breakMinutes": 60
}
```

**Constraints:**
- `weekly_hours >= 0` — cannot be negative
- `UNIQUE (name, company)` — no duplicate schedule names per company
- `days` must contain exactly 7 entries (monday–sunday) — enforced at application layer
- `end > start` for active days — enforced at application layer before persist

**Referenced by:** `employees.schedule_id`, `contracts.schedule_id`

---

## 2. `employees`

Central HR master record. All operational modules reference this table.

```sql
CREATE TABLE employees (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name   VARCHAR(100)   NOT NULL,
  last_name    VARCHAR(100)   NOT NULL,
  work_email   VARCHAR(255)   NOT NULL,
  phone        VARCHAR(30),
  job_title    VARCHAR(100),
  job_position VARCHAR(100),
  department   VARCHAR(100),
  manager_id   UUID           REFERENCES employees(id) ON DELETE SET NULL,
  schedule_id  UUID           REFERENCES working_schedules(id) ON DELETE SET NULL,
  company      VARCHAR(100),
  location     VARCHAR(100),
  status       VARCHAR(20)    NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active', 'archived')),
  hire_date    DATE           NOT NULL,
  created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_employee_work_email UNIQUE (work_email),
  CONSTRAINT chk_no_self_manager CHECK (manager_id <> id)
);
```

**Constraints:**
- `UNIQUE (work_email)` — one employee per email
- `CHECK (manager_id <> id)` — employee cannot be their own manager
- `status IN ('active', 'archived')` — soft archive only, no hard delete
- `manager_id` → self-referential FK, `SET NULL` on manager archive
- `schedule_id` → `SET NULL` on schedule delete (blocked at app layer first)

**Referenced by:** `users.employee_id`, `contracts.employee_id`, `attendance_records.employee_id`, `time_off_allocations.employee_id`, `time_off_requests.employee_id`, `payslips.employee_id`

---

## 3. `users`

Login identity records. Distinct from `employees`. One user per employee maximum.

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   UUID           NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  name          VARCHAR(150)   NOT NULL,
  work_email    VARCHAR(255)   NOT NULL,
  password_hash VARCHAR(255)   NOT NULL,
  role          VARCHAR(50)    NOT NULL
                               CHECK (role IN (
                                 'Employee',
                                 'HR Manager',
                                 'HR Payroll User',
                                 'HR Payroll Manager',
                                 'Admin'
                               )),
  is_active     BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_user_work_email   UNIQUE (work_email),
  CONSTRAINT uq_user_employee_id  UNIQUE (employee_id)
);
```

**Constraints:**
- `UNIQUE (work_email)` — no duplicate login emails
- `UNIQUE (employee_id)` — one user account per employee
- `role IN (...)` — must be one of the five canonical roles
- `employee_id` → `RESTRICT` — cannot delete employee while user account exists
- `is_active = false` is the only supported deactivation (no hard delete)
- `password_hash` stores bcrypt output — plain text never stored

---

## 4. `refresh_tokens`

Tracks issued refresh tokens for rotation and invalidation.

```sql
CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL,
  expires_at  TIMESTAMPTZ  NOT NULL,
  revoked     BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_refresh_token_hash UNIQUE (token_hash)
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

**Constraints:**
- `UNIQUE (token_hash)` — each token is unique
- `CASCADE` on user delete — tokens removed when user is deleted
- `revoked = true` marks logout; expired tokens cleaned up by scheduled job

---

## 5. `contracts`

Historical employment contracts per employee. No hard deletes — status changes only.

```sql
CREATE TABLE contracts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   UUID           NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  contract_ref  VARCHAR(50),
  status        VARCHAR(20)    NOT NULL DEFAULT 'New'
                               CHECK (status IN ('New', 'Running', 'Expired', 'Cancelled')),
  department    VARCHAR(100),
  job_position  VARCHAR(100),
  wage          NUMERIC(12,2)  NOT NULL CHECK (wage >= 0),
  start_date    DATE           NOT NULL,
  end_date      DATE,
  schedule_id   UUID           REFERENCES working_schedules(id) ON DELETE RESTRICT,
  structure_id  UUID           REFERENCES salary_structures(id) ON DELETE RESTRICT,
  notes         TEXT,
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_contract_dates CHECK (end_date IS NULL OR end_date > start_date)
);

CREATE INDEX idx_contracts_employee_id  ON contracts(employee_id);
CREATE INDEX idx_contracts_status       ON contracts(status);
CREATE INDEX idx_contracts_dates        ON contracts(start_date, end_date);
```

**Constraints:**
- `CHECK (end_date IS NULL OR end_date > start_date)` — end must be after start when set
- `CHECK (wage >= 0)` — non-negative wage
- `end_date IS NULL` = open-ended (still active) contract
- `employee_id` → `RESTRICT` — employee cannot be deleted while contracts exist
- `schedule_id` → `RESTRICT` — schedule cannot be deleted while referenced by contract
- `structure_id` → `RESTRICT` — salary structure cannot be deleted while referenced
- Overlapping `Running` contracts for same `employee_id` blocked at application layer

**Referenced by:** `payslips.contract_id`

---

## 6. `attendance_records`

Daily check-in/check-out records. `worked_minutes` and `overtime_minutes` computed on check-out and stored.

```sql
CREATE TABLE attendance_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id       UUID         NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  date              DATE         NOT NULL,
  check_in          TIMESTAMPTZ  NOT NULL,
  check_out         TIMESTAMPTZ,
  worked_minutes    INTEGER      CHECK (worked_minutes >= 0),
  overtime_minutes  INTEGER      NOT NULL DEFAULT 0 CHECK (overtime_minutes >= 0),
  status            VARCHAR(20)  NOT NULL DEFAULT 'Present'
                                 CHECK (status IN (
                                   'Present', 'Late', 'Absent', 'Overtime', 'Corrected'
                                 )),
  is_manual_entry   BOOLEAN      NOT NULL DEFAULT FALSE,
  correction_reason TEXT,
  corrected_by      UUID         REFERENCES users(id) ON DELETE SET NULL,
  corrected_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_checkout_after_checkin
    CHECK (check_out IS NULL OR check_out > check_in),
  CONSTRAINT chk_correction_fields
    CHECK (
      (is_manual_entry = FALSE) OR
      (is_manual_entry = TRUE AND correction_reason IS NOT NULL)
    ),
  CONSTRAINT uq_employee_open_session
    UNIQUE NULLS NOT DISTINCT (employee_id, check_out)
);

CREATE INDEX idx_attendance_employee_id ON attendance_records(employee_id);
CREATE INDEX idx_attendance_date        ON attendance_records(date);
CREATE INDEX idx_attendance_status      ON attendance_records(status);
```

**Constraints:**
- `CHECK (check_out > check_in)` — checkout must be after check-in when set
- `CHECK (worked_minutes >= 0)` — no negative worked time
- `UNIQUE NULLS NOT DISTINCT (employee_id, check_out)` — only one open session (check_out IS NULL) per employee at a time
- `CHECK (is_manual_entry = TRUE AND correction_reason IS NOT NULL)` — corrections require a reason
- `corrected_by` → `SET NULL` on user delete (audit trail preserved via reason text)
- `employee_id` → `RESTRICT` — employee cannot be deleted while attendance records exist

---

## 7. `time_off_types`

Configurable leave policy definitions. Controls allocation requirements, approval flow, and payroll integration.

```sql
CREATE TABLE time_off_types (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                VARCHAR(100)  NOT NULL,
  unit                VARCHAR(10)   NOT NULL CHECK (unit IN ('days', 'hours')),
  allocation_required BOOLEAN       NOT NULL DEFAULT TRUE,
  approval_mode       VARCHAR(40)   NOT NULL DEFAULT 'time_off'
                                    CHECK (approval_mode IN (
                                      'no_validation',
                                      'time_off',
                                      'set_by_time_off_officer'
                                    )),
  is_paid             BOOLEAN       NOT NULL DEFAULT TRUE,
  work_entry          VARCHAR(50),
  color               VARCHAR(7),
  is_active           BOOLEAN       NOT NULL DEFAULT TRUE,
  notes               TEXT,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_time_off_type_name UNIQUE (name)
);
```

**Constraints:**
- `UNIQUE (name)` — no duplicate leave type names
- `unit IN ('days', 'hours')` — only supported units
- `approval_mode IN (...)` — must be one of three modes
- `color` stores hex code (e.g. `#4CAF50`) — length 7 enforced by `VARCHAR(7)`

**Referenced by:** `time_off_allocations.type_id`, `time_off_requests.type_id`

---

## 8. `time_off_allocations`

Employee leave balance grants. `used_days` updated atomically on request approval/refusal.

```sql
CREATE TABLE time_off_allocations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id    UUID          NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  type_id        UUID          NOT NULL REFERENCES time_off_types(id) ON DELETE RESTRICT,
  year           SMALLINT      NOT NULL CHECK (year >= 2000),
  total_days     NUMERIC(6,2)  NOT NULL CHECK (total_days > 0),
  used_days      NUMERIC(6,2)  NOT NULL DEFAULT 0 CHECK (used_days >= 0),
  validity_start DATE          NOT NULL,
  validity_end   DATE          NOT NULL,
  approver_id    UUID          REFERENCES users(id) ON DELETE SET NULL,
  status         VARCHAR(20)   NOT NULL DEFAULT 'Approved'
                               CHECK (status IN ('Draft', 'Confirmed', 'Approved', 'Refused')),
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_allocation_validity   CHECK (validity_end > validity_start),
  CONSTRAINT chk_used_lte_total        CHECK (used_days <= total_days),
  CONSTRAINT uq_employee_type_year     UNIQUE (employee_id, type_id, year)
);

CREATE INDEX idx_allocations_employee_id ON time_off_allocations(employee_id);
CREATE INDEX idx_allocations_type_id     ON time_off_allocations(type_id);
```

**Constraints:**
- `UNIQUE (employee_id, type_id, year)` — one allocation per employee per type per year
- `CHECK (used_days <= total_days)` — cannot use more than allocated
- `CHECK (validity_end > validity_start)` — valid date range
- `CHECK (total_days > 0)` — must allocate a positive amount
- `used_days` updated inside a DB transaction by `allocation-balance.service.ts`
- `approver_id` → `SET NULL` on user delete (allocation record preserved)

**Referenced by:** `time_off_requests.allocation_id`

---

## 9. `time_off_requests`

Individual leave requests. Balance deducted atomically on approval only.

```sql
CREATE TABLE time_off_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     UUID          NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  type_id         UUID          NOT NULL REFERENCES time_off_types(id) ON DELETE RESTRICT,
  allocation_id   UUID          REFERENCES time_off_allocations(id) ON DELETE RESTRICT,
  start_date      DATE          NOT NULL,
  end_date        DATE          NOT NULL,
  days            NUMERIC(6,2)  NOT NULL CHECK (days > 0),
  status          VARCHAR(20)   NOT NULL DEFAULT 'Confirmed'
                                CHECK (status IN (
                                  'Draft', 'Confirmed', 'Approved', 'Refused', 'Cancelled'
                                )),
  reason          TEXT,
  refusal_reason  TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_request_dates CHECK (end_date >= start_date),
  CONSTRAINT chk_refusal_reason
    CHECK (
      status <> 'Refused' OR refusal_reason IS NOT NULL
    )
);

CREATE INDEX idx_requests_employee_id ON time_off_requests(employee_id);
CREATE INDEX idx_requests_type_id     ON time_off_requests(type_id);
CREATE INDEX idx_requests_status      ON time_off_requests(status);
CREATE INDEX idx_requests_dates       ON time_off_requests(start_date, end_date);
```

**Constraints:**
- `CHECK (end_date >= start_date)` — end cannot be before start
- `CHECK (days > 0)` — must request at least a partial day
- `CHECK (status = 'Refused' → refusal_reason IS NOT NULL)` — refusal requires reason
- `allocation_id` nullable — for leave types where `allocation_required = false`
- Balance deduction happens only on transition to `Approved` — enforced in service layer transaction

---

## 10. `salary_structures`

Containers for ordered sets of salary rules. Selected on a contract and payrun.

```sql
CREATE TABLE salary_structures (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(100) NOT NULL,
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_salary_structure_name UNIQUE (name)
);
```

**Constraints:**
- `UNIQUE (name)` — no duplicate structure names
- Cannot be deleted while referenced by any `contracts.structure_id` or `payruns.structure_id` — enforced via `RESTRICT` FK on those tables

**Referenced by:** `contracts.structure_id`, `payruns.structure_id`, `salary_rules.structure_id`

---

## 11. `salary_rules`

Individual computation rules within a structure. Executed in ascending `sequence` order.

```sql
CREATE TABLE salary_rules (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_id       UUID          NOT NULL REFERENCES salary_structures(id) ON DELETE CASCADE,
  code               VARCHAR(50)   NOT NULL,
  name               VARCHAR(150)  NOT NULL,
  category           VARCHAR(20)   NOT NULL
                                   CHECK (category IN (
                                     'Basic', 'Allowance', 'Gross',
                                     'Deduction', 'Net', 'Other'
                                   )),
  sequence           INTEGER       NOT NULL CHECK (sequence > 0),
  computation_method VARCHAR(30)   NOT NULL
                                   CHECK (computation_method IN (
                                     'fixed_amount',
                                     'percentage_of_gross',
                                     'formula'
                                   )),
  amount             NUMERIC(14,2) CHECK (amount >= 0),
  percentage         NUMERIC(7,4)  CHECK (percentage >= 0 AND percentage <= 100),
  formula            TEXT,
  is_active          BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_rule_code_per_structure  UNIQUE (structure_id, code),
  CONSTRAINT chk_computation_fields CHECK (
    (computation_method = 'fixed_amount'       AND amount IS NOT NULL) OR
    (computation_method = 'percentage_of_gross' AND percentage IS NOT NULL) OR
    (computation_method = 'formula'             AND formula IS NOT NULL)
  )
);

CREATE INDEX idx_salary_rules_structure_id ON salary_rules(structure_id);
CREATE INDEX idx_salary_rules_sequence     ON salary_rules(structure_id, sequence);
```

**Constraints:**
- `UNIQUE (structure_id, code)` — rule codes unique within a structure; code used as variable in formula evaluation
- `CHECK (sequence > 0)` — sequence must be positive
- `CHECK (computation_fields)` — exactly the right field must be populated per method
- `CASCADE` on structure delete — rules deleted when their structure is deleted
- Circular formula dependencies detected at application layer before save
- `category IN (...)` — must be one of six canonical categories

---

## 12. `payruns`

Payroll batch records. Status transitions are one-way: Draft → Computed → Validated → Paid.

```sql
CREATE TABLE payruns (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(150)  NOT NULL,
  period_start  DATE          NOT NULL,
  period_end    DATE          NOT NULL,
  structure_id  UUID          NOT NULL REFERENCES salary_structures(id) ON DELETE RESTRICT,
  status        VARCHAR(20)   NOT NULL DEFAULT 'Draft'
                              CHECK (status IN ('Draft', 'Computed', 'Validated', 'Paid')),
  total_gross   NUMERIC(16,2) NOT NULL DEFAULT 0 CHECK (total_gross >= 0),
  total_net     NUMERIC(16,2) NOT NULL DEFAULT 0 CHECK (total_net >= 0),
  warning_count INTEGER       NOT NULL DEFAULT 0 CHECK (warning_count >= 0),
  paid_at       TIMESTAMPTZ,
  paid_by       UUID          REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_payrun_period     CHECK (period_end > period_start),
  CONSTRAINT chk_paid_fields       CHECK (
    (status <> 'Paid') OR (paid_at IS NOT NULL AND paid_by IS NOT NULL)
  )
);

CREATE INDEX idx_payruns_status       ON payruns(status);
CREATE INDEX idx_payruns_period       ON payruns(period_start, period_end);
CREATE INDEX idx_payruns_structure_id ON payruns(structure_id);
```

**Constraints:**
- `CHECK (period_end > period_start)` — valid period range
- `CHECK (status = 'Paid' → paid_at IS NOT NULL AND paid_by IS NOT NULL)` — paid record must capture who/when
- `structure_id` → `RESTRICT` — structure cannot be deleted while referenced by a payrun
- `paid_by` → `SET NULL` on user delete (historical record preserved)
- State transitions enforced at application layer — no DB trigger needed
- Fields frozen after `Paid` status — enforced at application layer

**Referenced by:** `payslips.payrun_id`

---

## 13. `payslips`

Individual employee payslip within a payrun. `contract_id` is a snapshot reference.

```sql
CREATE TABLE payslips (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payrun_id     UUID          NOT NULL REFERENCES payruns(id) ON DELETE RESTRICT,
  employee_id   UUID          NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  contract_id   UUID          NOT NULL REFERENCES contracts(id) ON DELETE RESTRICT,
  gross         NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (gross >= 0),
  deductions    NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (deductions >= 0),
  net           NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (net >= 0),
  worked_days   NUMERIC(5,2)  NOT NULL DEFAULT 0 CHECK (worked_days >= 0),
  status        VARCHAR(20)   NOT NULL DEFAULT 'Draft'
                              CHECK (status IN ('Draft', 'Computed', 'Validated', 'Paid')),
  warning_codes JSONB         NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_payslip_per_employee_per_run UNIQUE (payrun_id, employee_id),
  CONSTRAINT chk_net_lte_gross               CHECK (net <= gross)
);

CREATE INDEX idx_payslips_payrun_id   ON payslips(payrun_id);
CREATE INDEX idx_payslips_employee_id ON payslips(employee_id);
CREATE INDEX idx_payslips_status      ON payslips(status);
```

**Constraints:**
- `UNIQUE (payrun_id, employee_id)` — one payslip per employee per payrun; duplicate detected as blocking warning
- `CHECK (net <= gross)` — net cannot exceed gross
- `CHECK (gross >= 0)`, `CHECK (deductions >= 0)`, `CHECK (net >= 0)` — no negative amounts
- `warning_codes` stores JSON array of warning code strings e.g. `["MISSING_BANK_DETAILS"]`
- `contract_id` → `RESTRICT` — contract cannot be deleted while payslip references it (historical snapshot)
- `payrun_id` → `RESTRICT` — payrun cannot be deleted while payslips exist

**Referenced by:** `payslip_lines.payslip_id`

---

## 14. `payslip_lines`

Individual salary rule computation results within a payslip. One row per rule per payslip.

```sql
CREATE TABLE payslip_lines (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payslip_id  UUID          NOT NULL REFERENCES payslips(id) ON DELETE CASCADE,
  rule_code   VARCHAR(50)   NOT NULL,
  rule_name   VARCHAR(150)  NOT NULL,
  category    VARCHAR(20)   NOT NULL
                            CHECK (category IN (
                              'Basic', 'Allowance', 'Gross',
                              'Deduction', 'Net', 'Other'
                            )),
  amount      NUMERIC(14,2) NOT NULL,
  sequence    INTEGER       NOT NULL CHECK (sequence > 0),
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_line_rule_per_payslip UNIQUE (payslip_id, rule_code)
);

CREATE INDEX idx_payslip_lines_payslip_id ON payslip_lines(payslip_id);
CREATE INDEX idx_payslip_lines_sequence   ON payslip_lines(payslip_id, sequence);
```

**Constraints:**
- `UNIQUE (payslip_id, rule_code)` — one line per rule per payslip
- `CHECK (sequence > 0)` — sequence must be positive
- `CASCADE` on payslip delete — lines removed when payslip is deleted
- `rule_code` and `rule_name` are denormalized snapshots — preserved even if the source `salary_rules` row changes later
- `amount` can be negative (e.g. deduction lines stored as negative values) — no sign constraint here

---

## Indexes Summary

| Table | Index | Columns |
|-------|-------|---------|
| `refresh_tokens` | `idx_refresh_tokens_user_id` | `user_id` |
| `refresh_tokens` | `idx_refresh_tokens_expires_at` | `expires_at` |
| `contracts` | `idx_contracts_employee_id` | `employee_id` |
| `contracts` | `idx_contracts_status` | `status` |
| `contracts` | `idx_contracts_dates` | `start_date, end_date` |
| `attendance_records` | `idx_attendance_employee_id` | `employee_id` |
| `attendance_records` | `idx_attendance_date` | `date` |
| `attendance_records` | `idx_attendance_status` | `status` |
| `time_off_allocations` | `idx_allocations_employee_id` | `employee_id` |
| `time_off_allocations` | `idx_allocations_type_id` | `type_id` |
| `time_off_requests` | `idx_requests_employee_id` | `employee_id` |
| `time_off_requests` | `idx_requests_type_id` | `type_id` |
| `time_off_requests` | `idx_requests_status` | `status` |
| `time_off_requests` | `idx_requests_dates` | `start_date, end_date` |
| `salary_rules` | `idx_salary_rules_structure_id` | `structure_id` |
| `salary_rules` | `idx_salary_rules_sequence` | `structure_id, sequence` |
| `payruns` | `idx_payruns_status` | `status` |
| `payruns` | `idx_payruns_period` | `period_start, period_end` |
| `payruns` | `idx_payruns_structure_id` | `structure_id` |
| `payslips` | `idx_payslips_payrun_id` | `payrun_id` |
| `payslips` | `idx_payslips_employee_id` | `employee_id` |
| `payslips` | `idx_payslips_status` | `status` |
| `payslip_lines` | `idx_payslip_lines_payslip_id` | `payslip_id` |
| `payslip_lines` | `idx_payslip_lines_sequence` | `payslip_id, sequence` |

---

## Foreign Key Summary

| Table | Column | References | On Delete |
|-------|--------|-----------|-----------|
| `users` | `employee_id` | `employees.id` | RESTRICT |
| `refresh_tokens` | `user_id` | `users.id` | CASCADE |
| `employees` | `manager_id` | `employees.id` | SET NULL |
| `employees` | `schedule_id` | `working_schedules.id` | SET NULL |
| `contracts` | `employee_id` | `employees.id` | RESTRICT |
| `contracts` | `schedule_id` | `working_schedules.id` | RESTRICT |
| `contracts` | `structure_id` | `salary_structures.id` | RESTRICT |
| `attendance_records` | `employee_id` | `employees.id` | RESTRICT |
| `attendance_records` | `corrected_by` | `users.id` | SET NULL |
| `time_off_allocations` | `employee_id` | `employees.id` | RESTRICT |
| `time_off_allocations` | `type_id` | `time_off_types.id` | RESTRICT |
| `time_off_allocations` | `approver_id` | `users.id` | SET NULL |
| `time_off_requests` | `employee_id` | `employees.id` | RESTRICT |
| `time_off_requests` | `type_id` | `time_off_types.id` | RESTRICT |
| `time_off_requests` | `allocation_id` | `time_off_allocations.id` | RESTRICT |
| `salary_rules` | `structure_id` | `salary_structures.id` | CASCADE |
| `payruns` | `structure_id` | `salary_structures.id` | RESTRICT |
| `payruns` | `paid_by` | `users.id` | SET NULL |
| `payslips` | `payrun_id` | `payruns.id` | RESTRICT |
| `payslips` | `employee_id` | `employees.id` | RESTRICT |
| `payslips` | `contract_id` | `contracts.id` | RESTRICT |
| `payslip_lines` | `payslip_id` | `payslips.id` | CASCADE |

---

## Role-Based Access Per Table

### Roles Reference

| Role | Abbreviation |
|---|---|
| Admin | A |
| HR Manager | HM |
| HR Payroll User | HPU |
| HR Payroll Manager | HPM |
| Employee | E |

### Legend
```
✅  Allowed
❌  Denied
(own) Self-record only
```

---

### `users`

| Operation | A | HM | HPU | HPM | E |
|---|---|---|---|---|---|
| Read (list / get) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create | ✅ | ❌ | ❌ | ❌ | ❌ |
| Update | ✅ | ❌ | ❌ | ❌ | ❌ |
| Deactivate | ✅ | ❌ | ❌ | ❌ | ❌ |

> Admin-only. No other role can manage user accounts.

---

### `refresh_tokens`

| Operation | A | HM | HPU | HPM | E |
|---|---|---|---|---|---|
| Issued on login | ✅ | ✅ | ✅ | ✅ | ✅ |
| Rotated on refresh | ✅ | ✅ | ✅ | ✅ | ✅ |
| Revoked on logout | ✅ | ✅ | ✅ | ✅ | ✅ |

> Managed internally by auth module. No direct API access.

---

### `employees`

| Operation | A | HM | HPU | HPM | E |
|---|---|---|---|---|---|
| Read (list / get) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Smart counts | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create | ✅ | ✅ | ✅ | ✅ | ❌ |
| Update | ✅ | ✅ | ✅ | ✅ | ❌ |
| Archive (soft delete) | ✅ | ✅ | ✅ | ✅ | ❌ |
| Restore | ✅ | ✅ | ✅ | ✅ | ❌ |

> All authenticated users can read. Write operations require HR role or above.

---

### `working_schedules`

| Operation | A | HM | HPU | HPM | E |
|---|---|---|---|---|---|
| Read | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create / Update | ✅ | ✅ | ✅ | ✅ | ❌ |
| Deactivate | ✅ | ✅ | ✅ | ✅ | ❌ |

---

### `contracts`

| Operation | A | HM | HPU | HPM | E |
|---|---|---|---|---|---|
| Read (list / get) | ✅ | ✅ | ✅ | ✅ | ❌ |
| Get active contract | ✅ | ❌ | ✅ | ✅ | ❌ |
| Create | ✅ | ✅ | ✅ | ✅ | ❌ |
| Update | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete | ❌ | ❌ | ❌ | ❌ | ❌ |

> No delete endpoint — status change to Expired/Cancelled only. Active contract resolver requires Payroll role.

---

### `attendance_records`

| Operation | A | HM | HPU | HPM | E |
|---|---|---|---|---|---|
| Read (list / get) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Check-in | ✅ | ✅ | ✅ | ✅ | ✅ |
| Check-out | ✅ | ✅ | ✅ | ✅ | ✅ |
| Get open session | ✅ | ✅ | ✅ | ✅ | ✅ |
| Correct record | ✅ | ✅ | ✅ | ✅ | ❌ |
| View corrections | ✅ | ✅ | ✅ | ✅ | ❌ |

> Check-in/out is self-service for all roles. Corrections require HR role.

---

### `time_off_types`

| Operation | A | HM | HPU | HPM | E |
|---|---|---|---|---|---|
| Read | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create / Update | ✅ | ❌ | ❌ | ✅ | ❌ |
| Deactivate | ✅ | ❌ | ❌ | ✅ | ❌ |

> Only HR Payroll Manager and Admin can configure leave types.

---

### `time_off_allocations`

| Operation | A | HM | HPU | HPM | E |
|---|---|---|---|---|---|
| Read | ✅ | ✅ | ✅ | ✅ | ✅(own) |
| Create / Update | ✅ | ✅ | ❌ | ❌ | ❌ |
| Approve / Refuse | ✅ | ✅ | ❌ | ❌ | ❌ |

> HR Manager manages and approves allocations. Employees can view their own balance.

---

### `time_off_requests`

| Operation | A | HM | HPU | HPM | E |
|---|---|---|---|---|---|
| Read all | ✅ | ✅ | ❌ | ❌ | ❌ |
| Read own | ✅ | ✅ | ✅ | ✅ | ✅(own) |
| Create | ✅ | ✅ | ✅ | ✅ | ✅ |
| Approve | ✅ | ✅ | ❌ | ❌ | ❌ |
| Refuse | ✅ | ✅ | ❌ | ❌ | ❌ |
| Cancel (own) | ✅ | ✅ | ✅ | ✅ | ✅(own) |

> Any authenticated user can submit a request. Only HR Manager+ can approve/refuse.

---

### `salary_structures`

| Operation | A | HM | HPU | HPM | E |
|---|---|---|---|---|---|
| Read | ✅ | ✅ | ✅ | ✅ | ❌ |
| Create / Update | ✅ | ❌ | ❌ | ✅ | ❌ |
| Deactivate | ✅ | ❌ | ❌ | ✅ | ❌ |

---

### `salary_rules`

| Operation | A | HM | HPU | HPM | E |
|---|---|---|---|---|---|
| Read | ✅ | ✅ | ✅ | ✅ | ❌ |
| Create / Update | ✅ | ❌ | ❌ | ✅ | ❌ |
| Deactivate | ✅ | ❌ | ❌ | ✅ | ❌ |

---

### `payruns`

| Operation | A | HM | HPU | HPM | E |
|---|---|---|---|---|---|
| Read | ✅ | ❌ | ✅ | ✅ | ❌ |
| Create | ✅ | ❌ | ✅ | ✅ | ❌ |
| Compute | ✅ | ❌ | ✅ | ✅ | ❌ |
| Validate | ✅ | ❌ | ❌ | ✅ | ❌ |
| Mark Paid | ✅ | ❌ | ❌ | ✅ | ❌ |
| Send Payslips | ✅ | ❌ | ❌ | ✅ | ❌ |

> Validate, Mark Paid, and Send require HR Payroll Manager — higher authority actions.

---

### `payslips`

| Operation | A | HM | HPU | HPM | E |
|---|---|---|---|---|---|
| Read (list) | ✅ | ❌ | ✅ | ✅ | ❌ |
| Read own | ✅ | ❌ | ✅ | ✅ | ✅(own) |
| Download PDF | ✅ | ❌ | ✅ | ✅ | ✅(own) |
| Delete | ❌ | ❌ | ❌ | ❌ | ❌ |

> Employees can view and download only their own payslips. No delete — immutable after Paid.

---

### `payslip_lines`

| Operation | A | HM | HPU | HPM | E |
|---|---|---|---|---|---|
| Read (via payslip detail) | ✅ | ❌ | ✅ | ✅ | ✅(own) |
| Create / Update | ❌ | ❌ | ❌ | ❌ | ❌ |

> Lines are system-generated during payrun computation. No manual write access.

---

### Quick Summary Matrix

| Table | Employee | HR Manager | HR Payroll User | HR Payroll Manager | Admin |
|---|---|---|---|---|---|
| `users` | ❌ | ❌ | ❌ | ❌ | ✅ Full |
| `employees` | Read | Full | Full | Full | Full |
| `working_schedules` | Read | Full | Full | Full | Full |
| `contracts` | ❌ | Read+Write | Read+Write (active) | Read+Write (active) | Full |
| `attendance_records` | Check-in/out | Full | Full | Full | Full |
| `time_off_types` | Read | Read | Read | Full | Full |
| `time_off_allocations` | Read(own) | Full | Read | Read | Full |
| `time_off_requests` | Own only | Full | Read | Read | Full |
| `salary_structures` | ❌ | Read | Read | Full | Full |
| `salary_rules` | ❌ | Read | Read | Full | Full |
| `payruns` | ❌ | ❌ | Create+Compute | Full | Full |
| `payslips` | Read(own) | ❌ | Read | Full | Full |
| `payslip_lines` | Read(own) | ❌ | Read | Read | Read |

---

## Docker MySQL Setup & Operations

### Prerequisites
- Docker Desktop installed and running
- Node.js 18+ installed
- `server/.env` configured (see below)

---

### 1. Environment File

`server/.env` — already configured for local dev:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=peoplepay360
DB_USER=root
DB_PASSWORD=root
```

---

### 2. Start MySQL Container

```bash
# From peoplepay360/ root
docker compose up -d db
```

Verify it's healthy:
```bash
docker ps
# peoplepay360-db-1 should show "healthy"
```

Stop the container:
```bash
docker compose down
```

Stop and wipe all data (full reset):
```bash
docker compose down -v
```

---

### 3. Run Migrations

Applies all `.sql` files from `database/migrations/` in order. Skips already-applied files via `_migrations` tracking table.

```bash
cd peoplepay360/server
npx ts-node src/database/migrate.ts
```

Check which migrations have been applied:
```bash
docker exec peoplepay360-db-1 mysql -uroot -proot peoplepay360 -e "SELECT filename, applied_at FROM _migrations ORDER BY filename;"
```

---

### 4. Seed Demo Data

Seeds all tables with realistic demo data. Safe to re-run — uses `ON DUPLICATE KEY UPDATE`.

```bash
cd peoplepay360/server
npx ts-node src/database/seed/index.ts
```

Seeded accounts (password: `Test@1234` for all):

| Role | Name | Email |
|---|---|---|
| Admin | Anuj Patel | anuj.patel@company.com |
| HR Manager | Priya Sharma | priya.sharma@company.com |
| HR Payroll Manager | Neha Desai | neha.desai@company.com |
| HR Payroll User | Rahul Verma | rahul.verma@company.com |
| Employee | Vikram Singh | vikram.singh@company.com |
| Employee | Sneha Patel | sneha.patel@company.com |
| Employee | Amit Kumar | amit.kumar@company.com |
| Employee | Kavita Reddy | kavita.reddy@company.com |

Seeded data includes:
- 3 working schedules (Standard 40h, Part-time 20h, Flexible 35h)
- 2 salary structures with 8 rules each (Regular + Executive)
- 8 employees with manager hierarchy
- 8 users (one per employee)
- 8 running contracts
- 4 time-off types (PTO, Sick, Casual, Unpaid)
- 24 time-off allocations (3 types × 8 employees for 2026)
- 3 sample time-off requests
- 40 attendance records (5 days × 8 employees)
- 2 payruns (Jan 2026 Paid, Feb 2026 Validated)
- 16 payslips with full salary rule lines

---

### 5. Connect to MySQL Shell

```bash
# Interactive MySQL shell
docker exec -it peoplepay360-db-1 mysql -uroot -proot peoplepay360
```

Run a one-off query without entering the shell:
```bash
docker exec peoplepay360-db-1 mysql -uroot -proot peoplepay360 -e "YOUR SQL HERE;"
```

---

### 6. Common Query Operations

#### View all tables
```bash
docker exec peoplepay360-db-1 mysql -uroot -proot peoplepay360 -e "SHOW TABLES;"
```

#### Describe a table schema
```bash
docker exec peoplepay360-db-1 mysql -uroot -proot peoplepay360 -e "DESCRIBE employees;"
```

#### Count rows in all tables
```bash
docker exec peoplepay360-db-1 mysql -uroot -proot peoplepay360 -e "
SELECT TABLE_NAME, TABLE_ROWS
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'peoplepay360'
ORDER BY TABLE_NAME;"
```

#### View all employees
```bash
docker exec peoplepay360-db-1 mysql -uroot -proot peoplepay360 -e "
SELECT id, employee_number, first_name, last_name, work_email, status FROM employees;"
```

#### View all users with roles
```bash
docker exec peoplepay360-db-1 mysql -uroot -proot peoplepay360 -e "
SELECT u.name, u.work_email, u.role, u.is_active FROM users u ORDER BY u.role;"
```

#### View all contracts
```bash
docker exec peoplepay360-db-1 mysql -uroot -proot peoplepay360 -e "
SELECT c.contract_ref, CONCAT(e.first_name,' ',e.last_name) AS employee,
       c.status, c.wage, c.start_date, c.end_date
FROM contracts c JOIN employees e ON e.id = c.employee_id;"
```

#### View time-off balances
```bash
docker exec peoplepay360-db-1 mysql -uroot -proot peoplepay360 -e "
SELECT CONCAT(e.first_name,' ',e.last_name) AS employee,
       t.name AS type, a.total_days, a.used_days,
       (a.total_days - a.used_days) AS remaining
FROM time_off_allocations a
JOIN employees e ON e.id = a.employee_id
JOIN time_off_types t ON t.id = a.type_id
ORDER BY employee, type;"
```

#### View payrun summary
```bash
docker exec peoplepay360-db-1 mysql -uroot -proot peoplepay360 -e "
SELECT name, period_start, period_end, status, total_gross, total_net FROM payruns;"
```

---

### 7. Data Modification Operations

#### Insert a new employee
```bash
docker exec peoplepay360-db-1 mysql -uroot -proot peoplepay360 -e "
INSERT INTO employees (id, employee_number, first_name, last_name, work_email, employment_type, hire_date, status)
VALUES (UUID(), 'EMP-00009', 'John', 'Doe', 'john.doe@company.com', 'full_time', '2026-01-01', 'active');"
```

#### Update an employee status
```bash
docker exec peoplepay360-db-1 mysql -uroot -proot peoplepay360 -e "
UPDATE employees SET status = 'archived' WHERE work_email = 'john.doe@company.com';"
```

#### Reset a user password (bcrypt hash for Test@1234)
```bash
docker exec peoplepay360-db-1 mysql -uroot -proot peoplepay360 -e "
UPDATE users
SET password_hash = '\$2b\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE work_email = 'john.doe@company.com';"
```

#### Deactivate a user
```bash
docker exec peoplepay360-db-1 mysql -uroot -proot peoplepay360 -e "
UPDATE users SET is_active = 0 WHERE work_email = 'john.doe@company.com';"
```

#### Delete test/specific data
```bash
# Delete a specific contract (only if no payslips reference it)
docker exec peoplepay360-db-1 mysql -uroot -proot peoplepay360 -e "
DELETE FROM contracts WHERE contract_ref = 'CTR-2025-001';"

# Delete all attendance records for a date
docker exec peoplepay360-db-1 mysql -uroot -proot peoplepay360 -e "
DELETE FROM attendance_records WHERE date = '2025-01-01';"
```

---

### 8. Wipe & Reseed (Full Reset)

Wipes all data and re-runs migrations + seed from scratch:

```bash
# Step 1 — stop container and delete volume
docker compose down -v

# Step 2 — start fresh container
docker compose up -d db

# Step 3 — wait ~15 seconds for MySQL to be ready, then run migrations
cd peoplepay360/server
npx ts-node src/database/migrate.ts

# Step 4 — seed demo data
npx ts-node src/database/seed/index.ts
```

---

### 9. Backup & Restore

#### Backup database to SQL file
```bash
docker exec peoplepay360-db-1 mysqldump -uroot -proot peoplepay360 > backup.sql
```

#### Restore from SQL file
```bash
docker exec -i peoplepay360-db-1 mysql -uroot -proot peoplepay360 < backup.sql
```

---

### 10. Troubleshooting

| Problem | Fix |
|---|---|
| `ECONNREFUSED` on port 3306 | Container not running — `docker compose up -d db` |
| `EADDRINUSE` on port 3306 | Another MySQL running locally — stop it or change `DB_PORT` in `.env` |
| Migration skipped unexpectedly | Check `_migrations` table — row exists for that file |
| Seed fails with FK error | Migrations not fully applied — run migrate first |
| `Access denied for user root` | Wrong password — check `DB_PASSWORD` in `.env` matches `docker-compose.yml` |
| Container unhealthy | Run `docker logs peoplepay360-db-1` to see MySQL startup errors |

---

## Soft Delete / Immutability Rules

| Table | Strategy |
|-------|---------|
| `employees` | `status = 'archived'` — records never hard deleted |
| `users` | `is_active = false` — records never hard deleted |
| `contracts` | `status = 'Expired' / 'Cancelled'` — no delete endpoint |
| `working_schedules` | `is_active = false` — delete blocked if referenced |
| `salary_structures` | `is_active = false` — delete blocked if referenced |
| `salary_rules` | `is_active = false` — hard delete allowed only if no paid payslip references the code |
| `payruns` | Fields frozen after `status = 'Paid'` — no delete |
| `payslips` | Immutable after `status = 'Paid'` — no delete |
| `attendance_records` | Corrections tracked via `is_manual_entry` + audit fields — no delete |
| `time_off_requests` | Status set to `Cancelled` — no delete |
