import { createBrowserRouter } from 'react-router-dom';
import { RootTemplate } from '../templates/RootTemplate';
import { PrivateRoute } from './PrivateRoute';
import { ChatPage } from '../pages/ChatPage';
import { AuthPage } from '../pages/AuthPage';
import { ChatTemplate } from '../templates/ChatTemplate';

// Define the routes with protection
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootTemplate />,
    children: [
      {
        path: '/auth',
        element: <AuthPage />,
      },
      {
        path: '/',
        element: (
          <PrivateRoute>
            <ChatTemplate />
          </PrivateRoute>
        ),
        children: [
          {
            path: '/chat/:id',
            element: <ChatPage />,
          },
        ],
      },
    ],
  },
]);
