import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from '@/layouts/auth-layout';
import { DashboardLayout } from '@/layouts/dashboard-layout';
import { RequireAccounts } from '@/components/require-accounts';
import { LoginPage } from '@/routes/auth/login';
import { RegisterPage } from '@/routes/auth/register';
import { VerifyEmailPage } from '@/routes/auth/verify';
import { DashboardPage } from '@/routes/dashboard';
import { HomePage } from '@/routes';
import { RootError } from '@/routes/error';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
    errorElement: <RootError />,
  },
  {
    path: '/login',
    element: <AuthLayout />,
    children: [
      { index: true, element: <LoginPage /> },
    ],
  },
  {
    path: '/register',
    element: <AuthLayout />,
    children: [
      { index: true, element: <RegisterPage /> },
    ],
  },
  {
    path: '/auth/verify',
    element: <AuthLayout />,
    children: [
      { index: true, element: <VerifyEmailPage /> },
    ],
  },
  {
    path: '/dashboard',
    element: (
      <RequireAccounts>
        <DashboardLayout />
      </RequireAccounts>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
