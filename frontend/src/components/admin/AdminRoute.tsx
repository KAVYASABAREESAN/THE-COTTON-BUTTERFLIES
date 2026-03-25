import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/admin/login" />;
  }

  return <>{children}</>;
};

export default AdminRoute;
