import { useNavigate, useLocation } from "react-router-dom";
import { Home, BookOpen, ClipboardCheck, LogOut, UserRound, X, LayoutDashboard, ListChevronsUpDown } from "lucide-react";
import useAuthStore from "../store/authStore";
import { toast } from "sonner";
import wceLogo from '../assets/WCElogo.png';

export default function StudentSidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const selectedAcademicYear = useAuthStore((state) => state.selectedAcademicYear) || "AY 2026-27";

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const menuItems = [
    { name: "Dashboard", path: "/student/home", icon: LayoutDashboard },
    { name: "Elective Preferences", path: "/student/preferences", icon: ListChevronsUpDown },
    { name: "My Status", path: "/student/status", icon: ClipboardCheck },
  ];

  // Get user initials for avatar
  const getInitials = (name) => {
    if (!name) return "S";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside
        className={`w-[280px] md:w-100 bg-[#1E3D4F] text-slate-300 flex flex-col h-screen fixed left-0 top-0 z-50 border-r border-slate-800 transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-18 sm:h-18 flex items-center justify-center flex-shrink-0">
              <img src={wceLogo} alt="WCE Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="font-bold text-white text-xs sm:text-sm md:text-base tracking-wide leading-tight">WCE Open Elective Portal</h2>
              <p className="text-[10px] sm:text-[12px] text-slate-400 font-medium">Dept. of Computer Science and Engineering</p>
              <span className="inline-flex mt-1 bg-[#68c3d4]/10 text-[#68c3d4] text-[10px] sm:text-[12px] font-bold uppercase px-1.5 py-0.5 rounded border border-[#68c3d4]/20 tracking-wider">
                {selectedAcademicYear}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl md:hidden cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => {
                  navigate(item.path);
                  if (onClose) onClose();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-md font-semibold transition-all duration-200 cursor-pointer ${isActive
                  ? "bg-[#68c3d4]/15 text-white shadow-inner border-l-4 border-[#68c3d4] pl-3"
                  : "hover:bg-slate-800/40 hover:text-white"
                  }`}
              >
                <Icon size={25} className={isActive ? "text-[#68c3d4]" : "text-slate-400"} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Profile Section */}
        <div className="p-4 border-t border-slate-800/60 space-y-4">
          {/* User Card */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-13 h-13 rounded-xl bg-gradient-to-tr from-[#568ea3] to-[#68c3d4] flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-[#568ea3]/20">
              {<UserRound size={30} />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-white text-md truncate leading-tight">{user?.name || "Student"}</h4>
              <p className="text-[15px] text-slate-400 truncate mt-0.5">PRN: {user?.prn}</p>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs 
            text-red-300 
            font-medium 
            bg-red-100/5
            border border-gray-600
            
            hover:border-rose-300 hover:text-rose-300
            transition-colors duration-200 ease-in-out cursor-pointer"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

