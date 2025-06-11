"use client";

import { useState } from "react";
import { X, Search, UserPlus, UserMinus, Users } from "lucide-react";
import {
  useSearchUsers,
  useFriends,
  useAddFriend,
  useRemoveFriend,
} from "@/lib/hooks/useUsers";
import { UserData } from "@/lib/apiService";
import { notify } from "@/lib/notify";

interface FindFriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FindFriendsModal({
  isOpen,
  onClose,
}: FindFriendsModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: searchResults = [], isLoading: searchLoading } =
    useSearchUsers(searchTerm);
  const { data: friends = [] } = useFriends();
  const addFriendMutation = useAddFriend();
  const removeFriendMutation = useRemoveFriend();

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleToggleFriend = async (user: UserData) => {
    try {
      const isFriend = friends.some((friend) => friend.id === user.id);

      if (isFriend) {
        await removeFriendMutation.mutateAsync(user.id);
        notify("Friend removed successfully!", "success");
      } else {
        await addFriendMutation.mutateAsync(user.id);
        notify("Friend added successfully!", "success");
      }
    } catch (error) {
      console.error("Failed to toggle friend:", error);
      notify("Failed to update friend status. Please try again.", "error");
    }
  };

  const FriendCard = ({ user }: { user: UserData }) => {
    const isFriend = friends.some((friend) => friend.id === user.id);
    const isToggling =
      addFriendMutation.isPending || removeFriendMutation.isPending;

    return (
      <div
        className="flex items-center justify-between p-4 rounded-lg"
        style={{ backgroundColor: "#F8F8F8" }}
      >
        <div className="flex items-center space-x-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#EAE4D5" }}
          >
            <Users className="w-6 h-6" style={{ color: "#000000" }} />
          </div>
          <div>
            <p className="font-medium" style={{ color: "#000000" }}>
              {user.name}
            </p>
            <p className="text-sm" style={{ color: "#B6B09F" }}>
              {user.email}
            </p>
          </div>
        </div>
        <button
          onClick={() => handleToggleFriend(user)}
          disabled={isToggling}
          className="flex items-center space-x-1 px-3 py-2 rounded-lg transition-all hover:scale-105 disabled:opacity-50"
          style={{
            backgroundColor: isFriend ? "#EAE4D5" : "#000000",
            color: isFriend ? "#000000" : "#F2F2F2",
          }}
        >
          {isToggling ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current cursor-pointer"></div>
          ) : isFriend ? (
            <>
              <UserMinus className="w-4 h-4" />
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span className="text-sm">Add</span>
            </>
          )}
        </button>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: "#EAE4D5" }}
        >
          <h2 className="text-xl font-semibold" style={{ color: "#000000" }}>
            Find Friends
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-gray-100"
          >
            <X className="w-5 h-5" style={{ color: "#B6B09F" }} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label
              className="block text-sm font-medium"
              style={{ color: "#000000" }}
            >
              Search for friends
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-5 h-5" style={{ color: "#B6B09F" }} />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by name or email"
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none"
                style={{ borderColor: "#EAE4D5" }}
              />
            </div>
          </div>

          {searchTerm.length > 2 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium" style={{ color: "#000000" }}>
                Search Results
              </h3>
              {searchLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-900 border-t-transparent" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <FriendCard key={user.id} user={user} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm" style={{ color: "#B6B09F" }}>
                    No users found matching &quot;{searchTerm}&quot;
                  </p>
                </div>
              )}
            </div>
          )}

          {friends.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium" style={{ color: "#000000" }}>
                Your Friends
              </h3>
              <div className="space-y-2">
                {friends.slice(0, 5).map((user) => (
                  <FriendCard key={user.id} user={user} />
                ))}
              </div>
              {friends.length > 5 && (
                <p className="text-xs text-center" style={{ color: "#B6B09F" }}>
                  And {friends.length - 5} more friends...
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div
              className="text-center p-4 rounded-lg"
              style={{ backgroundColor: "#F8F8F8" }}
            >
              <p className="text-2xl font-bold" style={{ color: "#000000" }}>
                {friends.length}
              </p>
              <p className="text-sm" style={{ color: "#B6B09F" }}>
                Total Friends
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
