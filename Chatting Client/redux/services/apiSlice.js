// redux/services/apiSlice.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
export const apiSlice = createApi({
  reducerPath: "apiSlice",
  baseQuery: fetchBaseQuery({
    credentials: "include",
    prepareHeaders: (headers, { endpoint }) => {
      if (endpoint === "register") {
        headers.delete("Content-Type");
      } else {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("accessToken"))?.[1];

        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
      }
      return headers;
    },
  }),
  tagTypes: ["Auth", "DynamicType", 'User', 'Chat', 'Message'],
  endpoints: (builder) => ({}),
});
