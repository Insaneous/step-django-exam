import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getUsers } from '../../api/apiClient';

export const fetchUsers = createAsyncThunk('users/fetchUsers', async () => {
  const response = await getUsers();
  return response.data;
});

export const userSlice = createSlice({
  name: 'users',
  initialState: {
    users: [],
    loading: false,
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default userSlice.reducer;
