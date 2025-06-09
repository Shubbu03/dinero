import apiService, { UserData } from "@/lib/apiService";
import { User, ChevronDown, Settings, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction } from "react";

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
  const handleLogout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      router.push("/");
    }
  };
  return (
    <div className="relative cursor-pointer">
      <button
        onClick={() => setShowProfileDropdown(!showProfileDropdown)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors hover:bg-gray-50"
        style={{ color: "#000000" }}
      >
        <User className="w-5 h-5" style={{ color: "#B6B09F" }} />
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
                <User className="w-5 h-5" style={{ color: "#000000" }} />
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

          <div className="p-2">
            <div className="px-3 py-2">
              <div className="flex justify-between mb-2">
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
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: "#B6B09F" }}>
                  User ID
                </span>
                <span
                  className="text-sm font-medium"
                  style={{ color: "#000000" }}
                >
                  #{user?.id}
                </span>
              </div>
            </div>

            <hr className="my-2" style={{ borderColor: "#EAE4D5" }} />

            <button
              onClick={() => {
                setShowProfileDropdown(false);
                // Add settings navigation when ready
              }}
              className="w-full flex items-center space-x-2 px-3 py-2 text-left rounded-lg transition-colors hover:bg-gray-50"
              style={{ color: "#000000" }}
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm">Settings</span>
            </button>

            <button
              onClick={() => {
                setShowProfileDropdown(false);
                handleLogout();
              }}
              className="w-full flex items-center space-x-2 px-3 py-2 text-left rounded-lg transition-colors hover:bg-gray-50"
              style={{ color: "#000000" }}
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
