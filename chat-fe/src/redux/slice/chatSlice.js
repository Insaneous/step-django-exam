import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getChats, getChatById, sendMessageToChat, getMessageById } from '../../api/apiClient';

export const fetchChats = createAsyncThunk('chat/fetchChats', async (_, { rejectWithValue }) => {
  try {
    const response = await getChats();
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

export const fetchChatById = createAsyncThunk('chat/fetchChatById', async (id, { rejectWithValue }) => {
  try {
    const response = await getChatById(id);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ chatId, formData }, { rejectWithValue }) => {
    try {
      const response = await sendMessageToChat(chatId, formData);
      return { chatId, message: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchMessageById = createAsyncThunk(
  'chat/fetchMessageById',
  async (messageId, { rejectWithValue }) => {
    try {
      const response = await getMessageById(messageId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    chats: [],
    selectedChat: null,
    status: 'idle',
    error: null,
  },
  reducers: {
    addMessageFromWebSocket: (state, action) => {
      const { chatId, message } = action.payload;
      const chat = state.chats.find((c) => c.id === chatId);
      if (chat) {
        if (!chat.data) chat.data = [];
        chat.data.push(message);
      }
      if (state.selectedChat?.id === chatId) {
        if (!state.selectedChat.data) state.selectedChat.data = [];
        state.selectedChat.data.push(message);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Chats
      .addCase(fetchChats.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.chats = action.payload;
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch chats.';
      })

      // Fetch Chat by ID
      .addCase(fetchChatById.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchChatById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.selectedChat = action.payload;
      })
      .addCase(fetchChatById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch chat details.';
      })

      // Send Message
      .addCase(sendMessage.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const { chatId, message } = action.payload;
        const chat = state.chats.find((c) => c.id === chatId);
        if (chat) chat.data.push(message);
      
        if (state.selectedChat?.id === chatId) {
          state.selectedChat.data.push(message);
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to send message.';
      });
  },
});

export const { addMessageFromWebSocket } = chatSlice.actions;

export default chatSlice.reducer;
