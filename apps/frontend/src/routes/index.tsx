import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui';

export function HomePage() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-950 dark:to-primary-900">
      <div className="text-center">
        <h1 className="mb-4 text-5xl font-bold text-primary-900 dark:text-primary-100">
          Indenance
        </h1>
        <p className="mb-8 text-lg text-primary-700 dark:text-primary-300">
          Gestiona tus finanzas personales de forma inteligente
        </p>
        <div className="flex gap-4 justify-center">
          {isAuthenticated ? (
            <Link to="/dashboard">
              <Button size="lg">Ir al Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button size="lg">Iniciar sesión</Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="secondary">
                  Crear cuenta
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
