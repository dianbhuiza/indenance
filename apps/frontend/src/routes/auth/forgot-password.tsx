import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input } from '@/components/ui';
import { api } from '@/lib/api';
import { getApiError, getApiErrorMessage, forgotPasswordSchema, type ForgotPasswordFormData } from '@indenance/core';

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setServerError(null);
    try {
      await api.post('/auth/forgot-password', data);
      setSent(true);
    } catch (err: unknown) {
      const { status } = getApiError(err);
      if (status === 429) {
        setServerError(
          'Demasiadas solicitudes. Espera un minuto y vuelve a intentarlo.',
        );
        return;
      }
      setServerError(
        getApiErrorMessage(err, 'No se pudo procesar la solicitud. Inténtalo de nuevo.'),
      );
    }
  };

  if (sent) {
    return (
      <div>
        <h2 className="mb-4 text-center text-2xl font-bold text-text">
          Revisa tu correo
        </h2>
        <div className="mb-6 rounded-lg border border-success-200 bg-success-50 p-3 text-sm text-success-700">
          Si el correo existe, recibirás un enlace para restablecer tu
          contraseña. El enlace caduca en 1 hora.
        </div>
        <p className="mb-6 text-center text-sm text-text-secondary">
          Si no lo ves, revisa tu carpeta de spam. ¿No usas ese correo?
        </p>
        <div className="space-y-3">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => setSent(false)}
          >
            Probar con otro correo
          </Button>
          <Link to="/login" className="block">
            <Button variant="ghost" className="w-full">
              Volver al inicio de sesión
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-2 text-center text-2xl font-bold text-text">
        Recupera tu contraseña
      </h2>
      <p className="mb-6 text-center text-sm text-text-secondary">
        Escribe el correo de tu cuenta y te enviaremos un enlace seguro para
        restablecer tu contraseña.
      </p>

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
          autoFocus
          error={errors.email?.message}
          {...register('email')}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando...' : 'Enviar enlace de recuperación'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        ¿Recordaste tu contraseña?{' '}
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
