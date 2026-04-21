import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="suspense-fallback" />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ROLE_ADMIN') return <Navigate to="/dashboard" replace />;
  return children;
};

export default AdminRoute;
