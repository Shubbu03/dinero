import { UserData } from "@/lib/apiService";
import { User2Icon, UserX, Send } from "lucide-react";
import { useState } from "react";
import SendMoneyModal from "./SendMoneyModal";
import { useUserBalance } from "@/lib/hooks/useAuth";
import { useRemoveFriend } from "@/lib/hooks/useUsers";

interface FriendsCardProps {
  friends: UserData[];
}
const FriendsCard: React.FC<FriendsCardProps> = ({ friends }) => {
  const [showSendMoneyModal, setShowSendMoneyModal] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<UserData | null>(null);
  const { data: balanceData } = useUserBalance();
  const currentBalance = balanceData?.balance || 0;
  const removeFriendMutation = useRemoveFriend();
  const [popoverOpenId, setPopoverOpenId] = useState<number | null>(null);

  const handleSendMoney = (friend: UserData) => {
    setSelectedFriend(friend);
    setShowSendMoneyModal(true);
  };

  const handleRemoveFriend = (friendId: number) => {
    removeFriendMutation.mutate(friendId, {
      onSuccess: () => setPopoverOpenId(null),
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold" style={{ color: "#000000" }}>
          My Friends
        </h3>
      </div>

      {friends.length === 0 ? (
        <div className="text-center py-12">
          <User2Icon
            className="w-12 h-12 mx-auto mb-4"
            style={{ color: "#B6B09F" }}
          />
          <p className="text-sm" style={{ color: "#B6B09F" }}>
            You don&apos;t have any friends.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {friends.map((friend) => (
            <div
              key={friend.id}
              className="flex items-center justify-between bg-[#F8F8F8] rounded-xl px-4 py-3 shadow-sm"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-[#EAE4D5] flex items-center justify-center font-bold text-lg">
                  {friend.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <span className="font-medium text-gray-900">{friend.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className="bg-black hover:bg-gray-800 hover:scale-105 text-[#F2F2F2] px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow cursor-pointer"
                  type="button"
                  onClick={() => handleSendMoney(friend)}
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
                <div className="relative">
                  <button
                    className="p-2 rounded-lg hover:bg-red-100 hover:scale-105 transition cursor-pointer"
                    type="button"
                    aria-label="Remove Friend"
                    onClick={() =>
                      setPopoverOpenId(
                        popoverOpenId === friend.id ? null : friend.id
                      )
                    }
                  >
                    <UserX className="w-5 h-5 text-red-500" />
                  </button>
                  {popoverOpenId === friend.id && (
                    <div
                      className="absolute right-0 z-10 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg p-4 flex flex-col items-center space-y-3"
                      style={{ minWidth: 200 }}
                    >
                      <span className="text-sm text-gray-900 text-center">
                        Remove <b>{friend.name}</b> from friends?
                      </span>
                      <div className="flex space-x-2 w-full">
                        <button
                          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
                          onClick={() => setPopoverOpenId(null)}
                        >
                          Cancel
                        </button>
                        <button
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
                          onClick={() => handleRemoveFriend(friend.id)}
                          disabled={removeFriendMutation.isPending}
                        >
                          {removeFriendMutation.isPending
                            ? "Removing..."
                            : "Remove"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <SendMoneyModal
        isOpen={showSendMoneyModal}
        onClose={() => setShowSendMoneyModal(false)}
        currentBalance={currentBalance}
        preselectedUser={selectedFriend}
      />
    </div>
  );
};

export default FriendsCard;
