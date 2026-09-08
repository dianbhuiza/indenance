import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useUIStore } from '@/stores/ui.store';
import { Button } from '@/components/ui';
import clsx from 'clsx';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export function DashboardLayout() {
  const location = useLocation();
  const { user, clearSession } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 w-64 bg-surface border-r border-border shadow-sm transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-6">
          <Link to="/dashboard" className="text-xl font-bold text-primary-600">
            Indenance
          </Link>
          <button onClick={toggleSidebar} className="lg:hidden text-text-secondary hover:text-text">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-4 space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => useUIStore.getState().setSidebarOpen(false)}
                className={clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                    : 'text-text-secondary hover:bg-surface-raised hover:text-text',
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4">
          <div className="mb-3 text-sm text-text-muted truncate">
            {user?.email}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSession}
            className="w-full justify-start text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center border-b border-border bg-surface px-4 shadow-sm lg:px-6">
          <button onClick={toggleSidebar} className="lg:hidden mr-4 text-text-secondary hover:text-text">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <div className="text-sm text-text-secondary">
            {user?.name ?? user?.email}
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
