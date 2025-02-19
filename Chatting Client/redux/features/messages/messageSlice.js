// // redux\features\messages\messageSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async (chatId, { rejectWithValue }) => {
    try {
      console.log('[messageSlice] Fetching messages for chat:', chatId);
      const response = await fetch(`/api/messages/${chatId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch messages');
      }
      return { chatId, messages: data.data };
    } catch (error) {
      console.error('[messageSlice] Error fetching messages:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async ({ formData, socket }, { rejectWithValue }) => {
    try {
      console.log('[messageSlice] Preparing to send message', formData);

      // Log FormData contents
      const formDataEntries = {};
      for (let [key, value] of formData.entries()) {
        formDataEntries[key] =
          value instanceof File
            ? `File: ${value.name} (${value.size} bytes)`
            : value;
      }
      console.log('[messageSlice] FormData contents:', formDataEntries);

      const response = await fetch('/api/messages', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('[messageSlice] Server response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      // Emit socket event for real-time updates
      if (socket && data.data) {
        console.log(
          '[messageSlice] Emitting socket event for message:',
          data.data._id
        );
        socket.emit('new-message', data.data);
      }

      return data.data;
    } catch (error) {
      console.error('[messageSlice] Error sending message:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const editMessage = createAsyncThunk(
  'messages/editMessage',
  async ({ formData, socket }, { rejectWithValue }) => {
    try {
      const messageId = formData.get('messageId');
      const content = formData.get('content');

      // Convert FormData to JSON for this endpoint
      const response = await fetch(`/api/messages/${messageId}/edit`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content,
        }),
      });

      if (!response.ok) {
        throw new Error('Validation Error');
      }

      const data = await response.json();

      // Emit socket event for real-time updates
      if (socket && data.data) {
        socket.emit('message-updated', data.data);
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const markMessageAsRead = createAsyncThunk(
  'messages/markAsRead',
  async ({ messageId, chatId, userId }, { rejectWithValue }) => {
    try {
      console.log('[messageSlice] Marking message as read:', messageId);

      const response = await fetch(`/api/messages/${messageId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark message as read');
      }

      const data = await response.json();
      return { messageId, chatId, readData: data.data };
    } catch (error) {
      console.error('[messageSlice] Error marking message as read:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const pinMessage = createAsyncThunk(
  'messages/pinMessage',
  async ({ messageId, chatId, socket }, { rejectWithValue }) => {
    try {
      console.log('[messageSlice] Pinning message:', messageId);

      const response = await fetch(`/api/messages/${messageId}/pin`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPinned: true, chatId }),
      });

      if (!response.ok) {
        throw new Error('Failed to pin message');
      }

      const data = await response.json();
      const pinnedData = {
        ...data.data,
        pinnedAt: new Date().toISOString(),
      };

      // Emit socket event for real-time updates
      if (socket) {
        console.log(
          '[messageSlice] Emitting socket event for pinned message:',
          messageId
        );
        socket.emit('message-updated', pinnedData);
      }

      return { messageId, chatId, pinnedData };
    } catch (error) {
      console.error('[messageSlice] Error pinning message:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const unpinMessage = createAsyncThunk(
  'messages/unpinMessage',
  async ({ messageId, chatId, socket }, { rejectWithValue }) => {
    try {
      console.log('[messageSlice] Unpinning message:', messageId);

      const response = await fetch(`/api/messages/${messageId}/pin`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPinned: false, chatId }),
      });

      if (!response.ok) {
        throw new Error('Failed to unpin message');
      }

      const data = await response.json();

      // Emit socket event for real-time updates
      if (socket) {
        console.log(
          '[messageSlice] Emitting socket event for unpinned message:',
          messageId
        );
        socket.emit('message-updated', data.data);
      }

      return { messageId, chatId, pinnedData: data.data };
    } catch (error) {
      console.error('[messageSlice] Error unpinning message:', error);
      return rejectWithValue(error.message);
    }
  }
);

