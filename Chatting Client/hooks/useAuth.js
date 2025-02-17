// hooks\useAuth.js
import {
  useLoginMutation,
  useLogoutMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
} from "@/redux/features/auth/authApiSlice";

export const useAuth = () => {
  const [loginMutation] = useLoginMutation();
  const [verifyOtpMutation] = useVerifyOtpMutation();
  const [resendOtpMutation] = useResendOtpMutation();
  const [logoutMutation] = useLogoutMutation();

  const login = async (email, password) => {
    try {
      const result = await loginMutation({ email, password }).unwrap();

      if (!result.success) {
        return { success: false, error: result.error || "Login failed" };
      }

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error:
          error.data?.message ||
          error.message ||
          "Not found, please try again or register again",
      };
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      const result = await verifyOtpMutation({ email, otp }).unwrap();
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error.data?.message || "Verification failed",
      };
    }
  };

  const resendOtp = async (email) => {
    try {
      const result = await resendOtpMutation({ email }).unwrap();
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error.data?.message || "Verification failed",
      };
    }
  };

  const logout = async () => {
    try {
      const result = await logoutMutation().unwrap();

      if (!result.success) {
        return { success: false, error: result.error || "Logout failed" };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error.data?.message || "An unexpected error occurred during logout",
      };
    }
  };

  return { login, verifyOtp, resendOtp, logout };
};
