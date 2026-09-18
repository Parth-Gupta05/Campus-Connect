import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their default dashboard if they try to access something they shouldn't
    const fallbackRoute = user.role === 'admin' ? '/admin' : (user.role === 'club' ? '/club' : '/dashboard');
    return <Navigate to={fallbackRoute} replace />;
  }

  return children;
}