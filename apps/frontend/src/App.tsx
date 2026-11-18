import '@/lib/api';
import { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Providers } from './app/providers';
import { router } from './app/router';
import './index.css';

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const store = useAuthStore.getState();
    if (store.accessToken) {
      setReady(true);
      return;
    }
    api
      .post('/auth/refresh', {})
      .then(({ data }) => store.setSession(data))
      .catch(() => store.clearSession())
      .finally(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
}

export default App;
