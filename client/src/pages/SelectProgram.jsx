import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  GraduationCap,
  LogOut,
  BookOpen,
  Layers,
  Wrench,
  ChevronDown,
  ArrowRight,
  Shield
} from "lucide-react";
import useAuthStore from "../store/authStore";

export default function SelectProgram() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const selectProgram = useAuthStore((state) => state.selectProgram);

  const [academicYear, setAcademicYear] = useState("AY 2026-27");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const years = ["AY 2026-27", "AY 2025-26", "AY 2024-25"];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handleEnterPortal = (programName) => {
    if (programName !== "Open Elective I") {
      toast.error("This portal is not active yet.");
      return;
    }

    // Save selection in the Zustand state & localStorage
    selectProgram(programName, academicYear);
    toast.success(`Accessing ${programName} portal`);

    if (user?.role === "coordinator") {
      navigate("/admin/dashboard");
    } else {
      navigate("/student/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f9fc] flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#568ea3]/10 flex items-center justify-center text-[#568ea3]">
              <GraduationCap size={22} />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-lg leading-tight">WCE Elective Portal</h1>
              <p className="text-xs text-slate-400">Walchand College of Engineering, Sangli</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Role Badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#568ea3]/15 text-[#568ea3]">
              {user?.role === "coordinator" ? (
                <>
                  <Shield size={14} /> Coordinator
                </>
              ) : (
                <>
                  <GraduationCap size={14} /> Student
                </>
              )}
            </span>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 rounded-xl hover:bg-slate-50 transition-colors border border-slate-200"
            >
              <LogOut size={15} /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-xl mb-10">
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">
            Select a Program
          </h2>
          <p className="text-slate-500 text-sm">
            Choose the academic year and program you want to access.
          </p>
        </div>

        {/* Academic Year Dropdown Selector */}
        <div className="flex flex-col items-center mb-12 relative" ref={dropdownRef}>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Academic Year
          </span>

          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-full border border-slate-200 hover:border-slate-300 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#568ea3]/20"
          >
            <span className="font-semibold text-slate-700 text-sm">{academicYear}</span>
            {academicYear === "AY 2026-27" && (
              <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ml-1">
                Current
              </span>
            )}
            <ChevronDown size={16} className="text-slate-400" />
          </button>

          {/* Dropdown Options */}
          {dropdownOpen && (
            <div className="absolute top-20 z-50 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => {
                    setAcademicYear(year);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-50 flex items-center justify-between ${
                    academicYear === year ? "text-[#568ea3] bg-[#568ea3]/5" : "text-slate-700"
                  }`}
                >
                  <span>{year}</span>
                  {year === "AY 2026-27" && (
                    <span className="bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase px-1 py-0.5 rounded">
                      Current
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Program Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
          {/* Card 1: Open Elective I */}
          <div className="bg-white rounded-3xl border-t-4 border-[#568ea3] shadow-md border-x border-b border-slate-100 p-8 flex flex-col justify-between min-h-[320px] transition-all hover:shadow-lg hover:-translate-y-1 duration-300">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#568ea3]/10 flex items-center justify-center text-[#568ea3]">
                  <BookOpen size={24} />
                </div>
                <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  Open
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">Open Elective I</h3>
              <p className="text-[#568ea3] text-xs font-semibold mb-4">
                Semester 7 · A.Y. 2026-27
              </p>
              <p className="text-slate-500 text-sm leading-relaxed">
                Select and rank your elective preferences for Semester 7. Allocations are based on availability and priority.
              </p>
            </div>
            <div className="pt-6 mt-auto">
              <button
                onClick={() => handleEnterPortal("Open Elective I")}
                className="inline-flex items-center gap-1.5 text-[#568ea3] hover:text-[#457283] font-bold text-sm transition-colors group cursor-pointer"
              >
                Enter Portal{" "}
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>
            </div>
          </div>

          {/* Card 2: Open Elective II */}
          <div className="bg-white/80 rounded-3xl border-t-4 border-slate-200 shadow-sm border-x border-b border-slate-100 p-8 flex flex-col justify-between min-h-[320px]">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <Layers size={24} />
                </div>
                <span className="bg-slate-100 text-slate-500 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  Coming Soon
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-400 mb-1">Open Elective II</h3>
              <p className="text-slate-300 text-xs font-semibold mb-4">
                Semester 8 · A.Y. 2026-27
              </p>
              <p className="text-slate-400 text-sm leading-relaxed">
                Elective preference submission for Semester 8 will be available closer to the start of the semester.
              </p>
            </div>
            <div className="pt-6 mt-auto">
              <span className="text-slate-300 font-medium text-sm">Not available yet</span>
            </div>
          </div>

          {/* Card 3: Mini-Project */}
          <div className="bg-white/80 rounded-3xl border-t-4 border-slate-200 shadow-sm border-x border-b border-slate-100 p-8 flex flex-col justify-between min-h-[320px]">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <Wrench size={24} />
                </div>
                <span className="bg-slate-100 text-slate-500 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  Coming Soon
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-400 mb-1">Mini-Project</h3>
              <p className="text-slate-300 text-xs font-semibold mb-4">
                Semester 7-8 · A.Y. 2026-27
              </p>
              <p className="text-slate-400 text-sm leading-relaxed">
                Mini-project group formation and guide allocation portal will open at the start of Semester 7.
              </p>
            </div>
            <div className="pt-6 mt-auto">
              <span className="text-slate-300 font-medium text-sm">Not available yet</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-100 bg-white">
        Department of Computer Science & Engineering · Academic Year 2026-27
      </footer>
    </div>
  );
}
