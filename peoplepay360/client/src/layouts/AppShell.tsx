import { NavLink, Outlet } from 'react-router-dom';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { UserRole } from '@/shared/types/api.types';

interface NavigationItem {
  label: string;
  path: string;
  roles: UserRole[];
}

const ALL_HR: UserRole[] = ['HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'];
const PAYROLL: UserRole[] = ['HR Payroll User', 'HR Payroll Manager', 'Admin'];
const ADMIN: UserRole[] = ['Admin'];
const ALL: UserRole[] = ['Employee', ...ALL_HR];

const navigation: NavigationItem[] = [
  { label: 'Dashboard', path: '/dashboard', roles: ALL },
  { label: 'Employees', path: '/employees', roles: ALL_HR },
  { label: 'Attendance', path: '/attendance', roles: ALL },
  { label: 'Contracts', path: '/contracts', roles: ALL_HR },
  { label: 'Working Schedules', path: '/working-schedules', roles: ALL_HR },
  { label: 'Time Off Requests', path: '/time-off/requests', roles: ALL },
  { label: 'Time Off Types', path: '/time-off/types', roles: ALL_HR },
  { label: 'Time Off Allocations', path: '/time-off/allocations', roles: ALL_HR },
  { label: 'Payroll / Payruns', path: '/payroll', roles: PAYROLL },
  { label: 'Users & Roles', path: '/users', roles: ADMIN },
];

export default function AppShell() {
  const { user } = useCurrentUser();
  const { handleLogout } = useLogout();
  const role = user?.role;
  const visibleNavigation = navigation.filter((item) => role && item.roles.includes(role));

  return (
    <div style={styles.app}>
      <aside style={styles.sidebar}>
        <div style={styles.brandBlock}>
          <div style={styles.brand}>PeoplePay360</div>
          <div style={styles.brandCaption}>HR operations platform</div>
        </div>

        <nav aria-label="Primary navigation" style={styles.navigation}>
          {visibleNavigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                ...styles.navLink,
                ...(isActive ? styles.activeNavLink : {}),
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={styles.userBlock}>
          <div style={styles.userName}>{user?.name}</div>
          <div style={styles.userRole}>{user?.role}</div>
          <button type="button" onClick={handleLogout} style={styles.logoutButton}>
            Sign out
          </button>
        </div>
      </aside>
      <main style={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    display: 'flex',
    background: '#f8fafc',
    color: '#0f172a',
  },
  sidebar: {
    width: 248,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#0f172a',
    color: '#e2e8f0',
    position: 'fixed',
    inset: '0 auto 0 0',
    zIndex: 10,
  },
  brandBlock: { padding: '24px 20px 20px', borderBottom: '1px solid #1e293b' },
  brand: { fontSize: 20, fontWeight: 800, color: '#fff' },
  brandCaption: { marginTop: 5, fontSize: 11, color: '#94a3b8' },
  navigation: { display: 'flex', flexDirection: 'column', gap: 4, padding: '18px 12px', overflowY: 'auto' },
  navLink: { padding: '10px 12px', borderRadius: 6, color: '#cbd5e1', textDecoration: 'none', fontSize: 14, fontWeight: 600 },
  activeNavLink: { background: '#2563eb', color: '#fff' },
  userBlock: { marginTop: 'auto', padding: 16, borderTop: '1px solid #1e293b' },
  userName: { color: '#fff', fontSize: 14, fontWeight: 700 },
  userRole: { marginTop: 3, color: '#94a3b8', fontSize: 12 },
  logoutButton: { marginTop: 14, width: '100%', padding: '9px 12px', border: '1px solid #475569', borderRadius: 6, background: 'transparent', color: '#e2e8f0', cursor: 'pointer', fontWeight: 600 },
  content: { flex: 1, minWidth: 0, marginLeft: 248 },
};
