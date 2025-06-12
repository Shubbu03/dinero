"use client";

import apiService, { UserData } from "@/lib/apiService";
import { User, ChevronDown, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction } from "react";
import Image from "next/image";
import { useUpdateUserCurrency } from "@/lib/hooks/useUsers";

interface ProfileProps {
  user: UserData | null;
  showProfileDropdown: boolean;
  setShowProfileDropdown: Dispatch<SetStateAction<boolean>>;
}

const Profile: React.FC<ProfileProps> = ({
  user,
  showProfileDropdown,
  setShowProfileDropdown,
}) => {
  const router = useRouter();
  const { mutate: updateCurrency } = useUpdateUserCurrency();
  const handleLogout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      router.push("/");
    }
  };

  const getUserImg = () => {
    return user?.auth_provider === "email" ? (
      <User className="w-5 h-5" style={{ color: "#000000" }} />
    ) : (
      <Image
        height={40}
        width={40}
        src={user?.avatar || "/user.svg"}
        alt="User Avatar"
        className="rounded-full object-cover w-10 h-10"
        style={{ background: "#fff" }}
      />
    );
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowProfileDropdown(!showProfileDropdown)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors hover:bg-gray-50 cursor-pointer"
        style={{ color: "#000000" }}
      >
        {getUserImg()}
        <span className="text-sm font-medium">{user?.name}</span>
        <ChevronDown className="w-4 h-4" style={{ color: "#B6B09F" }} />
      </button>

      {showProfileDropdown && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b" style={{ borderColor: "#EAE4D5" }}>
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#EAE4D5" }}
              >
                {getUserImg()}
              </div>
              <div>
                <p className="font-medium" style={{ color: "#000000" }}>
                  {user?.name}
                </p>
                <p className="text-sm" style={{ color: "#B6B09F" }}>
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: "#B6B09F" }}>
                  Account Type
                </span>
                <span
                  className="text-sm font-medium capitalize"
                  style={{ color: "#000000" }}
                >
                  {user?.auth_provider}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: "#B6B09F" }}>
                  Preferred Currency
                </span>
                <select
                  className="text-sm font-medium capitalize border rounded px-1 py-1 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  style={{ color: "#000000", background: "#fff" }}
                  value={user?.currency}
                  onChange={(e) => {
                    updateCurrency(e.target.value);
                  }}
                >
                  <option value="USD">USD - $</option>
                  <option value="INR">INR - ₹</option>
                  <option value="GBP">GBP - £</option>
                </select>
              </div>
            </div>

            <hr className="my-2" style={{ borderColor: "#EAE4D5" }} />

            <div className="space-y-1">
              <button
                onClick={() => {
                  setShowProfileDropdown(false);
                  handleLogout();
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-left rounded-lg transition-colors hover:bg-red-50 cursor-pointer"
                style={{ color: "#000000" }}
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
