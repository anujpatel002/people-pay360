Module: attendance

References

FR-014 (Attendance List), FR-015 (Quick Check-In/Out Widget), FR-016
(Worked Hours + Overtime), FR-017 (Authorized Correction)

Hackathon Spec §B3 (Attendance List & Form)

Overview

The attendance module captures employee check-in/check-out activity,
computes worked hours and overtime using the employee's applicable
working schedule, detects attendance exceptions, and supports authorized
manual corrections with audit traceability.

Attendance is accessible globally from the main navigation and directly
from an Employee Form. Employees can perform their own quick
check-in/check-out actions. Authorized HR users can review attendance
records, identify exceptions, and correct records.

The module depends on:

auth

employees

working-schedules

The payroll module reads attendance through the attendance repository
when computing payslips. Attendance does not push payroll data directly.

Attendance data remains available for reporting and Payroll Dashboard
analytics.

Frontend --- client/src/features/attendance/

Components

File                                          Responsibility

components/AttendanceStatusBadge.tsx        Displays Present / Late / Absent / Overtime /
Missing Check-Out / Corrected status using text and
icon, not color alone

components/ExceptionFlag.tsx                Displays warning indicator and tooltip for missing
checkout, late arrival, early exit, overtime, or
other attendance exceptions

components/CheckInWidget.tsx                Quick employee widget --- Check In when no open
session exists; Check Out + elapsed time when
checked in

components/AttendanceFilters.tsx            Search, employee, date range, and status filters

components/AttendanceCorrectionDialog.tsx   Authorized correction UI requiring corrected
timestamps and a non-empty reason

Pages

File                                   Responsibility

pages/AttendanceListPage.tsx         Global attendance list --- Check In, Check Out,
Worked Hours, Overtime, Status; search and filters;
Today context

pages/AttendanceFormPage.tsx         Attendance detail page showing timestamps, schedule
context, calculated hours, status, and correction
information

Hooks

File                             Responsibility

hooks/useAttendance.ts         Fetches attendance records with employee,
date-range, status, and pagination filters

hooks/useAttendanceRecord.ts   Fetches a single attendance record including
schedule and correction information

Services

File                                          Responsibility

services/attendance.service.ts              getAttendance(filters), getRecord(id),
checkIn(), checkOut(),
correctRecord(id, correction)

Tests

File                                    Responsibility

tests/useAttendance.test.ts           Filter combinations, pagination, exception display,
missing checkout

tests/useCheckInOut.test.ts           No active session → Check In; active session →
Check Out + elapsed time; duplicate check-in
blocked; archived employee blocked

tests/attendance.service.test.ts      Mocked API calls

tests/attendance-correction.test.ts   Correction workflow and audit history

Backend --- server/src/modules/attendance/

Controllers

controllers/attendance.controller.ts

Handlers:

List attendance

Get attendance record

Check in

Check out

Correct attendance

Get correction history

Services

services/attendance.service.ts

Responsible for:

Record lifecycle

Employee validation

Active/archived employee validation

Single open-session enforcement

Schedule resolution

Worked-hours calculation

Exception detection

Correction workflow

Repository transactions

services/worked-hours.service.ts

Calculates:

grossMinutes = checkOut - checkIn

workedMinutes =
  grossMinutes - applicableBreakMinutes

The service must:

Handle normal shifts

Handle overnight shifts

Handle missing checkout

Prevent negative duration

Calculate overtime from expected schedule hours

Use the applicable working schedule for the attendance date

Example:

09:05 → 18:10
Gross = 545 minutes

If scheduled break = 60 minutes:
Worked = 485 minutes

services/exception-detector.service.ts

Determines attendance status using:

Scheduled start time

Scheduled end time

Scheduled break

Expected working minutes

Actual check-in

Actual check-out

Worked minutes

Overtime minutes

Supported statuses:

Present
Late
Absent
Overtime
Missing Check-Out
Corrected

Rules:

Late when check-in exceeds the configured schedule start/late
threshold

