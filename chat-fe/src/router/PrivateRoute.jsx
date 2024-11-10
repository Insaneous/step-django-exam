// src/components/PrivateRoute.js
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

export const PrivateRoute = ({ children }) => {
  const user = useSelector((state) => state.auth.user);

  // Redirect to login page if user is not authenticated
  if (!user) {
    return <Navigate to="/auth" />;
  }

  return children;
};
