// // redux\features\messages\messageSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const fetchMessages = createAsyncThunk(
  "messages/fetchMessages",
  async (chatId, { rejectWithValue }) => {
    try {
      console.log("[messageSlice] Fetching messages for chat:", chatId);
      const response = await fetch(`/api/messages/${chatId}`);
      const data = await response.json();

      console.log("[messageSlice] Fetch response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch messages");
      }
      return { chatId, messages: data.data };
    } catch (error) {
      console.error("[messageSlice] Error fetching messages:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  "messages/sendMessage",
  async (formData, { rejectWithValue }) => {
    try {
      console.log("[messageSlice] Sending message with FormData");

      // Log FormData contents
      for (let [key, value] of formData.entries()) {
        console.log(
          `[messageSlice] FormData ${key}:`,
          value instanceof File ? `File: ${value.name}` : value
        );
      }

      const response = await fetch("/api/messages", {
        method: "POST",
        body: formData,
      });

      console.log(
        "[messageSlice] Send message response status:",
        response.status
      );
      const data = await response.json();
      console.log("[messageSlice] Send message response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      return data.data;
    } catch (error) {
      console.error("[messageSlice] Error sending message:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const markMessageAsRead = createAsyncThunk(
  "messages/markAsRead",
  async ({ messageId, chatId }, { rejectWithValue }) => {
    try {
      console.log("[messageSlice] Marking message as read:", messageId);
      const response = await fetch(`/api/messages/${messageId}/read`, {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Failed to mark message as read");
      }

      const data = await response.json();
      console.log("[messageSlice] Mark as read response:", data);
      return { messageId, chatId, readData: data.data };
    } catch (error) {
      console.error("[messageSlice] Error marking message as read:", error);
      return rejectWithValue(error.message);
    }
  }
);

const messageSlice = createSlice({
  name: "messages",
  initialState: {
    messagesByChat: {},
    loading: false,
    error: null,
  },
  reducers: {
    addMessage: (state, action) => {
      const message = action.payload;
      const chatId = message.chat?._id || message.chat;
      console.log("[messageSlice] Adding new message to chat:", chatId);

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
        "[messageSlice] Updating message:",
        messageId,
        "in chat:",
        chatId
      );

      if (state.messagesByChat[chatId]) {
        const index = state.messagesByChat[chatId].findIndex(
          (msg) => msg._id === messageId
        );
        if (index !== -1) {
          state.messagesByChat[chatId][index] = message;
        }
      }
    },
    deleteMessage: (state, action) => {
      const { chatId, messageId } = action.payload;
      console.log(
        "[messageSlice] Deleting message:",
        messageId,
        "from chat:",
        chatId
      );

      if (state.messagesByChat[chatId]) {
        state.messagesByChat[chatId] = state.messagesByChat[chatId].filter(
          (msg) => msg._id !== messageId
        );
      }
    },
    clearMessages: (state, action) => {
      const chatId = action.payload;
      console.log("[messageSlice] Clearing all messages for chat:", chatId);
      delete state.messagesByChat[chatId];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
        console.log("[messageSlice] Fetching messages pending");
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        const { chatId, messages } = action.payload;
        console.log(
          "[messageSlice] Fetched messages for chat:",
          chatId,
          "Count:",
          messages?.length
        );

        if (messages?.length > 0) {
          state.messagesByChat[chatId] = messages;
        } else {
          state.messagesByChat[chatId] = [];
        }
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error(
          "[messageSlice] Fetch messages rejected:",
          action.payload
        );
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const message = action.payload;
        const chatId = message.chat?._id || message.chat;
        console.log(
          "[messageSlice] Message sent successfully to chat:",
          chatId
        );

        if (!state.messagesByChat[chatId]) {
          state.messagesByChat[chatId] = [];
        }
        state.messagesByChat[chatId].push(message);
      })
      .addCase(markMessageAsRead.fulfilled, (state, action) => {
        const { messageId, chatId, readData } = action.payload;
        console.log(
          "[messageSlice] Message marked as read:",
          messageId,
          "in chat:",
          chatId
        );

        if (state.messagesByChat[chatId]) {
          const messageIndex = state.messagesByChat[chatId].findIndex(
            (msg) => msg._id === messageId
          );
          if (messageIndex !== -1) {
            state.messagesByChat[chatId][messageIndex].readBy = readData.readBy;
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
export const selectMessagesLoading = (state) => state.messages.loading;
export const selectMessagesError = (state) => state.messages.error;

export default messageSlice.reducer;
// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// export const fetchMessages = createAsyncThunk(
//   "messages/fetchMessages",
//   async (chatId, { rejectWithValue }) => {
//     try {
//       const response = await fetch(`/api/messages/${chatId}`);
//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.error || "Failed to fetch messages");
//       }
//       return { chatId, messages: data.data };
//     } catch (error) {
//       console.error("[messageSlice] Error fetching messages:", error);
//       return rejectWithValue(error.message);
//     }
//   }
// );

// export const sendMessage = createAsyncThunk(
//   "messages/sendMessage",
//   async ({ content, chatId, replyToId }, { rejectWithValue }) => {
//     try {
//       const response = await fetch("/api/messages", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ content, chatId, replyToId }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.error || "Failed to send message");
//       }

//       return data.data;
//     } catch (error) {
//       console.error("[messageSlice] Error sending message:", error);
//       return rejectWithValue(error.message);
//     }
//   }
// );

// const messageSlice = createSlice({
//   name: "messages",
//   initialState: {
//     messagesByChat: {}, // Organize messages by chatId
//     loading: false,
//     error: null,
//   },
//   reducers: {
//     addMessage: (state, action) => {
//       const message = action.payload;
//       const chatId = message.chat?._id || message.chat;

//       if (!state.messagesByChat[chatId]) {
//         state.messagesByChat[chatId] = [];
//       }
//       state.messagesByChat[chatId].push(message);
//     },
//     updateMessage: (state, action) => {
//       const message = action.payload;
//       const chatId = message.chat?._id || message.chat;
//       const messageId = message._id;

//       if (state.messagesByChat[chatId]) {
//         const index = state.messagesByChat[chatId].findIndex(
//           (msg) => msg._id === messageId
//         );
//         if (index !== -1) {
//           state.messagesByChat[chatId][index] = message;
//         }
//       }
//     },
//     deleteMessage: (state, action) => {
//       const { chatId, messageId } = action.payload;
//       // console.log(
//       //   "[messageSlice] Deleting message:",
//       //   messageId,
//       //   "from chat:",
//       //   chatId
//       // );
//       if (state.messagesByChat[chatId]) {
//         state.messagesByChat[chatId] = state.messagesByChat[chatId].filter(
//           (msg) => msg._id !== messageId
//         );
//       }
//     },
//     clearMessages: (state, action) => {
//       const chatId = action.payload;
//       // console.log("[messageSlice] Clearing all messages for chat:", chatId);
//       delete state.messagesByChat[chatId];
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchMessages.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchMessages.fulfilled, (state, action) => {
//         state.loading = false;
//         const { chatId, messages } = action.payload;

//         // Ensure we're using the string chat ID
//         if (messages?.length > 0) {
//           state.messagesByChat[chatId] = messages;
//         } else {
//           state.messagesByChat[chatId] = [];
//         }
//       })
//       .addCase(fetchMessages.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       .addCase(sendMessage.fulfilled, (state, action) => {
//         const message = action.payload;
//         const chatId = message.chat?._id || message.chat;

//         if (!state.messagesByChat[chatId]) {
//           state.messagesByChat[chatId] = [];
//         }
//         state.messagesByChat[chatId].push(message);
//       });
//   },
// });

// export const { addMessage, updateMessage, deleteMessage, clearMessages } =
//   messageSlice.actions;

// // Selectors with debugging
// export const selectMessagesByChatId = (state, chatId) => {
//   return state.messages.messagesByChat[chatId] || [];
// };
// export const selectMessagesLoading = (state) => state.messages.loading;
// export const selectMessagesError = (state) => state.messages.error;

// export default messageSlice.reducer;