Overtime when worked time exceeds expected schedule hours according
to the configured overtime rule

Missing Check-Out when a check-in exists without checkout beyond the
applicable schedule end/exception threshold

Corrected when a record has been manually corrected

Absent is derived for scheduled workdays with no attendance record;
it must not require a fabricated check-in/check-out record

services/attendance-audit.service.ts

Records immutable correction history:

Attendance record ID

Original check-in

Original check-out

Original worked minutes

Original overtime minutes

Original status

Corrected check-in

Corrected check-out

Corrected worked minutes

Corrected overtime minutes

Correction reason

Corrected by

Corrected at

Repositories

repositories/attendance.repository.ts

Required methods:

findByEmployee(employeeId, filters)
findByDateRange(dateFrom, dateTo, filters)
findById(id)
findOpenSession(employeeId)
findExceptions(filters)
create(data)
update(id, data)

repositories/attendance-correction.repository.ts

Required methods:

create(data)
findByAttendanceId(attendanceId)

Correction history must never be overwritten when a later correction
occurs.

Routes

routes/attendance.routes.ts

/api/attendance

Permissions:

Operation         Employee   HR Manager   HR Payroll   HR Payroll        Admin
User      Manager

View own               Yes          Yes          Yes          Yes          Yes
attendance

View other              No          Yes          Yes          Yes          Yes
attendance

Check-in               Yes          Yes          Yes          Yes          Yes

Check-out              Yes          Yes          Yes          Yes          Yes

Correct                 No          Yes          Yes          Yes          Yes
attendance

Server-side authorization must always enforce employee ownership for
Employee-role users.

Validators

validators/attendance.validator.ts

Validation rules:

employeeId is resolved from JWT for employee self-service
check-in/out

checkIn is required for check-in

checkOut must be after checkIn

Check-out without an open session is rejected

Duplicate open sessions are rejected

Archived employees cannot check in or check out

Correction requires a non-empty correctionReason

Corrected timestamps must be valid

Corrected check-out must be after corrected check-in

Worked duration cannot be negative

Overtime cannot be negative

Correction cannot be performed by unauthorized users

Employee users cannot correct their own attendance

Attendance date must correspond to the intended check-in/session
date

Models

models/attendance.model.ts

Attendance record contains:

id
employeeId
date
scheduleId
checkIn
checkOut
workedMinutes
overtimeMinutes
status
isManualEntry
correctionReason
correctedBy
correctedAt
createdAt
updatedAt

Recommended status enum:

type AttendanceStatus =
  | 'Present'
  | 'Late'
  | 'Absent'
  | 'Overtime'
  | 'Missing Check-Out'
  | 'Corrected';

scheduleId stores the schedule used to calculate the attendance
record, protecting historical calculations if the employee's schedule
changes later.

Correction Audit Model

models/attendance-correction.model.ts

id
attendanceId

originalCheckIn
originalCheckOut
originalWorkedMinutes
originalOvertimeMinutes
originalStatus

correctedCheckIn
correctedCheckOut
correctedWorkedMinutes
correctedOvertimeMinutes
correctedStatus

correctionReason
correctedBy
correctedAt

Correction records are immutable.

If an attendance record is corrected multiple times, each correction
creates a new audit record.

API Endpoints

GET /api/attendance

Auth

Employee → own attendance only

HR Manager+ → permitted employee attendance

Query Params

?employeeId=emp_01
&dateFrom=2026-09-01
&dateTo=2026-09-30
&status=Late
&page=1
&limit=20
&sortBy=date
&sortOrder=desc

Supported filters:

employeeId

dateFrom

dateTo

status

search

page

limit

sortBy

sortOrder

Response 200

{
  "data": [
    {
      "id": "att_01",
      "employeeId": "emp_01",
      "employeeName": "John Smith",
      "date": "2026-09-05",
      "scheduleId": "sch_01",
      "scheduleName": "Standard 40h",
      "checkIn": "2026-09-05T09:15:00Z",
      "checkOut": "2026-09-05T18:05:00Z",
      "workedMinutes": 485,
      "overtimeMinutes": 0,
      "status": "Late",
      "isManualEntry": false,
      "correctionReason": null,
      "correctedBy": null,
      "correctedAt": null
    }
  ],
  "total": 22,
  "page": 1,
  "limit": 20
}

