"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiService, { UserData, Transaction } from "../../lib/apiService";
import AuthWrapper from "@/components/AuthWrapper";
import Profile from "@/components/Profile";
import Loading from "@/components/Loading";
import BalanceCard from "@/components/BalanceCard";
import RecentTransactionCard from "@/components/RecentTransactionCard";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

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
    return <Loading />;
  }

  if (!user) {
    return null;
  }

  return (
    <AuthWrapper requireAuth={true}>
      <div className="min-h-screen" style={{ backgroundColor: "#F2F2F2" }}>
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
          <BalanceCard balance={user?.balance} />
          <RecentTransactionCard transactions={transactions} />
        </div>

        {showProfileDropdown && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowProfileDropdown(false)}
          />
        )}

      </div>
    </AuthWrapper>
  );
}
