"use client";

import { useState } from "react";
import AuthWrapper from "@/components/AuthWrapper";
import Profile from "@/components/Profile";
import Loading from "@/components/Loading";
import BalanceCard from "@/components/BalanceCard";
import RecentTransactionCard from "@/components/RecentTransactionCard";
import { useCurrentUser } from "@/lib/hooks/useAuth";
import { useTransactionHistory } from "@/lib/hooks/useTransactions";
import FriendsCard from "@/components/FriendsCard";
import { useFriends } from "@/lib/hooks/useUsers";

export default function DashboardPage() {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const {
    data: user,
    isLoading: userLoading,
    error: userError,
  } = useCurrentUser();
  const { data: transactionData, isLoading: transactionsLoading } =
    useTransactionHistory(1, 10);

  const { data: friends = [] } = useFriends();

  if (userLoading || transactionsLoading) {
    return <Loading />;
  }

  if (userError || !user) {
    return null;
  }

  const transactions = transactionData?.transactions || [];

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

        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3 flex flex-col gap-2">
              <BalanceCard balance={user.balance} />
              <RecentTransactionCard
                transactions={transactions}
                currentUserID={user.id}
              />
            </div>
            <div>
              <FriendsCard friends={friends} />
            </div>
          </div>
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