Missing check-out records must remain visible in the list.

GET /api/attendance/:id

Auth

Employee → own record only

HR Manager+ → permitted records

Response 200

{
  "id": "att_01",
  "employeeId": "emp_01",
  "employeeName": "John Smith",
  "date": "2026-09-05",
  "scheduleId": "sch_01",
  "scheduleName": "Standard 40h",
  "checkIn": "2026-09-05T09:15:00Z",
  "checkOut": "2026-09-05T18:05:00Z",
  "workedMinutes": 485,
  "overtimeMinutes": 0,
  "status": "Late",
  "isManualEntry": false,
  "correctionReason": null,
  "correctedBy": null,
  "correctedAt": null,
  "createdAt": "2026-09-05T09:15:00Z",
  "updatedAt": "2026-09-05T18:05:00Z"
}

Response 404

{
  "error": "Attendance record not found"
}

POST /api/attendance/check-in

Auth

Employee+

Employee is resolved from JWT.

Request Body

None.

Server validation

Employee exists

Employee is active

Employee has an assigned working schedule

Employee has no existing open session

Response 201

{
  "id": "att_02",
  "employeeId": "emp_01",
  "date": "2026-09-06",
  "scheduleId": "sch_01",
  "checkIn": "2026-09-06T08:58:00Z",
  "checkOut": null,
  "workedMinutes": null,
  "overtimeMinutes": 0,
  "status": "Present",
  "isManualEntry": false
}

Response 409

{
  "error": "Employee already has an open check-in session"
}

Response 422

{
  "error": "Archived employees cannot check in"
}

POST /api/attendance/check-out

Auth

Employee+

Employee is resolved from JWT.

Request Body

None.

Processing

Find employee's open session

Set check-out

Resolve applicable schedule

Calculate worked minutes

Calculate overtime

Detect exceptions

Store calculated values

Response 200

{
  "id": "att_02",
  "employeeId": "emp_01",
  "date": "2026-09-06",
  "scheduleId": "sch_01",
  "checkIn": "2026-09-06T08:58:00Z",
  "checkOut": "2026-09-06T18:02:00Z",
  "workedMinutes": 544,
  "overtimeMinutes": 64,
  "status": "Overtime"
}

Response 404

{
  "error": "No open check-in session found for this employee"
}

PUT /api/attendance/:id/correct

Auth

HR Manager+

Request Body

{
  "checkIn": "2026-09-05T09:00:00Z",
  "checkOut": "2026-09-05T18:00:00Z",
  "correctionReason": "System clock error on terminal"
}

Processing

Load existing record

Store original values in correction audit record

Apply corrected timestamps

Recalculate worked minutes

Recalculate overtime

Re-run exception detection

Set isManualEntry = true

Set correctedBy

Set correctedAt

Preserve previous correction history

Response 200

{
  "id": "att_01",
  "employeeId": "emp_01",
  "date": "2026-09-05",
  "scheduleId": "sch_01",
  "checkIn": "2026-09-05T09:00:00Z",
  "checkOut": "2026-09-05T18:00:00Z",
  "workedMinutes": 480,
  "overtimeMinutes": 0,
  "status": "Corrected",
  "isManualEntry": true,
  "correctionReason": "System clock error on terminal",
  "correctedBy": "u_05",
  "correctedAt": "2026-09-06T10:00:00Z"
}

Response 403

{
  "error": "Insufficient permissions to correct attendance"
}

Response 422

{
  "error": "correctionReason is required"
}

GET /api/attendance/:id/corrections

Returns immutable correction history.

Response 200

