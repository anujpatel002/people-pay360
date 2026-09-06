import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { getEmployee } from '@/features/employees/services/employees.service';
import { getAttendance } from '@/features/attendance/services/attendance.service';
import { Attendance } from '@/features/attendance/types/attendance.types';
import { getBalance, getRequests } from '@/features/time-off/services/time-off.service';
import { Balance, TimeOffRequest } from '@/features/time-off/types';
import { Employee } from '@/features/employees/types/employee.types';
import { useDashboardData } from '../hooks/useDashboardData';
import { useDashboardSavedViews } from '../hooks/useDashboardSavedViews';
import { DashboardFilters as FiltersType, DashboardSavedView } from '../types/dashboard.types';
import KpiCard from '../components/KpiCard';
import DashboardFilters from '../components/DashboardFilters';
import SalaryByDeptChart from '../components/SalaryByDeptChart';
import TrendChart from '../components/TrendChart';
import AlertList from '../components/AlertList';
import AttendanceOverview from '../components/AttendanceOverview';
import TimeOffOverview from '../components/TimeOffOverview';
import DepartmentOverview from '../components/DepartmentOverview';
import AttendanceClockWidget from '@/features/attendance/components/AttendanceClockWidget';
import '../dashboard.css';

export const DashboardPage: React.FC = () => {
  const { role } = useCurrentUser();
  return role === 'Employee' ? <EmployeeDashboard /> : <HrDashboard />;
};

/* ==========================================================================
   Employee Self-Service Dashboard View
   ========================================================================== */
