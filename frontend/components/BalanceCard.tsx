import { Wallet, Send, Plus, Search } from "lucide-react";
import AddMoneyModal from "./AddMoneyModal";
import FindFriendsModal from "./FindFriendsModal";
import SendMoneyModal from "./SendMoneyModal";
import { useState } from "react";

interface BalanceCardProps {
  balance: number;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ balance }) => {
  const [showSendMoneyModal, setShowSendMoneyModal] = useState(false);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [showFindFriendsModal, setShowFindFriendsModal] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold" style={{ color: "#000000" }}>
            ${(balance / 100).toFixed(2)}
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
          className="flex items-center justify-center space-x-3 p-4 rounded-xl transition-all hover:scale-105 cursor-pointer"
          style={{ backgroundColor: "#000000", color: "#F2F2F2" }}
        >
          <Send className="w-5 h-5" />
          <span className="font-medium">Send Money</span>
        </button>

        <button
          onClick={() => setShowAddMoneyModal(true)}
          disabled={balance >= 200000}
          aria-label={
            balance >= 200000
              ? "Cannot add money when balance exceeds $1000"
              : "Add money to your wallet"
          }
          className="flex items-center justify-center space-x-3 p-4 rounded-xl transition-all hover:scale-105 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: "#EAE4D5", color: "#000000" }}
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Add Money</span>
        </button>

        <button
          onClick={() => setShowFindFriendsModal(true)}
          className="flex items-center justify-center space-x-3 p-4 rounded-xl transition-all hover:scale-105 cursor-pointer"
          style={{ backgroundColor: "#F8F8F8", color: "#000000" }}
        >
          <Search className="w-5 h-5" />
          <span className="font-medium">Find Friends</span>
        </button>
      </div>

      <SendMoneyModal
        isOpen={showSendMoneyModal}
        onClose={() => setShowSendMoneyModal(false)}
        currentBalance={balance || 0}
      />

      <AddMoneyModal
        isOpen={showAddMoneyModal}
        onClose={() => setShowAddMoneyModal(false)}
        currentBalance={balance || 0}
      />

      <FindFriendsModal
        isOpen={showFindFriendsModal}
        onClose={() => setShowFindFriendsModal(false)}
      />
    </div>
  );
};

export default BalanceCard;
