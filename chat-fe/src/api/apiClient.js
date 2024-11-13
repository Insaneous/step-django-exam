import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000/',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error('Session expired or invalid token');
      localStorage.removeItem('access_token');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export const getCurrentUser = () => apiClient.get('/auth/current-user');

export const getUser = (userData) =>
  apiClient.get(`/auth/user/?username_or_email=${encodeURIComponent(userData)}`);

export const getUsers = () => apiClient.get('/auth/users');

export const registerUser = (userData) => apiClient.post('/auth/register', userData);

export const loginUser = (userData) => apiClient.post('/auth/login', userData);

export const logoutUser = () => apiClient.post('/auth/logout');

export const getChats = () => apiClient.get('/chat');

export const getChatById = (id) => apiClient.get(`/chat/messages/${id}`);

export const createOrGetChat = (username) =>
  apiClient.post('/chat/create-or-get', username);

export const getMessageById = (messageId) => apiClient.get(`/chat/message/${messageId}`);

export const sendMessageToChat = (chatId, formData) => {
  return apiClient.post(`/chat/message/${chatId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};


export default apiClient;
