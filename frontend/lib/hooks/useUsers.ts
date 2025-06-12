"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiService, { UserData } from "../apiService";
import { authKeys } from "./useAuth";

export const userKeys = {
  all: ["users"] as const,
  search: (query: string) => ["users", "search", query] as const,
  friends: ["users", "friends"] as const,
};

export const useSearchUsers = (query: string) => {
  return useQuery({
    queryKey: userKeys.search(query),
    queryFn: () => apiService.searchUsers(query),
    enabled: query.length >= 3,
    staleTime: 1000 * 60 * 2,
  });
};

export const useFriends = () => {
  return useQuery({
    queryKey: userKeys.friends,
    queryFn: () => apiService.getFriends(),
  });
};

export const useAddFriend = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (friendId: number) => apiService.addFriend(friendId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.friends });
    },
  });
};

export const useRemoveFriend = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (friendId: number) => apiService.removeFriend(friendId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.friends });
    },
  });
};

export const useUpdateUserCurrency = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (currency: string) => apiService.updateUserCurrency(currency),
    onSuccess: (_data, currency) => {
      queryClient.setQueryData(
        authKeys.currentUser,
        (oldUserData: UserData | undefined) => {
          if (oldUserData && typeof oldUserData === "object") {
            return { ...oldUserData, currency };
          }
          return oldUserData;
        }
      );

      queryClient.invalidateQueries({ queryKey: authKeys.currentUser });
    },
    onError: (error) => {
      console.error("Failed to update currency:", error);
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser });
    },
  });
};
