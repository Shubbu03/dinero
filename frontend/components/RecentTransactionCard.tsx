import { Transaction } from "@/lib/apiService";
import { ArrowUpRight, ArrowDownLeft, History, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateCurrency } from "@/lib/currency";

interface RecentTransactionCardProps {
  transactions: Transaction[];
  currentUserID: number;
  currency: string;
}
const RecentTransactionCard: React.FC<RecentTransactionCardProps> = ({
  transactions,
  currentUserID,
  currency
}) => {
  const router = useRouter();

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-semibold" style={{ color: "#000000" }}>
          Recent Transactions
        </h3>
        <button
          onClick={() => router.push("/transaction-history")}
          className="text-xs sm:text-sm font-medium hover:underline cursor-pointer"
          style={{ color: "#B6B09F" }}
        >
          View All
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <History
            className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4"
            style={{ color: "#B6B09F" }}
          />
          <p className="text-xs sm:text-sm px-4" style={{ color: "#B6B09F" }}>
            No transactions yet. Start sending money to see your history!
          </p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {transactions.slice(0, 4).map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 sm:p-4 rounded-lg"
              style={{ backgroundColor: "#F8F8F8" }}
            >
              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    transaction.type === "self"
                      ? "bg-green-100"
                      : transaction.sender_id === currentUserID
                      ? "bg-red-100"
                      : "bg-green-100"
                  }`}
                >
                  {transaction.type === "self" ? (
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  ) : transaction.sender_id === currentUserID ? (
                    <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                  ) : transaction.receiver_id === currentUserID ? (
                    <ArrowDownLeft className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm sm:text-base truncate" style={{ color: "#000000" }}>
                    {transaction.type === "self"
                      ? `Self`
                      : transaction.sender_id === currentUserID
                      ? `To ${transaction.receiver.name}`
                      : transaction.receiver_id === currentUserID
                      ? `From ${transaction.sender.name}`
                      : null}
                  </p>
                  <p className="text-xs sm:text-sm" style={{ color: "#B6B09F" }}>
                    {new Date(transaction.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                {(() => {
                  const { amount, symbol } = updateCurrency(transaction.amount / 100, currency);
                  return (
                    <p
                      className={`font-semibold text-sm sm:text-base ${
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
  );
};

export default RecentTransactionCard;
