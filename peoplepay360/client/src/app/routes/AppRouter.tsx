import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { UserRole } from '@/shared/types/api.types';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import AppShell from '@/layouts/AppShell';
import LoginPage from '@/features/auth/pages/LoginPage';
import UsersListPage from '@/features/users/pages/UsersListPage';
import UserFormPage from '@/features/users/pages/UserFormPage';
import ScheduleListPage from '@/features/working-schedules/pages/ScheduleListPage';
import ScheduleFormPage from '@/features/working-schedules/pages/ScheduleFormPage';
import ProtectedRoute from './ProtectedRoute';
import EmployeeKanbanPage from '@/features/employees/pages/EmployeeKanbanPage';
import EmployeeFormPage from '@/features/employees/pages/EmployeeFormPage';
import ContractListPage from '@/features/contracts/pages/ContractListPage';
import ContractFormPage from '@/features/contracts/pages/ContractFormPage';
import AttendanceListPage from '@/features/attendance/pages/AttendanceListPage';
import AttendanceFormPage from '@/features/attendance/pages/AttendanceFormPage';
import TypeConfigPage from '@/features/time-off/pages/TypeConfigPage';
import AllocationListPage from '@/features/time-off/pages/AllocationListPage';
import RequestListPage from '@/features/time-off/pages/RequestListPage';
import RequestFormPage from '@/features/time-off/pages/RequestFormPage';
import PayrunListPage from '@/features/payroll/pages/PayrunListPage';
import PayrunWizardPage from '@/features/payroll/pages/PayrunWizardPage';
import PayrunProcessingPage from '@/features/payroll/pages/PayrunProcessingPage';
import PayslipDetailPage from '@/features/payroll/pages/PayslipDetailPage';
import DashboardPage from '@/features/dashboard/pages/DashboardPage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />

            <Route path="/attendance" element={<AttendanceListPage />} />
            <Route path="/attendance/:id" element={<AttendanceFormPage />} />
            <Route path="/time-off/requests" element={<RequestListPage />} />
            <Route path="/time-off/requests/new" element={<RequestFormPage />} />
            <Route path="/employees/:id" element={<EmployeeFormPage />} />

            <Route element={<RoleGate roles={HR_ROLES} />}>
              <Route path="/employees" element={<EmployeeKanbanPage />} />
              <Route path="/working-schedules" element={<ScheduleListPage />} />
              <Route path="/working-schedules/:id" element={<ScheduleFormPage />} />
              <Route path="/contracts" element={<ContractListPage />} />
              <Route path="/contracts/new" element={<ContractFormPage />} />
              <Route path="/contracts/:id" element={<ContractFormPage />} />
              <Route path="/time-off/types" element={<TypeConfigPage />} />
              <Route path="/time-off/allocations" element={<AllocationListPage />} />
            </Route>

            <Route element={<RoleGate roles={PAYROLL_ROLES} />}>
              <Route path="/payroll" element={<PayrunListPage />} />
              <Route path="/payroll/new" element={<PayrunWizardPage />} />
              <Route path="/payroll/:id" element={<PayrunProcessingPage />} />
              <Route path="/payslips/:id" element={<PayslipDetailPage />} />
            </Route>

            <Route element={<RoleGate roles={['Admin']} />}>
              <Route path="/users" element={<UsersListPage />} />
              <Route path="/users/:id" element={<UserFormPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

const HR_ROLES: UserRole[] = ['HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'];
const PAYROLL_ROLES: UserRole[] = ['HR Payroll User', 'HR Payroll Manager', 'Admin'];

function RoleGate({ roles }: { roles: UserRole[] }) {
  const { role } = useCurrentUser();
  return role && roles.includes(role) ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