const messageSlice = createSlice({
  name: 'messages',
  initialState: {
    messagesByChat: {},
    loading: false,
    error: null,
  },
  reducers: {
    addMessage: (state, action) => {
      const message = action.payload;
      const chatId = message.chat?._id || message.chat;
      console.log('[messageSlice] Adding new message to chat:', chatId);

      if (!state.messagesByChat[chatId]) {
        state.messagesByChat[chatId] = [];
      }
      state.messagesByChat[chatId].push(message);
    },
    updateMessage: (state, action) => {
      const message = action.payload;
      const chatId = message.chat?._id || message.chat;
      const messageId = message._id;
      console.log(
        '[messageSlice] Updating message:',
        messageId,
        'in chat:',
        chatId
      );

      if (state.messagesByChat[chatId]) {
        const index = state.messagesByChat[chatId].findIndex(
          msg => msg._id === messageId
        );
        if (index !== -1) {
          state.messagesByChat[chatId][index] = message;
        }
      }
    },
    deleteMessage: (state, action) => {
      const { chatId, messageId } = action.payload;
      console.log(
        '[messageSlice] Deleting message:',
        messageId,
        'from chat:',
        chatId
      );

      if (state.messagesByChat[chatId]) {
        state.messagesByChat[chatId] = state.messagesByChat[chatId].filter(
          msg => msg._id !== messageId
        );
      }
    },
    clearMessages: (state, action) => {
      const chatId = action.payload;
      console.log('[messageSlice] Clearing all messages for chat:', chatId);
      delete state.messagesByChat[chatId];
    },
  },
  extraReducers: builder => {
    builder
      // Fetch Messages
      .addCase(fetchMessages.pending, state => {
        state.loading = true;
        state.error = null;
        console.log('[messageSlice] Fetching messages pending');
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        const { chatId, messages } = action.payload;
        console.log(
          '[messageSlice] Fetched messages for chat:',
          chatId,
          'Count:',
          messages?.length
        );

        state.messagesByChat[chatId] = messages || [];
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error(
          '[messageSlice] Fetch messages rejected:',
          action.payload
        );
      })

      // Send Message
      .addCase(sendMessage.pending, state => {
        state.error = null;
        console.log('[messageSlice] Sending message pending');
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const message = action.payload;
        const chatId = message.chat?._id || message.chat;
        console.log(
          '[messageSlice] Message sent successfully to chat:',
          chatId
        );

        if (!state.messagesByChat[chatId]) {
          state.messagesByChat[chatId] = [];
        }
        state.messagesByChat[chatId].push(message);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.payload;
        console.error('[messageSlice] Send message rejected:', action.payload);
      })

      // Edit Message
      .addCase(editMessage.fulfilled, (state, action) => {
        const message = action.payload;
        const chatId = message.chat?._id || message.chat;
        console.log('[messageSlice] Message edited successfully:', message._id);

        if (state.messagesByChat[chatId]) {
          const index = state.messagesByChat[chatId].findIndex(
            msg => msg._id === message._id
          );
          if (index !== -1) {
            state.messagesByChat[chatId][index] = message;
          }
        }
      })

      // Mark as Read
      .addCase(markMessageAsRead.fulfilled, (state, action) => {
        const { messageId, chatId, readData } = action.payload;
        if (state.messagesByChat[chatId]) {
          const messageIndex = state.messagesByChat[chatId].findIndex(
            msg => msg._id === messageId
          );
          if (messageIndex !== -1) {
            state.messagesByChat[chatId][messageIndex].readBy = readData.readBy;
          }
        }
      })

      // Pin Message
      .addCase(pinMessage.fulfilled, (state, action) => {
        const { messageId, chatId, pinnedData } = action.payload;
        if (state.messagesByChat[chatId]) {
          const messageIndex = state.messagesByChat[chatId].findIndex(
            msg => msg._id === messageId
          );
          if (messageIndex !== -1) {
            state.messagesByChat[chatId][messageIndex] = {
              ...state.messagesByChat[chatId][messageIndex],
              isPinned: true,
              pinnedAt: pinnedData.pinnedAt,
            };
          }
        }
      })

      // Unpin Message
      .addCase(unpinMessage.fulfilled, (state, action) => {
        const { messageId, chatId, pinnedData } = action.payload;
        if (state.messagesByChat[chatId]) {
          const messageIndex = state.messagesByChat[chatId].findIndex(
            msg => msg._id === messageId
          );
          if (messageIndex !== -1) {
            state.messagesByChat[chatId][messageIndex] = {
              ...state.messagesByChat[chatId][messageIndex],
              isPinned: false,
              pinnedAt: null,
            };
          }
        }
      });
  },
});

export const { addMessage, updateMessage, deleteMessage, clearMessages } =
  messageSlice.actions;

export const selectMessagesByChatId = (state, chatId) => {
  return state.messages.messagesByChat[chatId] || [];
};
export const selectMessagesLoading = state => state.messages.loading;
export const selectMessagesError = state => state.messages.error;

export default messageSlice.reducer;
