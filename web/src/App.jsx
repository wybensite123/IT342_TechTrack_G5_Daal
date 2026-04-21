import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import GuestRoute from './routes/GuestRoute';
import AdminRoute from './routes/AdminRoute';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

const HomePage    = lazy(() => import('./pages/user/HomePage'));
const MyLoansPage = lazy(() => import('./pages/user/MyLoansPage'));
const AdminPage   = lazy(() => import('./pages/admin/AdminPage'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Suspense fallback={<div className="suspense-fallback" />}>
                  <HomePage />
                </Suspense>
              </ProtectedRoute>
            } />

            <Route path="/loans" element={
              <ProtectedRoute>
                <Suspense fallback={<div className="suspense-fallback" />}>
                  <MyLoansPage />
                </Suspense>
              </ProtectedRoute>
            } />

            <Route path="/admin" element={
              <AdminRoute>
                <Suspense fallback={<div className="suspense-fallback" />}>
                  <AdminPage />
                </Suspense>
              </AdminRoute>
            } />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
