import socketService from "@/services/socketService";
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  token: null,
  isLoggedIn: false,
  isLoading: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      // console.log("Setting credentials:", action.payload?.token);
      state.user = {
        ...state.user,
        ...action.payload,
      };
      state.isLoggedIn = true;
      state.isLoading = false;
      state.token = action.payload?.token;
    },
    clearCredentials: (state) => {
      socketService.disconnect();
      state.user = null;
      state.token = null;
      state.isLoggedIn = false;
      state.isLoading = false;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setCredentials, clearCredentials, setLoading } =
  authSlice.actions;
export default authSlice.reducer;
