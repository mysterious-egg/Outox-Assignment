import {
  Clock3,
  Mail,
  PenSquare,
  Send,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import UserProfile from "./UserProfile";

function AppSidebar() {
  const navigate = useNavigate();

  return (
    <aside className="flex h-screen w-[260px] flex-col border-r border-[#e8e8e8] bg-white px-4 py-5">
      {/* User Profile */}
      <UserProfile />

      {/* Compose */}
      <button
        onClick={() => navigate("/compose")}
        className="mb-6 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#1f8f5f] text-sm font-semibold text-white transition hover:bg-[#18774e]"
      >
        <PenSquare size={17} />
        Compose
      </button>

      {/* Navigation */}
      <nav className="space-y-1">
        <NavLink
          to="/scheduled"
          className={({ isActive }) =>
            `flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${
              isActive
                ? "bg-[#edf8f2] text-[#1f8f5f]"
                : "text-[#666] hover:bg-[#f7f7f7]"
            }`
          }
        >
          <Clock3 size={18} />
          Scheduled
        </NavLink>

        <NavLink
          to="/sent"
          className={({ isActive }) =>
            `flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${
              isActive
                ? "bg-[#edf8f2] text-[#1f8f5f]"
                : "text-[#666] hover:bg-[#f7f7f7]"
            }`
          }
        >
          <Send size={18} />
          Sent
        </NavLink>
      </nav>

      {/* Bottom branding */}
      <div className="mt-auto border-t border-[#eeeeee] pt-5">
        <div className="flex items-center gap-2 px-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#1f8f5f]">
            <Mail size={14} className="text-white" />
          </div>

          <span className="text-sm font-semibold text-[#333]">
            ReachInbox
          </span>
        </div>
      </div>
    </aside>
  );
}

export default AppSidebar;