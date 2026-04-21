import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import GuestRoute from './routes/GuestRoute';
import AdminRoute from './routes/AdminRoute';
import Layout from './components/Layout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

const HomePage    = lazy(() => import('./pages/user/HomePage'));
const MyLoansPage = lazy(() => import('./pages/user/MyLoansPage'));
const AdminPage   = lazy(() => import('./pages/admin/AdminPage'));

const fallback = <div className="suspense-fallback" />;

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Guest-only routes */}
            <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

            {/* Protected routes — sidebar lives here, never unmounts on navigation */}
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Suspense fallback={fallback}><HomePage /></Suspense>} />
              <Route path="/loans"     element={<Suspense fallback={fallback}><MyLoansPage /></Suspense>} />
              <Route path="/admin"     element={
                <AdminRoute>
                  <Suspense fallback={fallback}><AdminPage /></Suspense>
                </AdminRoute>
              } />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
