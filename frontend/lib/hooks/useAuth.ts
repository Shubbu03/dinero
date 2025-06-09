"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiService, { LoginRequest, SignupRequest } from "../apiService";

export const authKeys = {
  currentUser: ["auth", "currentUser"] as const,
  balance: ["auth", "balance"] as const,
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: authKeys.currentUser,
    queryFn: () => apiService.getCurrentUser(),
    retry: (failureCount, error: unknown) => {
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "status" in error.response &&
        error.response.status === 401
      ) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export const useUserBalance = () => {
  return useQuery({
    queryKey: authKeys.balance,
    queryFn: () => apiService.getUserBalance(),
    retry: (failureCount, error: unknown) => {
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "status" in error.response &&
        error.response.status === 401
      ) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => apiService.login(credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser });
      queryClient.invalidateQueries({ queryKey: authKeys.balance });
    },
  });
};

export const useSignup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: SignupRequest) => apiService.signup(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser });
      queryClient.invalidateQueries({ queryKey: authKeys.balance });
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiService.logout(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
};

export const useRefreshToken = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiService.refreshToken(),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
};
