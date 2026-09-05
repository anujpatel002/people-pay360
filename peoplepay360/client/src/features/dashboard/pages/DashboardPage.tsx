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

export const DashboardPage: React.FC = () => {
  const { role } = useCurrentUser();
  return role === 'Employee' ? <EmployeeDashboard /> : <HrDashboard />;
};

const EmployeeDashboard: React.FC = () => {
  const { user } = useCurrentUser();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.employeeId) return;
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
      .catch((err: any) => setError(err.response?.data?.error || 'Unable to load your dashboard'));
  }, [user?.employeeId]);

  if (!user?.employeeId) return <DashboardMessage message="Your employee profile is not linked to this account." />;
  if (error) return <DashboardMessage message={error} />;

  return (
    <DashboardShell title={`Welcome, ${user.name}`} subtitle="Your personal HR workspace">
      <div style={employeeGrid}>
        <DashboardCard title="My Profile">
          <p style={cardValue}>{employee ? `${employee.firstName} ${employee.lastName}` : 'Loading...'}</p>
          <p>{employee?.jobTitle || 'Employee'}{employee?.departmentName ? ` · ${employee.departmentName}` : ''}</p>
          <Link to={`/employees/${user.employeeId}`} style={linkStyle}>View employee details</Link>
        </DashboardCard>
        <DashboardCard title="Leave Balances">
          {balances.length ? balances.map((balance) => (
            <p key={balance.typeId} style={rowStyle}><span>{balance.typeName}</span><strong>{balance.remaining ?? 0}</strong></p>
          )) : <p>No leave balances available.</p>}
          <Link to="/time-off/requests/new" style={linkStyle}>Create time off request</Link>
        </DashboardCard>
        <DashboardCard title="Recent Attendance">
          {attendance.length ? attendance.map((record) => (
            <p key={record.id} style={rowStyle}><span>{record.date}</span><strong>{record.status}</strong></p>
          )) : <p>No attendance records available.</p>}
          <Link to={`/attendance?employeeId=${user.employeeId}`} style={linkStyle}>View attendance</Link>
        </DashboardCard>
        <DashboardCard title="My Time Off Requests">
          {requests.length ? requests.map((request) => (
            <p key={request.id} style={rowStyle}><span>{request.startDate}</span><strong>{request.status}</strong></p>
          )) : <p>No time off requests yet.</p>}
          <Link to="/time-off/requests" style={linkStyle}>View requests</Link>
        </DashboardCard>
      </div>
    </DashboardShell>
  );
};

const HrDashboard: React.FC = () => {
  const { role } = useCurrentUser();
  const canViewPayroll = role !== 'HR Manager';
  const [filters, setFilters] = useState<FiltersType>({
    period: new Date().toISOString().slice(0, 7),
  });

  const { data, dimensions, loading, error, refetch } = useDashboardData(filters);
  const { savedViews, saveView, removeView } = useDashboardSavedViews();

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
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        padding: '32px',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        color: '#0f172a',
      }}
    >
      <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a' }}>
                Operational HR & Payroll Dashboard
              </h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 8px',
                  borderRadius: '20px',
                  background: '#dbeafe',
                  color: '#1e40af',
                  textTransform: 'uppercase',
                }}
              >
                Live Metrics
              </span>
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#64748b' }}>
              {canViewPayroll
                ? 'Real-time cross-module visibility across Payroll, Attendance, Contracts, and Time Off'
                : 'Real-time visibility across Employees, Attendance, Contracts, and Time Off'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={refetch}
              disabled={loading}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              }}
            >
              <span>🔄</span> {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>

        {/* Filter Controls & Saved Views */}
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

        {/* Error Notification (Live Data Rule Enforcement) */}
        {error && (
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div>
              <strong>Live Aggregation Error:</strong> {error}
              <div style={{ fontSize: '12px', color: '#b91c1c', marginTop: '2px' }}>
                In accordance with system policy, demo or hardcoded mock data is never returned. Please check backend operational services.
              </div>
            </div>
          </div>
        )}

        {/* KPI Cards Row */}
        {data && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
              gap: '16px',
            }}
          >
            {canViewPayroll && <>
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
                title="Average Salary"
                value={formatCurrency(data.kpis.averageSalary)}
                subtitle="Per eligible employee"
                icon="⚖️"
                variant="purple"
              />
            </>}
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
        )}

        {/* Charts Row */}
        {data && canViewPayroll && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
              gap: '20px',
            }}
          >
            <SalaryByDeptChart data={data.salaryByDepartment} />
            <TrendChart data={data.monthlySalaryTrend} />
          </div>
        )}

        {/* Alerts & Attendance Row */}
        {data && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
              gap: '20px',
            }}
          >
            <AlertList
              alerts={data.alerts}
              companyId={filters.companyId}
              onRefreshNeeded={refetch}
            />
            <AttendanceOverview data={data.attendanceOverview} />
          </div>
        )}

        {/* Time-Off & Department Overview Row */}
        {data && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '20px',
            }}
          >
            <TimeOffOverview data={data.timeOffOverview} />
            <DepartmentOverview data={data.departmentOverview} />
          </div>
        )}

        {loading && !data && (
          <div
            style={{
              padding: '80px 20px',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '16px',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⌛</div>
            Loading live operational metrics...
          </div>
        )}
      </div>
    </div>
  );
};
export default DashboardPage;

const DashboardShell: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <div style={shellStyle}>
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ margin: 0, color: '#0f172a' }}>{title}</h1>
      <p style={{ color: '#64748b', margin: '8px 0 24px' }}>{subtitle}</p>
      {children}
    </div>
  </div>
);

const DashboardCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section style={cardStyle}>
    <h2 style={{ margin: '0 0 16px', fontSize: '18px' }}>{title}</h2>
    {children}
  </section>
);

const DashboardMessage: React.FC<{ message: string }> = ({ message }) => (
  <DashboardShell title="Employee Dashboard" subtitle={message}>
    <p style={cardStyle}>No self-service data is available.</p>
  </DashboardShell>
);

const shellStyle: React.CSSProperties = { minHeight: '100vh', background: '#f8fafc', padding: '32px', fontFamily: 'Inter, system-ui, sans-serif' };
const employeeGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' };
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px', color: '#475569' };
const cardValue: React.CSSProperties = { fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' };
const rowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', padding: '8px 0', margin: 0 };
const linkStyle: React.CSSProperties = { display: 'inline-block', marginTop: '14px', color: '#2563eb', fontWeight: 600, textDecoration: 'none' };
