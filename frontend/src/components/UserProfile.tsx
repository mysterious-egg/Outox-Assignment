import { useState } from "react";
import {
  ChevronDown,
  LogOut,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function UserProfile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] =
    useState(false);

  const initial =
    user?.name?.charAt(0).toUpperCase() ||
    user?.email?.charAt(0).toUpperCase() ||
    "U";

  async function handleLogout() {
    try {
      setLoggingOut(true);

      await logout();

      navigate("/login");
    } finally {
      setLoggingOut(false);
      setOpen(false);
    }
  }

  if (!user) {
    return null;
  }

  return (
    <div className="relative mb-6">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 rounded-xl border border-[#e8e8e8] px-3 py-2.5 text-left transition hover:bg-[#fafafa]"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1f8f5f] text-sm font-semibold text-white">
          {initial}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#333]">
            {user.name || "Google User"}
          </p>

          <p className="truncate text-xs text-[#8c8c8c]">
            {user.email}
          </p>
        </div>

        <ChevronDown
          size={16}
          className={`text-[#888] transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-xl border border-[#e8e8e8] bg-white shadow-lg">
          <div className="border-b border-[#eeeeee] px-4 py-3">
            <div className="flex items-center gap-2">
              <User
                size={15}
                className="text-[#777]"
              />

              <p className="truncate text-sm font-medium text-[#444]">
                {user.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut size={17} />

            {loggingOut
              ? "Logging out..."
              : "Logout"}
          </button>
        </div>
      )}
    </div>
  );
}

export default UserProfile;