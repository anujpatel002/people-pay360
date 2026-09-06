import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { UserRole } from '@/shared/types/api.types';
import NotificationBell from '@/features/time-off/components/NotificationBell';

interface NavigationItem {
  label: string;
  path: string;
  roles: UserRole[];
  icon: React.ReactNode;
}

const ALL_HR: UserRole[] = ['HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'];
const PAYROLL: UserRole[] = ['HR Payroll User', 'HR Payroll Manager', 'Admin'];
const ADMIN: UserRole[] = ['Admin'];
const ALL: UserRole[] = ['Employee', ...ALL_HR];

const navigation: NavigationItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    roles: ALL,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Employees',
    path: '/employees',
    roles: ALL_HR,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: 'Attendance',
    path: '/attendance',
    roles: ALL,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    label: 'Contracts',
    path: '/contracts',
    roles: ALL_HR,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    label: 'Working Schedules',
    path: '/working-schedules',
    roles: ALL_HR,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    label: 'Time Off Requests',
    path: '/time-off/requests',
    roles: ALL,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
      </svg>
    ),
  },
  {
    label: 'Time Off Types',
    path: '/time-off/types',
    roles: ALL_HR,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    ),
  },
  {
    label: 'Time Off Allocations',
    path: '/time-off/allocations',
    roles: ALL_HR,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    label: 'Payroll / Payruns',
    path: '/payroll',
    roles: PAYROLL,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M14.8 9A2 2 0 0 0 13 8h-2a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4h-2a2 2 0 0 1-1.8-1" />
        <path d="M12 6v2m0 8v2" />
      </svg>
    ),
  },
  {
    label: 'Users & Roles',
    path: '/users',
    roles: ADMIN,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a5 5 0 0 0-5 5v3a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z" />
        <path d="M19 21v-2a6 6 0 0 0-12 0v2" />
      </svg>
    ),
  },
];

export default function AppShell() {
  const { user } = useCurrentUser();
  const { handleLogout } = useLogout();
  const role = user?.role;
  const isHR = role && ['HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'].includes(role);
  const visibleNavigation = navigation.filter((item) => role && item.roles.includes(role));

  const userInitial = user?.name ? user.name[0].toUpperCase() : 'U';

  return (
    <div style={styles.app}>
      <aside style={styles.sidebar}>
        {/* Brand Block */}
        <div style={styles.brandBlock}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: '16px',
                boxShadow: '0 4px 10px rgba(79, 70, 229, 0.35)',
              }}
            >
              P
            </div>
            <div>
              <div style={styles.brand}>PeoplePay360</div>
              <div style={styles.brandCaption}>Enterprise HR & Payroll</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
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
              <span style={{ display: 'flex', alignItems: 'center', opacity: 0.9 }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Profile Block */}
        <div style={styles.userBlock}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
                border: '1px solid #475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f8fafc',
                fontWeight: 700,
                fontSize: '14px',
              }}
            >
              {userInitial}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={styles.userName}>{user?.name}</div>
              <div style={styles.userRole}>{user?.role}</div>
            </div>
          </div>

          <button type="button" onClick={handleLogout} style={styles.logoutButton}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      <main style={styles.content}>
        {/* Top bar with notification bell for HR */}
        {isHR && (
          <div style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '10px 24px', background: 'rgba(248,250,252,0.9)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #e2e8f0' }}>
            <NotificationBell />
          </div>
        )}
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
    fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
  },
  sidebar: {
    width: 256,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#090d16',
    color: '#e2e8f0',
    position: 'fixed',
    inset: '0 auto 0 0',
    zIndex: 20,
    borderRight: '1px solid #1e293b',
  },
  brandBlock: {
    padding: '24px 20px 20px',
    borderBottom: '1px solid #1e293b',
  },
  brand: {
    fontSize: '17px',
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: '-0.02em',
  },
  brandCaption: {
    marginTop: '2px',
    fontSize: '11px',
    color: '#64748b',
    fontWeight: 600,
  },
  navigation: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '16px 12px',
    overflowY: 'auto',
    flex: 1,
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    borderRadius: '10px',
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: '13.5px',
    fontWeight: 600,
    transition: 'all 0.16s ease',
  },
  activeNavLink: {
    background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
    color: '#ffffff',
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
  },
  userBlock: {
    marginTop: 'auto',
    padding: '16px',
    borderTop: '1px solid #1e293b',
    background: '#0b1120',
  },
  userName: {
    color: '#ffffff',
    fontSize: '13.5px',
    fontWeight: 700,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userRole: {
    marginTop: '2px',
    color: '#818cf8',
    fontSize: '11px',
    fontWeight: 650,
  },
  logoutButton: {
    marginTop: '12px',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '8px 12px',
    border: '1px solid #334155',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.04)',
    color: '#cbd5e1',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '12.5px',
    transition: 'all 0.15s ease',
  },
  content: {
    flex: 1,
    minWidth: 0,
    marginLeft: 256,
  },
};
