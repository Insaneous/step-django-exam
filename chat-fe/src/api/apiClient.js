import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000/', // Replace with your FastAPI base URL
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies in the request
});

// Define the new function for getting the current user
export const getCurrentUser = (token) => {
  return apiClient.get('/auth/current-user', {
    headers: {
      Authorization: `Bearer ${token}`, // Include the token in the Authorization header
    },
  });
};

export const getUser = (userData) => apiClient.get(`/auth/user/?username_or_email=${userData}`);
export const registerUser = (userData) => apiClient.post('/auth/register', userData);
export const loginUser = (userData) => apiClient.post('/auth/login', userData);
export const logoutUser = () => apiClient.post('/auth/logout');

export const getChats = () => apiClient.get('/chat');
export const getChatById = (id) => apiClient.get(`/chat/messages/${id}`);
export const sendMessageToChat = (chatId, message) =>
  apiClient.post(`/chat/message/${chatId}`, { message });

export default apiClient;
