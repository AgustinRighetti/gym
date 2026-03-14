import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, requiredRole }) {
  const { token, user, loading } = useAuth();

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: '#fff' }}>Cargando...</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.rol !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
