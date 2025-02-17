// components\AuthProvider\AuthProvider.js
"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useLoggedInUserQuery } from "@/redux/features/auth/authApiSlice";
import { setLoading } from "@/redux/features/auth/authSlice";
import logger from "@/utils/logger";

export function AuthProvider({ children }) {
  const dispatch = useDispatch();
  const { refetch } = useLoggedInUserQuery();

  useEffect(() => {
    refetch()
      .then(() => dispatch(setLoading(false)))
      .catch((error) => {
        logger.error("Auth initialization failed:", error);
        dispatch(setLoading(false));
      });
  }, [refetch, dispatch]);

  return children;
}
