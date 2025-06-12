"use client";

import Loading from "@/components/Loading";
import Pagination from "@/components/Pagination";
import { useCurrentUser } from "@/lib/hooks/useAuth";
import { useTransactionHistory } from "@/lib/hooks/useTransactions";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  History,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { updateCurrency } from "@/lib/currency";

const ITEMS_PER_PAGE = 6;

export default function TransactionHistory() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: user,
    isLoading: userLoading,
    error: userError,
  } = useCurrentUser();

  const { data: transactionData, isLoading: transactionsLoading } =
    useTransactionHistory(currentPage, ITEMS_PER_PAGE);

  const transactions = transactionData?.transactions || [];
  const totalPages = transactionData?.total
    ? Math.ceil(transactionData.total / ITEMS_PER_PAGE)
    : 1;

  if (userLoading || transactionsLoading) {
    return <Loading />;
  }

  if (userError || !user) {
    return null;
  }

  const currentUserID = user.id;
  const currency = user.currency || "USD";

  return (
    <div
      className="min-h-screen flex flex-col items-center"
      style={{ backgroundColor: "#F2F2F2" }}
    >
      <header
        className="bg-white shadow-sm border-b w-full mb-6"
        style={{ borderColor: "#EAE4D5" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1
              className="text-2xl font-bold cursor-pointer"
              style={{ color: "#000000" }}
            >
              dinero
            </h1>
          </div>
        </div>
      </header>
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-[1370px] mx-4 sm:mx-6 lg:mx-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center px-2 py-2 rounded-full hover:bg-gray-100 transition cursor-pointer"
              aria-label="Back to Dashboard"
              type="button"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
            </button>
            <h3
              className="text-xl font-semibold ml-2"
              style={{ color: "#000000" }}
            >
              Your Transactions
            </h3>
          </div>
        </div>
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <History className="w-12 h-12 mb-4" style={{ color: "#B6B09F" }} />
            <p className="text-sm" style={{ color: "#B6B09F" }}>
              No transactions yet. Start sending money to see your history!
            </p>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-100 bg-[#F8F8F8] hover:shadow transition-shadow"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                      transaction.type === "self"
                        ? "bg-green-100"
                        : transaction.sender_id === currentUserID
                        ? "bg-red-100"
                        : "bg-green-100"
                    }`}
                  >
                    {transaction.type === "self" ? (
                      <Plus className="w-5 h-5 text-green-600" />
                    ) : transaction.sender_id === currentUserID ? (
                      <ArrowUpRight className="w-5 h-5 text-red-600" />
                    ) : transaction.receiver_id === currentUserID ? (
                      <ArrowDownLeft className="w-5 h-5 text-green-600" />
                    ) : null}
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: "#000000" }}>
                      {transaction.type === "self"
                        ? `Self`
                        : transaction.sender_id === currentUserID
                        ? `To ${transaction.receiver.name}`
                        : transaction.receiver_id === currentUserID
                        ? `From ${transaction.sender.name}`
                        : null}
                    </p>
                    <div>
                      <p className="text-xs" style={{ color: "#B6B09F" }}>
                        {new Date(transaction.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {(() => {
                    const { amount, symbol } = updateCurrency(
                      transaction.amount / 100,
                      currency
                    );
                    return (
                      <p
                        className={`font-semibold text-lg ${
                          transaction.type === "self"
                            ? "text-green-600"
                            : transaction.sender_id === currentUserID
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {transaction.type === "self" || transaction.receiver_id === currentUserID ? "+" : "-"}
                        {symbol}
                        {amount.toFixed(2)}
                      </p>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        className="mt-6"
      />
    </div>
  );
}