const EmployeeDashboard: React.FC = () => {
  const { user } = useCurrentUser();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user?.employeeId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      getEmployee(user.employeeId),
      getAttendance({ employeeId: user.employeeId, limit: 5, sortBy: 'date', sortOrder: 'desc' }),
      getBalance(user.employeeId),
      getRequests({ employeeId: user.employeeId, limit: 5 }),
    ])
      .then(([profile, attendanceResult, balanceResult, requestResult]) => {
        setEmployee(profile);
        setAttendance(attendanceResult.data);
        setBalances(balanceResult.balances);
        setRequests(requestResult.data);
      })
      .catch((err: any) => setError(err.response?.data?.error || 'Unable to load your dashboard'))
      .finally(() => setLoading(false));
  }, [user?.employeeId]);

  if (!user?.employeeId) {
    return (
      <div className="dash-root">
        <div className="dash-container" style={{ maxWidth: '900px' }}>
          <div className="dash-card" style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>👤</div>
            <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
              Profile Unlinked
            </h2>
            <p style={{ color: 'var(--dash-text-muted)', fontSize: '14px', margin: 0 }}>
              Your user account is not currently linked to an active employee record. Please contact your HR administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-root">
        <div className="dash-container" style={{ maxWidth: '900px' }}>
          <div
            style={{
              padding: '20px',
              borderRadius: '16px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: '14px',
            }}
          >
            <strong>Failed to load profile:</strong> {error}
          </div>
        </div>
      </div>
    );
  }

  const initials = employee
    ? `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`.toUpperCase()
    : 'EM';

  return (
    <div className="dash-root">
      <div className="dash-container" style={{ maxWidth: '1240px' }}>
        {/* Employee Hero Profile Card */}
        <div
          className="dash-card"
          style={{
            padding: '28px 32px',
            background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px',
            boxShadow: '0 12px 30px -6px rgba(15, 23, 42, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: 800,
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)',
              }}
            >
              {initials}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, letterSpacing: '-0.03em' }}>
                  {employee ? `${employee.firstName} ${employee.lastName}` : 'Welcome back'}
                </h1>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.15)',
                    color: '#e0e7ff',
                    textTransform: 'uppercase',
                  }}
                >
                  Employee
                </span>
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '13.5px', color: '#94a3b8' }}>
                {employee?.jobTitle || 'Employee'}
                {employee?.departmentName ? ` · ${employee.departmentName}` : ''}
                {employee?.employeeNumber ? ` · #${employee.employeeNumber}` : ''}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link
              to="/time-off/requests/new"
              className="dash-btn dash-btn-primary"
              style={{ padding: '10px 18px', textDecoration: 'none' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Request Time Off
            </Link>
            <Link
              to={`/employees/${user.employeeId}`}
              className="dash-btn"
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                textDecoration: 'none',
              }}
            >
              My Profile
            </Link>
          </div>
        </div>

        {/* Clock In / Out Widget */}
        <div style={{ marginBottom: '0' }}>
          <AttendanceClockWidget />
        </div>

        {/* Bento Grid for Employee Modules */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {/* Leave Balances Card */}
          <div className="dash-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                My Leave Balances
              </h3>
              <Link to="/time-off/requests" style={{ fontSize: '12.5px', fontWeight: 700, color: '#4f46e5', textDecoration: 'none' }}>
                View All →
              </Link>
            </div>

            {loading ? (
              <div className="dash-skeleton" style={{ height: '120px' }} />
            ) : balances.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {balances.map((b) => (
                  <div
                    key={b.typeId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <span style={{ fontWeight: 650, fontSize: '13.5px', color: '#1e293b' }}>
                      {b.typeName}
                    </span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                        {b.remaining ?? 0}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '4px' }}>
                        / {b.allocated ?? 0} days
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--dash-text-subtle)', fontSize: '13.5px', padding: '20px 0', textAlign: 'center' }}>
                No active leave allocations found.
              </div>
            )}
          </div>

          {/* Recent Attendance Card */}
          <div className="dash-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                Recent Attendance
              </h3>
              <Link to={`/attendance?employeeId=${user.employeeId}`} style={{ fontSize: '12.5px', fontWeight: 700, color: '#4f46e5', textDecoration: 'none' }}>
                Full Log →
              </Link>
            </div>

            {loading ? (
              <div className="dash-skeleton" style={{ height: '120px' }} />
            ) : attendance.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {attendance.map((rec) => {
                  const isPresent = rec.status === 'Present';
                  const isLate = rec.status === 'Late';
                  return (
                    <div
                      key={rec.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b' }}>
                        {rec.date}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 750,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: isPresent ? '#ecfdf5' : isLate ? '#fffbeb' : '#fef2f2',
                          color: isPresent ? '#047857' : isLate ? '#92400e' : '#b91c1c',
                          textTransform: 'uppercase',
                        }}
                      >
                        {rec.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ color: 'var(--dash-text-subtle)', fontSize: '13.5px', padding: '20px 0', textAlign: 'center' }}>
                No attendance logs recorded this period.
              </div>
            )}
          </div>

          {/* Time Off Requests Card */}
          <div className="dash-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                Recent Time Off Requests
              </h3>
              <Link to="/time-off/requests" style={{ fontSize: '12.5px', fontWeight: 700, color: '#4f46e5', textDecoration: 'none' }}>
                All Requests →
              </Link>
            </div>

            {loading ? (
              <div className="dash-skeleton" style={{ height: '120px' }} />
            ) : requests.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {requests.map((req) => {
                  const isApproved = req.status.toLowerCase() === 'approved';
                  const isPending = req.status.toLowerCase() === 'pending';
                  return (
                    <div
                      key={req.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 650, fontSize: '13px', color: '#1e293b' }}>
                          {req.startDate} {req.endDate && req.endDate !== req.startDate ? `→ ${req.endDate}` : ''}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                          {req.days} {req.days === 1 ? 'day' : 'days'}
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 750,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: isApproved ? '#ecfdf5' : isPending ? '#fffbeb' : '#fef2f2',
                          color: isApproved ? '#047857' : isPending ? '#92400e' : '#b91c1c',
                          textTransform: 'uppercase',
                        }}
                      >
                        {req.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ color: 'var(--dash-text-subtle)', fontSize: '13.5px', padding: '20px 0', textAlign: 'center' }}>
                No time off requests filed yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
   HR Operational & Analytics Dashboard View
   ========================================================================== */
const HrDashboard: React.FC = () => {
  const { role } = useCurrentUser();
  const canViewPayroll = role !== 'HR Manager';
  const [filters, setFilters] = useState<FiltersType>({
    period: new Date().toISOString().slice(0, 7),
  });

  const { data, dimensions, loading, error, refetch } = useDashboardData(filters);
  const { savedViews, saveView, removeView } = useDashboardSavedViews();

  // People Events (work anniversaries)
  const [peopleEvents, setPeopleEvents] = useState<{ id: string; name: string; jobTitle: string; yearsOfService: number; anniversaryDate: string }[]>([]);
  useEffect(() => {
    import('@/shared/services/httpClient').then(({ default: http }) => {
      http.get<{ anniversaries: any[] }>('/dashboard/people-events')
        .then(r => setPeopleEvents(r.data.anniversaries || []))
        .catch(() => {});
    });
  }, []);

  const handleApplySavedView = (view: DashboardSavedView) => {
    setFilters({
      period: view.period || new Date().toISOString().slice(0, 7),
      companyId: view.companyId || undefined,
      departmentId: view.departmentId || undefined,
      employmentType: view.employmentType || undefined,
    });
  };

  const handleSaveCurrentView = async (name: string, isDefault: boolean) => {
    await saveView({
      name,
      period: filters.period,
      companyId: filters.companyId,
      departmentId: filters.departmentId,
      employmentType: filters.employmentType,
      isDefault,
    });
  };

  const handleResetFilters = () => {
    setFilters({
      period: new Date().toISOString().slice(0, 7),
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="dash-root">
      <div className="dash-container">
        {/* Header Command Area */}
        <div className="dash-header">
          <div className="dash-title-group">
            <div className="dash-title-row">
              <h1 className="dash-main-title">
                Operational HR & Payroll Dashboard
              </h1>
              <span className="dash-badge dash-badge-live">
                Live Metrics
              </span>
            </div>
            <p className="dash-subtitle">
              {canViewPayroll
                ? 'Real-time cross-module visibility across Payroll, Attendance, Contracts, and Time Off'
                : 'Real-time operational visibility across Employees, Attendance, Contracts, and Time Off'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={refetch}
              disabled={loading}
              className="dash-btn dash-btn-secondary"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className={loading ? 'dash-btn-icon-spin' : ''}
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              <span>{loading ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>
          </div>
        </div>

        {/* Glassmorphic Filter Command Bar */}
        <DashboardFilters
          filters={filters}
          dimensions={dimensions}
          savedViews={savedViews}
          onChange={setFilters}
          onSaveCurrentView={handleSaveCurrentView}
          onDeleteSavedView={removeView}
          onApplySavedView={handleApplySavedView}
          onReset={handleResetFilters}
        />

        {/* Quick Operations Launchpad */}
        <div
          className="dash-card"
          style={{
            padding: '12px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>⚡</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Quick Operations:</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Link to="/employees/new" className="app-btn app-btn-secondary" style={{ padding: '5px 11px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span>+</span>
              <span>New Employee</span>
            </Link>
            {canViewPayroll && (
              <Link to="/payroll" className="app-btn app-btn-secondary" style={{ padding: '5px 11px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span>💰</span>
                <span>Run Payroll</span>
              </Link>
            )}
            <Link to="/contracts/new" className="app-btn app-btn-secondary" style={{ padding: '5px 11px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span>📑</span>
              <span>New Contract</span>
            </Link>
            <Link to="/time-off/requests/new" className="app-btn app-btn-secondary" style={{ padding: '5px 11px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span>🏖️</span>
              <span>Request Leave</span>
            </Link>
            <Link to="/attendance" className="app-btn app-btn-secondary" style={{ padding: '5px 11px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span>⏱️</span>
              <span>Attendance Oversight</span>
            </Link>
          </div>
        </div>

        {/* Live Aggregation Error Warning */}
        {error && (
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '14px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: '13.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: 'var(--dash-shadow-sm)',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: '#dc2626',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <strong>Live Aggregation Error:</strong> {error}
              <div style={{ fontSize: '12px', color: '#b91c1c', marginTop: '2px' }}>
                In accordance with system policy, demo or hardcoded mock data is never returned. Please check backend operational services.
              </div>
            </div>
          </div>
        )}

        {/* Bento KPI Stat Cards */}
        {data ? (
          <div className="dash-kpi-grid">
            {canViewPayroll && (
              <>
                <KpiCard
                  title="Total Net Salary Paid"
                  value={formatCurrency(data.kpis.totalNetSalaryPaid)}
                  subtitle={`Period: ${data.filters.period || 'All'}`}
                  icon="💰"
                  variant="primary"
                />
                <KpiCard
                  title="Payslips Generated"
                  value={data.kpis.payslipsGenerated}
                  subtitle="Validated & Paid payruns"
                  icon="📄"
                  variant="success"
                />
                <KpiCard
                  title="Average Net Salary"
                  value={formatCurrency(data.kpis.averageSalary)}
                  subtitle="Per eligible employee"
                  icon="⚖️"
                  variant="purple"
                />
              </>
            )}
            <KpiCard
              title="Approved Time Off"
              value={`${data.kpis.approvedTimeOffDays} Days`}
              subtitle="Current selected scope"
              icon="🌴"
              variant="warning"
            />
            <KpiCard
              title="Attendance Health"
              value={`${data.kpis.attendanceHealthPercent}%`}
              subtitle="Scheduled compliance"
              icon="⏱️"
              variant="info"
              badge={data.kpis.attendanceHealthPercent >= 90 ? 'Healthy' : 'Needs Review'}
              badgeType={data.kpis.attendanceHealthPercent >= 90 ? 'positive' : 'warning'}
            />
          </div>
        ) : loading ? (
          <div className="dash-kpi-grid">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="dash-skeleton" style={{ height: '148px', borderRadius: '18px' }} />
            ))}
          </div>
        ) : null}

        {/* Charts Row */}
        {data && canViewPayroll && (
          <div className="dash-2col-grid">
            <SalaryByDeptChart data={data.salaryByDepartment} />
            <TrendChart data={data.monthlySalaryTrend} />
          </div>
        )}

        {/* Alerts & Attendance Row */}
        {data && (
          <div className="dash-2col-grid">
            <AlertList
              alerts={data.alerts}
              companyId={filters.companyId}
              onRefreshNeeded={refetch}
            />
            <AttendanceOverview data={data.attendanceOverview} />
          </div>
        )}

        {/* Time-Off & Department Breakdown Row */}
        {data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <TimeOffOverview data={data.timeOffOverview} />
            <DepartmentOverview data={data.departmentOverview} />
          </div>
        )}

        {/* People Events: Work Anniversaries */}
        {peopleEvents.length > 0 && (
          <div className="dash-card" style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>🎂 Work Anniversaries — Next 30 Days</h3>
                <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: '#64748b' }}>{peopleEvents.length} employee{peopleEvents.length !== 1 ? 's' : ''} celebrating a milestone soon</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
              {peopleEvents.map((e) => {
                const daysAway = Math.round((new Date(e.anniversaryDate).getTime() - Date.now()) / 86400000);
                const isToday = daysAway <= 0;
                return (
                  <div
                    key={e.id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      background: isToday ? 'linear-gradient(135deg, #fef3c7, #fde68a)' : '#f8fafc',
                      border: `1px solid ${isToday ? '#f59e0b' : '#e2e8f0'}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div style={{ fontSize: '24px', flexShrink: 0 }}>{isToday ? '🎉' : '🗓️'}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '1px' }}>{e.jobTitle || 'Employee'}</div>
                      <div style={{ fontSize: '11.5px', fontWeight: 700, marginTop: '4px', color: isToday ? '#92400e' : '#4f46e5' }}>
                        {e.yearsOfService} year{e.yearsOfService !== 1 ? 's' : ''} · {isToday ? 'Today! 🎊' : `In ${daysAway} day${daysAway !== 1 ? 's' : ''}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Initial Loading State */}
        {loading && !data && (
          <div
            style={{
              padding: '80px 20px',
              textAlign: 'center',
              color: 'var(--dash-text-muted)',
              fontSize: '15px',
            }}
          >
            <div
              className="dash-btn-icon-spin"
              style={{
                width: '36px',
                height: '36px',
                border: '3px solid #e2e8f0',
                borderTopColor: '#4f46e5',
                borderRadius: '50%',
                margin: '0 auto 16px',
              }}
            />
            Aggregating real-time HR & Payroll metrics...
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
