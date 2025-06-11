"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiService, {
  AddCardRequest,
  AddMoneyWithCardRequest,
} from "../apiService";
import { authKeys } from "./useAuth";
import { transactionKeys } from "./useTransactions";

export const cardKeys = {
  all: ["cards"] as const,
  lists: () => [...cardKeys.all, "list"] as const,
  list: (filters: string) => [...cardKeys.lists(), { filters }] as const,
  details: () => [...cardKeys.all, "detail"] as const,
  detail: (id: number) => [...cardKeys.details(), id] as const,
} as const;

export const useCards = () => {
  return useQuery({
    queryKey: cardKeys.lists(),
    queryFn: () => apiService.getCards(),
  });
};

export const useAddCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cardData: AddCardRequest) => apiService.addCard(cardData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.all });
    },
    onError: (error) => {
      console.error("Failed to add card:", error);
    },
  });
};

export const useDeleteCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cardId: number) => apiService.deleteCard(cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.all });
    },
    onError: (error) => {
      console.error("Failed to delete card:", error);
    },
  });
};

export const useAddMoneyWithCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AddMoneyWithCardRequest) =>
      apiService.addMoneyWithCard(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.all });
      queryClient.invalidateQueries({ queryKey: authKeys.balance });
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser });
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    },
    onError: (error) => {
      console.error("Failed to add money with card:", error);
    },
  });
};