{
  "attendanceId": "att_01",
  "data": [
    {
      "id": "corr_01",
      "originalCheckIn": "2026-09-05T09:15:00Z",
      "originalCheckOut": "2026-09-05T18:05:00Z",
      "originalWorkedMinutes": 485,
      "originalOvertimeMinutes": 0,
      "originalStatus": "Late",
      "correctedCheckIn": "2026-09-05T09:00:00Z",
      "correctedCheckOut": "2026-09-05T18:00:00Z",
      "correctedWorkedMinutes": 480,
      "correctedOvertimeMinutes": 0,
      "correctedStatus": "Corrected",
      "correctionReason": "System clock error on terminal",
      "correctedBy": "u_05",
      "correctedAt": "2026-09-06T10:00:00Z"
    }
  ]
}

Attendance Calculation Rules

Standard day

Given:

Schedule:
09:00 → 18:00
Break: 60 minutes

Expected working time:

9 hours - 1 hour break
= 8 hours
= 480 minutes

If:

Check-in  = 09:05
Check-out = 18:10

Then:

Gross duration = 545 minutes
Break          = 60 minutes
Worked         = 485 minutes

Overnight Shift

The worked-hours service must support:

22:00 → 06:00

where check-out occurs on the following calendar day.

The service must not treat the next-day checkout as an invalid negative
duration.

Missing Check-Out

When:

checkIn != null
checkOut == null

and the applicable schedule has passed its configured end/exception
threshold:

status = Missing Check-Out

The record remains visible and is not silently converted into zero
worked hours.

Payroll must be able to identify such records during validation.

Absent

Absent represents a scheduled workday where the employee has no
attendance record.

It should be calculated from:

Employee
+
Working Schedule
+
Date
+
Approved Time Off

An absent day does not require creating a fake attendance record with
null timestamps.

Late

Late detection compares:

actual check-in
vs
scheduled start time

The configured late threshold must be applied consistently.

Example:

Schedule start = 09:00
Check-in       = 09:15
Late threshold = 0 minutes

→ Late

Overtime

Overtime is calculated against the applicable schedule's expected
working minutes.

Example:

Expected = 480 minutes
Worked   = 544 minutes

Overtime = 64 minutes

Overtime rules must not be hardcoded in the frontend.

Schedule Resolution

Attendance should resolve the schedule applicable to the attendance
date.

Priority:

Attendance schedule snapshot
        ↓
Contract schedule for applicable period
        ↓
Employee assigned schedule

The final implementation must use the schedule applicable to the date
and preserve the schedule reference used for historical calculations.

If no valid schedule can be resolved, the attendance record should be
flagged for HR review rather than silently using a default schedule.

Employee Lifecycle Rules

Active Employee

Can:

Check in

Check out

View own attendance

Archived Employee

Cannot:

Check in

Check out

Create new attendance

Historical attendance remains accessible to authorized users.

Payroll Integration

Payroll reads attendance through:

attendance.repository.ts

Payroll may consume:

workedMinutes
overtimeMinutes
status
date
employeeId

Attendance does not directly create or modify payslips.

Important:

Correcting attendance after a Payrun has been marked Paid does not
automatically recompute the Payrun.

The payroll system must retain the historical paid result.

Key Rules

Attendance is accessible globally and from the Employee Form.

Employees can view their own attendance records.

Employees cannot view other employees' attendance.

HR Manager+ can access broader attendance records according to RBAC.

Employees can check in/out only for themselves.

Archived employees cannot create new attendance.

An employee can have only one open check-in session.

workedMinutes and overtimeMinutes are stored after check-out.

Worked time accounts for the applicable schedule break.

Overnight shifts are supported.

Missing check-outs remain visible and are flagged.

Absent is derived for scheduled days with no attendance record.

Exception detection runs after check-out and correction.

Manual corrections require authorization and a non-empty reason.

Every correction preserves the original values in an immutable audit
record.

Multiple corrections create multiple audit-history records.

Historical attendance remains available after employee archival.

Payroll reads attendance through the repository.

Correcting attendance after a paid payrun does not automatically
recompute payroll.

Attendance calculations must use the applicable working schedule
rather than hardcoded working hours.