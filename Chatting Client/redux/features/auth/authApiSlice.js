// redux\features\auth\authApiSlice.js
import { apiSlice } from "@/redux/services/apiSlice";
import { setCredentials, clearCredentials } from "./authSlice";
import logger from "@/utils/logger";

export const authApiSlice = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => {
        return {
          url: "/api/login",
          method: "POST",
          body: credentials,
        };
      },
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          if (data.success) {
            const accessToken = data.data?.accessToken;

            if (accessToken) {
              const decodedToken = JSON.parse(atob(accessToken.split(".")[1]));
              const user = {
                token: accessToken,
                _id: decodedToken.id,
                role: decodedToken.role,
                email: decodedToken.email,
                name: decodedToken.name,
              };
              // console.log("User data from access token:::::", user);
              dispatch(setCredentials(user));
            } else {
              logger.warn("Login successful but no access token received");
            }
          } else {
            logger.warn(
              "Login response indicates failure:",
              data.result?.error
            );
          }
        } catch (error) {
          logger.error("Login error:", error);
        }
      },
      invalidatesTags: ["Auth"],
    }),

    register: builder.mutation({
      query: (userData) => {
        const formData =
          userData instanceof FormData
            ? userData
            : Object.keys(userData).reduce((fd, key) => {
                fd.append(key, userData[key]);
                return fd;
              }, new FormData());

        return {
          url: "/api/register",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Auth"],
    }),

    verifyOtp: builder.mutation({
      query: (otpData) => ({
        url: "/api/otp-verify",
        method: "POST",
        body: otpData,
      }),
      invalidatesTags: ["Auth"],
    }),

    resendOtp: builder.mutation({
      query: (email) => ({
        url: "/api/otp-resend",
        method: "POST",
        body: email,
      }),
      invalidatesTags: ["Auth"],
    }),

    logout: builder.mutation({
      query: () => {
        logger.debug("Logout attempt");
        return {
          url: "/api/logout",
          method: "POST",
        };
      },
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          logger.debug("Logout request started");
          const { data } = await queryFulfilled;
          logger.debug("Logout response received:", data);

          if (data.result?.success) {
            logger.info("Logout successful, clearing credentials");
            dispatch(clearCredentials());
          } else {
            logger.warn(
              "Logout response indicates failure:",
              data.result?.error
            );
          }
        } catch (error) {
          logger.error("Logout error:", error);
        }
      },
      invalidatesTags: ["Auth"],
    }),

    loggedInUser: builder.query({
      query: () => {
        return {
          url: `/api/user`,
          method: "GET",

          headers: {
            "Content-Type": "application/json;charset=UTF-8",
          },
        };
      },
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const { data } = await queryFulfilled;
          // console.log("data from my profile api...:", data.user);
          if (data.success) {
            dispatch(setCredentials(data.user));
          }
        } catch {
          dispatch(clearCredentials());
        }
      },
      invalidatesTags: ["Auth"],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useLogoutMutation,
  useLoggedInUserQuery,
} = authApiSlice;
