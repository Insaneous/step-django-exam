// src/redux/slice/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loginUser, registerUser, logoutUser, getUser } from '../../api/apiClient';

export const checkUser = createAsyncThunk('auth/getUser', async (emailOrUsername) => {
  const response = await getUser(emailOrUsername);
  return response.data;
});

// Async thunk for login
export const login = createAsyncThunk('auth/login', async (userData) => {
  const response = await loginUser(userData);
  return response.data; // This is what will be available in payload
});

// Async thunk for register
export const register = createAsyncThunk('auth/register', async (userData) => {
  const response = await registerUser(userData);
  return response.data;
});

// Async thunk for logout (this is only used for dispatching logout in redux state)
export const logout = createAsyncThunk('auth/logout', async () => {
  await logoutUser(); // We don't need to do anything after calling the API
  return {}; // Clear the user data after logout
});

export const authSlice = createSlice({
  name: 'auth',
  initialState: {
    userExists: null,
    user: null,
    token: localStorage.getItem('access_token') || null,
  },
  reducers: {
    resetUserExists: (state) => {
      state.userExists = null;
    },
    setUser(state, action) {
      state.userExists = action.payload.userExists;
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    // Removed redundant logout definition here
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkUser.fulfilled, (state, action) => {
        state.userExists = action.payload;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.access_token;
        localStorage.setItem('access_token', action.payload.access_token);
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload.data;
        state.token = action.payload.access_token;
        localStorage.setItem('access_token', action.payload.access_token);
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        localStorage.removeItem('access_token');
      });
  },
});

// Export actions and reducer
export const { setUser, resetUserExists } = authSlice.actions; // Export only the action from reducers
export default authSlice.reducer;
