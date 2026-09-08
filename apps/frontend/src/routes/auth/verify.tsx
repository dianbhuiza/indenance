import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui';

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setErrorMessage('Token de verificación no encontrado.');
      return;
    }

    api
      .post('/auth/verify-email', { token })
      .then(({ data }) => {
        setSession(data);
        setStatus('success');
        setTimeout(() => navigate('/dashboard'), 2000);
      })
      .catch((err) => {
        const message =
          err.response?.data?.message ?? 'Token inválido o expirado.';
        setErrorMessage(message);
        setStatus('error');
      });
  }, [searchParams, setSession, navigate]);

  return (
    <div className="text-center">
      {status === 'loading' && (
        <>
          <h2 className="mb-4 text-2xl font-bold text-text">
            Verificando tu email...
          </h2>
          <p className="text-text-secondary">
            Un momento, estamos confirmando tu cuenta.
          </p>
        </>
      )}

      {status === 'success' && (
        <>
          <h2 className="mb-4 text-2xl font-bold text-success-700">
            Email verificado
          </h2>
          <p className="text-text-secondary">
            Tu cuenta está activa. Serás redirigido al dashboard...
          </p>
        </>
      )}

      {status === 'error' && (
        <>
          <h2 className="mb-4 text-2xl font-bold text-danger-700">
            No se pudo verificar
          </h2>
          <p className="mb-6 text-text-secondary">{errorMessage}</p>
          <Link to="/login">
            <Button>Volver al login</Button>
          </Link>
        </>
      )}
    </div>
  );
}
