import { Link, useRouteError } from 'react-router-dom';

export function RootError() {
  const error = useRouteError();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-gray-300">404</h1>
        <p className="mb-2 text-xl text-gray-600">
          {(error as Error)?.message ?? 'Página no encontrada'}
        </p>
        <Link
          to="/"
          className="mt-4 inline-block rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
