import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getChats, getChatById, sendMessageToChat } from '../../api/apiClient';

export const fetchChats = createAsyncThunk('chat/fetchChats', async () => {
  const response = await getChats();
  return response.data;
});

export const fetchChatById = createAsyncThunk('chat/fetchChatById', async (id) => {
  const response = await getChatById(id);
  return response.data;
});

export const sendMessage = createAsyncThunk('chat/sendMessage', async ({ chatId, message }) => {
  await sendMessageToChat(chatId, message);
  return { chatId, message };
});

export const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    chats: [],
    selectedChat: null,
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.chats = action.payload;
      })
      .addCase(fetchChatById.fulfilled, (state, action) => {
        state.selectedChat = action.payload;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const { chatId, message } = action.payload;
        const chat = state.chats.find((c) => c.id === chatId);
        if (chat) {
          chat.messages.push(message);
        }
      });
  },
});

export default chatSlice.reducer;
