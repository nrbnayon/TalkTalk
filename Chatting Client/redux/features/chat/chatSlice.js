// redux/features/chat/chatSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const fetchChats = createAsyncThunk(
  "chat/fetchChats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/chat");
      if (!response.ok) {
        throw new Error("Failed to fetch chats");
      }
      const data = await response.json();
      console.log("Get my chat", data);
      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch chats");
    }
  }
);

export const accessChat = createAsyncThunk(
  "chat/accessChat",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to access chat");
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to access chat");
    }
  }
);

export const updateChatPin = createAsyncThunk(
  "chat/updateChatPin",
  async ({ chatId, action }, { rejectWithValue, getState }) => {
    try {
      const response = await fetch(`/api/chat/${chatId}?action=pin`, {
        method: "PATCH",
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(
          error.message || "Failed to update chat pin status"
        );
      }

      const data = await response.json();

      // Get current user ID
      const { auth } = getState();
      const currentUserId = auth.user?._id;

      // Add isPinned flag based on pinnedBy array
      return {
        ...data.data,
        isPinned: data.data.pinnedBy?.includes(currentUserId),
      };
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to update chat pin status"
      );
    }
  }
);

export const blockUnblockChat = createAsyncThunk(
  "chat/blockUnblockChat",
  async (chatId, { rejectWithValue, getState }) => {
    try {
      const response = await fetch(`/api/chat/${chatId}?action=block`, {
        method: "PATCH",
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(
          error.message || "Failed to update block status"
        );
      }

      const data = await response.json();

      // Get current user ID
      const { auth } = getState();
      const currentUserId = auth.user?._id;

      // Add isBlocked flag based on blockedBy array
      return {
        ...data.data,
        isBlocked: data.data.blockedBy?.includes(currentUserId),
      };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update block status");
    }
  }
);

export const deleteChat = createAsyncThunk(
  "chat/deleteChat",
  async (chatId, { rejectWithValue }) => {
    try {
      // Update to use the new action-based endpoint for "soft" delete
      const response = await fetch(`/api/chat/${chatId}?action=delete`, {
        method: "PATCH",
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message || "Failed to delete chat");
      }

      return chatId;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete chat");
    }
  }
);

const initialState = {
  chats: [],
  selectedChat: null,
  loading: false,
  error: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    selectChat: (state, action) => {
      state.selectedChat = action.payload;
    },
    updateChatHidden: (state, action) => {
      const { chatId, isHidden } = action.payload;
      const chatIndex = state.chats.findIndex((chat) => chat._id === chatId);
      if (chatIndex !== -1) {
        state.chats[chatIndex].isHidden = isHidden;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Chats
      .addCase(fetchChats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.loading = false;
        state.chats = action.payload;
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch chats";
      })
      // Access Chat
      .addCase(accessChat.fulfilled, (state, action) => {
        const exists = state.chats.find(
          (chat) => chat._id === action.payload._id
        );
        if (!exists) {
          state.chats.unshift(action.payload);
        }
        state.selectedChat = action.payload;
      });

    builder
      .addCase(updateChatPin.fulfilled, (state, action) => {
        const updatedChat = action.payload;
        state.chats = state.chats.map((chat) =>
          chat._id === updatedChat._id ? updatedChat : chat
        );
        if (state.selectedChat && state.selectedChat._id === updatedChat._id) {
          state.selectedChat = updatedChat;
        }
      })
      .addCase(blockUnblockChat.fulfilled, (state, action) => {
        const chatIndex = state.chats.findIndex(
          (chat) => chat._id === action.payload._id
        );
        if (chatIndex !== -1) {
          state.chats[chatIndex] = action.payload;

          if (
            state.selectedChat &&
            state.selectedChat._id === action.payload._id
          ) {
            state.selectedChat = action.payload;
          }
        }
      })
      // Update the delete case to handle the new soft delete
      .addCase(deleteChat.fulfilled, (state, action) => {
        const chatId = action.payload;
        state.chats = state.chats.filter((chat) => chat._id !== chatId);
        if (state.selectedChat && state.selectedChat._id === chatId) {
          state.selectedChat = null;
        }
      });
  },
});

export const { selectChat, updateChatHidden } = chatSlice.actions;
export default chatSlice.reducer;

// // redux\features\chat\chatSlice.js
// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axios from "../../../utils/axiosConfig";

// export const fetchChats = createAsyncThunk(
//   "chat/fetchChats",
//   async (_, { rejectWithValue }) => {
//     try {
//       const response = await axios.get("/chat");
//       console.log("Get my chat", response);
//       return response.data.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data || "Failed to fetch chats");
//     }
//   }
// );

// export const accessChat = createAsyncThunk(
//   "chat/accessChat",
//   async (userId, { rejectWithValue }) => {
//     try {
//       const response = await axios.post("/chat/new", { userId });
//       return response.data.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data || "Failed to access chat");
//     }
//   }
// );

// // New action for updating chat
// export const updateChatPin = createAsyncThunk(
//   "chat/updateChatPin",
//   async ({ chatId, isPinned }, { rejectWithValue }) => {
//     try {
//       const response = await axios.patch(`/chat/${chatId}`, { isPinned });
//       return response.data.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data || "Failed to update chat");
//     }
//   }
// );

// // New action for deleting chat
// export const deleteChat = createAsyncThunk(
//   "chat/deleteChat",
//   async (chatId, { rejectWithValue }) => {
//     try {
//       await axios.delete(`/chat/${chatId}`);
//       return chatId;
//     } catch (error) {
//       return rejectWithValue(error.response?.data || "Failed to delete chat");
//     }
//   }
// );

// const initialState = {
//   chats: [],
//   selectedChat: null,
//   loading: false,
//   error: null,
// };

// const chatSlice = createSlice({
//   name: "chat",
//   initialState,
//   reducers: {
//     selectChat: (state, action) => {
//       state.selectedChat = action.payload;
//     },
//     updateChatHidden: (state, action) => {
//       const { chatId, isHidden } = action.payload;
//       const chatIndex = state.chats.findIndex((chat) => chat._id === chatId);
//       if (chatIndex !== -1) {
//         state.chats[chatIndex].isHidden = isHidden;
//       }
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // Fetch Chats
//       .addCase(fetchChats.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchChats.fulfilled, (state, action) => {
//         state.loading = false;
//         state.chats = action.payload;
//       })
//       .addCase(fetchChats.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload || "Failed to fetch chats";
//       })
//       // Access Chat
//       .addCase(accessChat.fulfilled, (state, action) => {
//         const exists = state.chats.find(
//           (chat) => chat._id === action.payload._id
//         );
//         if (!exists) {
//           state.chats.unshift(action.payload);
//         }
//         state.selectedChat = action.payload;
//       })
//       // Update Chat Pin
//       .addCase(updateChatPin.fulfilled, (state, action) => {
//         const chatIndex = state.chats.findIndex(
//           (chat) => chat._id === action.payload._id
//         );
//         if (chatIndex !== -1) {
//           state.chats[chatIndex] = action.payload;
//         }
//       })
//       // Delete Chat
//       .addCase(deleteChat.fulfilled, (state, action) => {
//         state.chats = state.chats.filter((chat) => chat._id !== action.payload);
//         if (state.selectedChat?._id === action.payload) {
//           state.selectedChat = null;
//         }
//       });
//   },
// });

// export const { selectChat, updateChatHidden } = chatSlice.actions;
// export default chatSlice.reducer;
