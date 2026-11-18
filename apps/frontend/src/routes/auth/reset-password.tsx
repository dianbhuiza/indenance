import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input } from '@/components/ui';
import { api } from '@/lib/api';
import { getApiError, getApiErrorMessage, resetPasswordSchema, type ResetPasswordFormData } from '@indenance/core';
import { useAuthStore } from '@/stores/auth.store';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clearSession = useAuthStore((s) => s.clearSession);
  const token = searchParams.get('token');
  const [serverError, setServerError] = useState<string | null>(null);
  const [showRequestLink, setShowRequestLink] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setServerError(null);
    setShowRequestLink(false);
    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword: data.newPassword,
      });
      clearSession();
      navigate('/login', {
        state: {
          message:
            'Contraseña actualizada. Inicia sesión con tu nueva contraseña.',
        },
      });
    } catch (err: unknown) {
      const { status } = getApiError(err);
      if (status === 401) {
        setServerError(
          'El enlace ya no es válido: caducó o ya fue usado.',
        );
        setShowRequestLink(true);
      } else if (status === 429) {
        setServerError(
          'Demasiados intentos. Espera un minuto y vuelve a intentarlo.',
        );
      } else {
        setServerError(getApiErrorMessage(err, 'No se pudo restablecer la contraseña.'));
      }
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <h2 className="mb-4 text-2xl font-bold text-text">
          Enlace no válido
        </h2>
        <p className="mb-6 text-text-secondary">
          El enlace de recuperación está incompleto o ha caducado. Solicita uno
          nuevo y revisa tu correo.
        </p>
        <Link to="/auth/forgot-password">
          <Button>Solicitar un nuevo enlace</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-2 text-center text-2xl font-bold text-text">
        Nueva contraseña
      </h2>
      <p className="mb-6 text-center text-sm text-text-secondary">
        Elige una contraseña nueva. Se cerrarán todas las sesiones abiertas en
        otros dispositivos.
      </p>

      {serverError && (
        <div className="mb-4 rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700">
          {serverError}
          {showRequestLink && (
            <>
              {' '}
              <Link
                to="/auth/forgot-password"
                className="font-medium text-danger-700 underline"
              >
                Solicitar un enlace nuevo
              </Link>
            </>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nueva contraseña"
          type="password"
          autoComplete="new-password"
          autoFocus
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />
        <Input
          label="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          error={errors.confirm?.message}
          {...register('confirm')}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Restablecer contraseña'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        <Link
          to="/login"
          className="font-medium text-primary-600 hover:text-primary-500"
        >
          Volver al inicio de sesión
        </Link>
      </p>
    </div>
  );
}
