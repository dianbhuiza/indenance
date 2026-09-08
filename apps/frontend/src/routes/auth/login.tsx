import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);
  const [serverError, setServerError] = useState<string | null>(null);
  const successMessage = (location.state as { message?: string } | null)?.message ?? null;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      const { data: session } = await api.post('/auth/login', data);
      setSession(session);
      navigate('/dashboard');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Error al iniciar sesión';
      setServerError(message);
    }
  };

  return (
    <div>
      <h2 className="mb-6 text-center text-2xl font-bold text-text">
        Iniciar sesión
      </h2>

      {successMessage && (
        <div className="mb-4 rounded-lg border border-success-200 bg-success-50 p-3 text-sm text-success-700">
          {successMessage}
        </div>
      )}

      {serverError && (
        <div className="mb-4 rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        ¿No tienes cuenta?{' '}
        <Link
          to="/register"
          className="font-medium text-primary-600 hover:text-primary-500"
        >
          Regístrate
        </Link>
      </p>
    </div>
  );
}
