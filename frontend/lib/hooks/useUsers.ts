"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiService from "../apiService";

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
