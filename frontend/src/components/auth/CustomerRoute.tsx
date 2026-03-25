import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';

interface CustomerRouteProps {
  children: React.ReactNode;
  allowAdmin?: boolean;
}

const CustomerRoute: React.FC<CustomerRouteProps> = ({ children, allowAdmin = false }) => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowAdmin && user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

export default CustomerRoute;
