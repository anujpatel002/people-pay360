import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '@/features/auth/pages/LoginPage';
import UsersListPage from '@/features/users/pages/UsersListPage';
import UserFormPage from '@/features/users/pages/UserFormPage';
import ProtectedRoute from './ProtectedRoute';
import EmployeeKanbanPage from '@/features/employees/pages/EmployeeKanbanPage';
import EmployeeFormPage from '@/features/employees/pages/EmployeeFormPage';
import ContractListPage from '@/features/contracts/pages/ContractListPage';
import ContractFormPage from '@/features/contracts/pages/ContractFormPage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<div>Dashboard (coming soon)</div>} />
          <Route path="/users" element={<UsersListPage />} />
          <Route path="/users/:id" element={<UserFormPage />} />
          <Route path="/employees" element={<EmployeeKanbanPage />} />
          <Route path="/employees/:id" element={<EmployeeFormPage />} />
          <Route path="/contracts" element={<ContractListPage />} />
          <Route path="/contracts/new" element={<ContractFormPage />} />
          <Route path="/contracts/:id" element={<ContractFormPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
