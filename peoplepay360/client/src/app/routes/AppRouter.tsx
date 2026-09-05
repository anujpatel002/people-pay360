import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<div>Dashboard (coming soon)</div>} />
          <Route path="/users" element={<UsersListPage />} />
          <Route path="/users/:id" element={<UserFormPage />} />
          <Route path="/working-schedules" element={<ScheduleListPage />} />
          <Route path="/working-schedules/:id" element={<ScheduleFormPage />} />
          <Route path="/employees" element={<EmployeeKanbanPage />} />
          <Route path="/employees/:id" element={<EmployeeFormPage />} />
          <Route path="/contracts" element={<ContractListPage />} />
          <Route path="/contracts/new" element={<ContractFormPage />} />
          <Route path="/contracts/:id" element={<ContractFormPage />} />
          <Route path="/attendance" element={<AttendanceListPage />} />
          <Route path="/attendance/:id" element={<AttendanceFormPage />} />
          <Route path="/time-off/types" element={<TypeConfigPage />} />
          <Route path="/time-off/allocations" element={<AllocationListPage />} />
          <Route path="/time-off/requests" element={<RequestListPage />} />
          <Route path="/time-off/requests/new" element={<RequestFormPage />} />
          <Route path="/payroll" element={<PayrunListPage />} />
          <Route path="/payroll/new" element={<PayrunWizardPage />} />
          <Route path="/payroll/:id" element={<PayrunProcessingPage />} />
          <Route path="/payslips/:id" element={<PayslipDetailPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
