"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiService from "../apiService";
import { authKeys } from "./useAuth";

export const transactionKeys = {
  all: ["transactions"] as const,
  history: (page?: number, limit?: number) =>
    ["transactions", "history", { page, limit }] as const,
};

export const useTransactionHistory = (page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: transactionKeys.history(page, limit),
    queryFn: () => apiService.getTransactionHistory(page, limit),
    enabled: page > 0 && limit > 0,
  });
};

export const useSendMoney = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      recipientId,
      amount,
      note,
    }: {
      recipientId: number;
      amount: number;
      note?: string;
    }) => apiService.sendMoney(recipientId, amount, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: authKeys.balance });
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser });
    },
  });
};

export const useAddMoney = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (amount: number) => apiService.addMoney(amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: authKeys.balance });
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser });
    },
  });
};
