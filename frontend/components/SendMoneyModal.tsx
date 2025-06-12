"use client";

import { useState, useEffect } from "react";
import { X, Send, User, Search } from "lucide-react";
import { UserData } from "@/lib/apiService";
import { useSearchUsers } from "@/lib/hooks/useUsers";
import { useSendMoney } from "@/lib/hooks/useTransactions";
import { notify } from "@/lib/notify";
import { updateCurrency, convertToUSD, getCurrencySymbol } from "@/lib/currency";

interface SendMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  currency: string;
  preselectedUser?: UserData | null;
}

export default function SendMoneyModal({
  isOpen,
  onClose,
  currentBalance,
  currency,
  preselectedUser = null,
}: SendMoneyModalProps) {
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState(preselectedUser?.name || "");
  const [selectedRecipient, setSelectedRecipient] = useState<UserData | null>(
    preselectedUser
  );
  const [note, setNote] = useState("");

  const { data: searchResults = [], isLoading: searchLoading } =
    useSearchUsers(recipient);
  const sendMoneyMutation = useSendMoney();

  useEffect(() => {
    setRecipient(preselectedUser?.name || "");
    setSelectedRecipient(preselectedUser);
  }, [preselectedUser, isOpen]);

  const handleAmountChange = (value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleRecipientSearch = (searchTerm: string) => {
    setRecipient(searchTerm);
    if (selectedRecipient && !searchTerm.includes(selectedRecipient.name)) {
      setSelectedRecipient(null);
    }
  };

  const handleSelectRecipient = (user: UserData) => {
    setSelectedRecipient(user);
    setRecipient(user.name);
  };

  const handleSendMoney = async () => {
    if (!selectedRecipient || !amount || parseFloat(amount) <= 0) {
      return;
    }

    const amountInUserCurrency = parseFloat(amount);
    const amountInUSD = convertToUSD(amountInUserCurrency, currency);
    const amountInCents = Math.round(amountInUSD * 100);
    
    if (amountInCents > currentBalance) {
      notify("Insufficient balance", "warn");
      return;
    }

    try {
      await sendMoneyMutation.mutateAsync({
        recipientId: selectedRecipient.id,
        amount: amountInCents,
        note: note || undefined,
      });

      setAmount("");
      setRecipient("");
      setSelectedRecipient(null);
      setNote("");
      onClose();

      notify("Money sent successfully!", "success");
    } catch (error) {
      console.error("Failed to send money:", error);
      notify("Failed to send money. Please try again.", "error");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[100vh] flex flex-col transform transition-transform duration-300 ${
          isOpen ? "scale-100" : "scale-95"
        }`}
        style={{ backgroundColor: "#FFFFFF" }}
      >
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: "#EAE4D5" }}
        >
          <h2 className="text-xl font-semibold" style={{ color: "#000000" }}>
            Send Money
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-gray-100"
          >
            <X className="w-5 h-5" style={{ color: "#B6B09F" }} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div
            className="p-4 rounded-xl mb-4"
            style={{ backgroundColor: "#F8F8F8" }}
          >
            <p className="text-sm" style={{ color: "#B6B09F" }}>
              Available Balance
            </p>
            {(() => {
              const { amount, symbol } = updateCurrency(currentBalance / 100, currency);
              return (
                <p className="text-2xl font-bold" style={{ color: "#000000" }}>
                  {symbol}{amount.toFixed(2)}
                </p>
              );
            })()}
          </div>

          <div className="space-y-2">
            <label
              className="block text-sm font-medium"
              style={{ color: "#000000" }}
            >
              Send to
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-5 h-5" style={{ color: "#B6B09F" }} />
              </div>
              <input
                type="text"
                value={recipient}
                onChange={(e) => handleRecipientSearch(e.target.value)}
                placeholder="Search by name or email"
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none"
                style={{ borderColor: "#EAE4D5" }}
              />
            </div>

            {(searchResults.length > 0 || searchLoading) && (
              <div
                className="border rounded-lg shadow-sm"
                style={{ borderColor: "#EAE4D5" }}
              >
                {searchLoading ? (
                  <div className="p-3 text-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-300 mx-auto"></div>
                  </div>
                ) : (
                  searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectRecipient(user)}
                      className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "#EAE4D5" }}
                      >
                        <User
                          className="w-5 h-5"
                          style={{ color: "#000000" }}
                        />
                      </div>
                      <div className="text-left">
                        <p className="font-medium" style={{ color: "#000000" }}>
                          {user.name}
                        </p>
                        <p className="text-sm" style={{ color: "#B6B09F" }}>
                          {user.email}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label
              className="block text-sm font-medium"
              style={{ color: "#000000" }}
            >
              Amount
            </label>
            <div className="relative">
              <span
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lg font-medium"
                style={{ color: "#000000" }}
              >
                {getCurrencySymbol(currency)}
              </span>
              <input
                type="text"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none"
                style={{ borderColor: "#EAE4D5" }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              className="block text-sm font-medium"
              style={{ color: "#000000" }}
            >
              Note (Optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What's this for?"
              rows={3}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none resize-none"
              style={{ borderColor: "#EAE4D5" }}
            />
          </div>

          <button
            onClick={handleSendMoney}
            disabled={
              !selectedRecipient ||
              !amount ||
              parseFloat(amount) <= 0 ||
              sendMoneyMutation.isPending
            }
            className="w-full bg-black text-white py-3 rounded-lg font-medium transition-all hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            style={{
              backgroundColor: "#000000",
              color: "#F2F2F2",
            }}
          >
            {sendMoneyMutation.isPending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>
                  Send {getCurrencySymbol(currency)}{amount || "0.00"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
