import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '@/components/ui';
import { api } from '@/lib/api';

const registerSchema = z.object({
  name: z.string().max(120, 'Muy largo').optional(),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      await api.post('/auth/register', data);
      navigate('/login', {
        state: { message: 'Cuenta creada. Revisa tu email para verificar tu cuenta.' },
      });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Error al crear la cuenta';
      setServerError(message);
    }
  };

  return (
    <div>
      <h2 className="mb-6 text-center text-2xl font-bold text-text">
        Crear cuenta
      </h2>

      {serverError && (
        <div className="mb-4 rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nombre"
          type="text"
          autoComplete="name"
          error={errors.name?.message}
          {...register('name')}
        />
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
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creando...' : 'Crear cuenta'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        ¿Ya tienes cuenta?{' '}
        <Link
          to="/login"
          className="font-medium text-primary-600 hover:text-primary-500"
        >
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
