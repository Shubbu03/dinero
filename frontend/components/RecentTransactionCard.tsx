import { Transaction } from "@/lib/apiService";
import { ArrowUpRight, ArrowDownLeft, History, Plus } from "lucide-react";
import router from "next/router";

interface RecentTransactionCardProps {
  transactions: Transaction[];
  currentUserID: number;
}
const RecentTransactionCard: React.FC<RecentTransactionCardProps> = ({
  transactions,
  currentUserID,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold" style={{ color: "#000000" }}>
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
          {transactions.slice(0, 4).map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 rounded-lg"
              style={{ backgroundColor: "#F8F8F8" }}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.sender_id === currentUserID
                      ? "bg-red-100"
                      : "bg-green-100"
                  }`}
                >
                  {transaction.sender_id === currentUserID ? (
                    <ArrowUpRight className="w-5 h-5 text-red-600" />
                  ) : transaction.receiver_id === currentUserID ? (
                    <ArrowDownLeft className="w-5 h-5 text-green-600" />
                  ) : transaction.type === "self" ? (
                    <Plus className="w-5 h-5 text-green-600" />
                  ) : null}
                </div>
                <div>
                  <p className="font-medium" style={{ color: "#000000" }}>
                    {transaction.sender_id === currentUserID
                      ? `To ${transaction.receiver.name}`
                      : transaction.receiver_id === currentUserID
                      ? `From ${transaction.sender.name}`
                      : transaction.type === "self"
                      ? `Self`
                      : null}
                  </p>
                  <p className="text-sm" style={{ color: "#B6B09F" }}>
                    {new Date(transaction.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`font-semibold ${
                    transaction.sender_id === currentUserID
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {transaction.sender_id === currentUserID ? "-" : "+"}$
                  {(transaction.amount / 100).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentTransactionCard;
