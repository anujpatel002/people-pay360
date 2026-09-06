import { useEffect, useRef } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from './store';
import AppRouter from './routes/AppRouter';
import '@/styles/app.css';
import { refreshToken } from '@/features/auth/services/auth.service';
import { markInitialized, setCredentials } from '@/features/auth/store/auth.slice';
import { AppDispatch } from './store';

const queryClient = new QueryClient();

export default function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthBootstrap />
      </QueryClientProvider>
    </Provider>
  );
}

function AuthBootstrap() {
  const dispatch = useDispatch<AppDispatch>();
  const refreshAttempted = useRef(false);

  useEffect(() => {
    if (refreshAttempted.current) return;
    refreshAttempted.current = true;

    refreshToken()
      .then(({ accessToken, user }) => dispatch(setCredentials({ accessToken, user })))
      .catch(() => dispatch(markInitialized()));
  }, [dispatch]);

  return <AppRouter />;
}
