import { Link, Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="text-2xl font-bold text-primary-600">
            Indenance
          </Link>
        </div>
        <div className="rounded-xl border border-border bg-surface p-8 shadow-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
