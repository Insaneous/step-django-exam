import { createBrowserRouter } from 'react-router-dom';
import { RootTemplate } from '../templates/RootTemplate';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { PrivateRoute } from './PrivateRoute';
import { ChatPage } from '../pages/ChatPage';
import { AuthPage } from '../pages/AuthPage';

// Define the routes with protection
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootTemplate />,
    children: [
      {
        path: '/',
        element: (
          <PrivateRoute>
            <HomePage />
          </PrivateRoute>
        ),
      },
      {
        path: '/chat/:id',
        element: (
          <PrivateRoute>
            <ChatPage />
          </PrivateRoute>
        ),
      },
      {
        path: '/auth',
        element: <AuthPage />,
      },
      {
        path: '/register',
        element: <RegisterPage />,
      },
    ],
  },
]);
