"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  Send,
  Plus,
  History,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import apiService, { UserData, Transaction } from "../../lib/apiService";
import AuthWrapper from "../../components/AuthWrapper";
import SendMoneyModal from "../../components/SendMoneyModal";
import AddMoneyModal from "../../components/AddMoneyModal";
import FindFriendsModal from "../../components/FindFriendsModal";
import Profile from "@/components/Profile";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showSendMoneyModal, setShowSendMoneyModal] = useState(false);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [showFindFriendsModal, setShowFindFriendsModal] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await apiService.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchTransactions = async () => {
      try {
        const transactionData = await apiService.getTransactionHistory(1, 10);
        setTransactions(transactionData.transactions || []);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      }
    };

    fetchUserData();
    fetchTransactions();
  }, [router]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#F2F2F2" }}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AuthWrapper requireAuth={true}>
      <div className="min-h-screen" style={{ backgroundColor: "#F2F2F2" }}>
        {/* Header */}
        <header
          className="bg-white shadow-sm border-b"
          style={{ borderColor: "#EAE4D5" }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1
                className="text-2xl font-bold cursor-pointer"
                style={{ color: "#000000" }}
              >
                paytm
              </h1>

              <Profile
                user={user}
                showProfileDropdown={showProfileDropdown}
                setShowProfileDropdown={setShowProfileDropdown}
              />
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Balance Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold" style={{ color: "#000000" }}>
                  ${(user.balance / 100).toFixed(2)}
                </h2>
                <p className="text-sm" style={{ color: "#B6B09F" }}>
                  Available Balance
                </p>
              </div>
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#EAE4D5" }}
              >
                <Wallet className="w-8 h-8" style={{ color: "#000000" }} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => setShowSendMoneyModal(true)}
                className="flex items-center justify-center space-x-3 p-4 rounded-xl transition-all hover:scale-105"
                style={{ backgroundColor: "#000000", color: "#F2F2F2" }}
              >
                <Send className="w-5 h-5" />
                <span className="font-medium">Send Money</span>
              </button>

              <button
                onClick={() => setShowAddMoneyModal(true)}
                className="flex items-center justify-center space-x-3 p-4 rounded-xl transition-all hover:scale-105"
                style={{ backgroundColor: "#EAE4D5", color: "#000000" }}
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Add Money</span>
              </button>

              <button
                onClick={() => setShowFindFriendsModal(true)}
                className="flex items-center justify-center space-x-3 p-4 rounded-xl transition-all hover:scale-105"
                style={{ backgroundColor: "#F8F8F8", color: "#000000" }}
              >
                <Search className="w-5 h-5" />
                <span className="font-medium">Find Friends</span>
              </button>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3
                className="text-xl font-semibold"
                style={{ color: "#000000" }}
              >
                Recent Transactions
              </h3>
              <button
                onClick={() => router.push("/history")}
                className="text-sm font-medium hover:underline"
                style={{ color: "#B6B09F" }}
              >
                View All
              </button>
            </div>

            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <History
                  className="w-12 h-12 mx-auto mb-4"
                  style={{ color: "#B6B09F" }}
                />
                <p className="text-sm" style={{ color: "#B6B09F" }}>
                  No transactions yet. Start sending money to see your history!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 6).map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg"
                    style={{ backgroundColor: "#F8F8F8" }}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.type === "sent"
                            ? "bg-red-100"
                            : "bg-green-100"
                        }`}
                      >
                        {transaction.type === "sent" ? (
                          <ArrowUpRight className="w-5 h-5 text-red-600" />
                        ) : (
                          <ArrowDownLeft className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: "#000000" }}>
                          {transaction.type === "sent"
                            ? `To ${transaction.to_user}`
                            : `From ${transaction.from_user}`}
                        </p>
                        <p className="text-sm" style={{ color: "#B6B09F" }}>
                          {new Date(transaction.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          transaction.type === "sent"
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {transaction.type === "sent" ? "-" : "+"}$
                        {(transaction.amount / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Click outside to close dropdown */}
        {showProfileDropdown && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowProfileDropdown(false)}
          />
        )}

        {/* Modals */}
        <SendMoneyModal
          isOpen={showSendMoneyModal}
          onClose={() => setShowSendMoneyModal(false)}
          currentBalance={user?.balance || 0}
        />

        <AddMoneyModal
          isOpen={showAddMoneyModal}
          onClose={() => setShowAddMoneyModal(false)}
          currentBalance={user?.balance || 0}
        />

        <FindFriendsModal
          isOpen={showFindFriendsModal}
          onClose={() => setShowFindFriendsModal(false)}
        />
      </div>
    </AuthWrapper>
  );
}
