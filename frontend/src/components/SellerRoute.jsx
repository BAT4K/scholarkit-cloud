import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function SellerRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner fullPage label="Checking permissions..." />;

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  if (user.role !== 'seller' && user.role !== 'admin') {
    return <Navigate to="/shop" replace />;
  }

  return children;
}
