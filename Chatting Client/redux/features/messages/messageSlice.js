// // redux\features\messages\messageSlice.js
import {
  createSlice,
  createAsyncThunk,
  createSelector,
} from '@reduxjs/toolkit';

export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async ({ chatId, page = 1, limit = 40 }, { rejectWithValue }) => {
    try {
      if (!chatId) {
        return rejectWithValue('Chat ID is required');
      }

      const response = await fetch(
        `/api/messages?chatId=${chatId}&page=${page}&limit=${limit}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to fetch messages');
      }

      const data = await response.json();
      return {
        chatId,
        messages: data.data.messages || [],
        meta: data.data.meta || {
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
        },
        page,
      };
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
    meta: {},
    loading: false,
    error: null,
    initialized: {},
  },
  reducers: {
    addMessage: (state, action) => {
      const message = action.payload;
      const chatId = message.chat?._id || message.chat;

      if (!state.messagesByChat[chatId]) {
        state.messagesByChat[chatId] = [];
      }
      if (!state.messagesByChat[chatId].some(msg => msg._id === message._id)) {
        state.messagesByChat[chatId].push(message);
        state.messagesByChat[chatId].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
      }
    },
    updateMessage: (state, action) => {
      const message = action.payload;
      const chatId = message.chat?._id || message.chat;
      const messageId = message._id;

      if (state.messagesByChat[chatId]) {
        const index = state.messagesByChat[chatId].findIndex(
          msg => msg._id === messageId
        );
        if (index !== -1) {
          state.messagesByChat[chatId][index] = {
            ...state.messagesByChat[chatId][index],
            ...message,
          };
        }
      }
    },
    deleteMessage: (state, action) => {
      const { chatId, messageId } = action.payload;
      if (state.messagesByChat[chatId]) {
        state.messagesByChat[chatId] = state.messagesByChat[chatId].filter(
          msg => msg._id !== messageId
        );
      }
    },
    clearMessages: (state, action) => {
      const chatId = action.payload;
      delete state.messagesByChat[chatId];
      delete state.meta[chatId];
    },
    resetLoadingState: state => {
      state.loading = false;
    },
    markChatInitialized: (state, action) => {
      state.initialized[action.payload] = true;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchMessages.pending, (state, action) => {
        // Only set loading true if this is the first load for this chat
        const chatId = action.meta.arg.chatId;
        if (!state.initialized[chatId]) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { chatId, messages, meta, page } = action.payload;

        if (!state.messagesByChat[chatId]) {
          state.messagesByChat[chatId] = [];
        }

        // Handle message ordering based on page
       if (page === 1) {
         state.messagesByChat[chatId] = [...messages].sort(
           (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
         );
       } else {
         const existingMessages = state.messagesByChat[chatId];
         const newMessages = messages.filter(
           msg =>
             !existingMessages.some(existingMsg => existingMsg._id === msg._id)
         );
         state.messagesByChat[chatId] = [
           ...existingMessages,
           ...newMessages,
         ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
       }

        state.meta[chatId] = meta;
        state.loading = false;
        state.initialized[chatId] = true;
        state.error = null;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch messages';
      })
      // Keep other cases unchanged but ensure correct message ordering
      .addCase(sendMessage.fulfilled, (state, action) => {
        const message = action.payload;
        const chatId = message.chat?._id || message.chat;

        if (!state.messagesByChat[chatId]) {
          state.messagesByChat[chatId] = [];
        }
        // Add new message and ensure correct order
        const existingMessages = state.messagesByChat[chatId];
        if (!existingMessages.some(msg => msg._id === message._id)) {
          state.messagesByChat[chatId] = [...existingMessages, message].sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          );
        }
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

export const selectMessagesByChatId = createSelector(
  [state => state.messages.messagesByChat, (state, chatId) => chatId],
  (messagesByChat, chatId) => {
    if (!chatId || !messagesByChat[chatId]) return [];
    return [...messagesByChat[chatId]].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );
  }
);

export const selectMessagesLoading = state => state.messages.loading;
export const selectMessagesMeta = (state, chatId) =>
  chatId ? state.messages.meta[chatId] : undefined;
export const selectMessagesError = state => state.messages.error;

export default messageSlice.reducer;

// In messageSlice.js

// export const addMessage = createAsyncThunk(
//   'messages/addMessage',
//   async (message, { getState }) => {
//     const chatId = message.chat?._id || message.chat;
//     const state = getState();
//     const existingMessages = state.messages.messagesByChat[chatId] || [];

//     // Check if message already exists
//     const messageExists = existingMessages.some(msg => msg._id === message._id);

//     if (!messageExists) {
//       return message;
//     }
//     return null;
//   }
// );

// // In the reducer
// extraReducers: builder => {
//   builder
//     .addCase(addMessage.fulfilled, (state, action) => {
//       if (action.payload) {
//         const message = action.payload;
//         const chatId = message.chat?._id || message.chat;

//         if (!state.messagesByChat[chatId]) {
//           state.messagesByChat[chatId] = [];
//         }

//         // Add new message and ensure correct order
//         state.messagesByChat[chatId] = [...state.messagesByChat[chatId], message]
//           .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
//       }
//     });
// };
