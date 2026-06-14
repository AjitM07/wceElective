import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  GraduationCap,
  LogOut,
  BookOpen,
  Layers,
  Wrench,
  BrainCircuit,
  ChevronDown,
  ArrowRight,
  Shield
} from "lucide-react";
import wceLogo from '../assets/WCElogo.png';
import useAuthStore from "../store/authStore";
import api from "../api/axios";

export default function SelectProgram() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const selectProgram = useAuthStore((state) => state.selectProgram);

  const [academicYear, setAcademicYear] = useState("AY 2026-27");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [coordDropdownOpen, setCoordDropdownOpen] = useState(false);
  const coordDropdownRef = useRef(null);

  const [portalSettings, setPortalSettings] = useState({
    "Open Elective I": true,
    "Open Elective II": false,
    "Mini-Project": false
  });
  const [loading, setLoading] = useState(true);

  const years = ["AY 2026-27", "AY 2025-26", "AY 2024-25"];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (coordDropdownRef.current && !coordDropdownRef.current.contains(event.target)) {
        setCoordDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchPortalSettings = async () => {
      try {
        const res = await api.get("/portal-settings");
        if (res.data.success) {
          const settingsMap = {};
          res.data.data.forEach(item => {
            settingsMap[item.name] = !!item.is_accessible;
          });
          setPortalSettings(settingsMap);
        }
      } catch (err) {
        console.error("Failed to load portal settings", err);
        toast.error("Failed to load portal settings from server.");
      } finally {
        setLoading(false);
      }
    };
    fetchPortalSettings();
  }, []);

  useEffect(() => {
    if (user && user.role !== "coordinator") {
      setAcademicYear("AY 2026-27");
    }
  }, [user]);

  const handleTogglePortal = async (name, currentStatus) => {
    try {
      const res = await api.post("/portal-settings", {
        name,
        is_accessible: !currentStatus
      });
      if (res.data.success) {
        toast.success(`Portal '${name}' is now ${!currentStatus ? 'accessible' : 'inaccessible'} for students.`);
        setPortalSettings(prev => ({
          ...prev,
          [name]: !currentStatus
        }));
      } else {
        toast.error(res.data.message || "Failed to update portal status.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to toggle portal status.");
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handleEnterPortal = (programName) => {
    if (user?.role !== "coordinator") {
      if (academicYear !== "AY 2026-27") {
        toast.error(`Portal is not active for ${academicYear}.`);
        return;
      }

      if (!portalSettings[programName]) {
        toast.error("This portal is not active yet.");
        return;
      }
    }

    // Save selection in the Zustand state & localStorage
    selectProgram(programName, academicYear);
    toast.success(`${programName} selected successfully`);

    if (user?.role === "coordinator") {
      navigate("/admin/dashboard");
    } else {
      if (user?.details_verified) {
        navigate("/student/dashboard");
      } else {
        navigate("/student/confirm-details");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f9fc]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#568ea3", borderTopColor: "transparent" }}></div>
          <p className="text-slate-500 font-medium animate-pulse">Loading portal configuration...</p>
        </div>
      </div>
    );
  }

  const isOEI = !!portalSettings["Open Elective I"];
  const isOEII = !!portalSettings["Open Elective II"];
  const isMP = !!portalSettings["Mini-Project"];

  return (
    <div className="min-h-screen bg-[#f4f9fc] flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0">
              <img src={wceLogo} alt="WCE Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-sm sm:text-lg leading-tight">WCE Open Elective Portal</h1>
              <p className="text-[10px] sm:text-xs text-slate-400 hidden md:block">Department of Computer Science and Engineering</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Role Badge / Coordinator Dropdown */}
            {user?.role === "coordinator" ? (
              <div className="relative" ref={coordDropdownRef}>
                <button
                  onClick={() => setCoordDropdownOpen(!coordDropdownOpen)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-full text-xs font-semibold bg-[#568ea3]/15 text-[#568ea3] hover:bg-[#568ea3]/25 transition-all focus:outline-none border border-[#568ea3]/20 cursor-pointer"
                  title="Toggle Student Access"
                >
                  <Shield size={14} />
                  <span>Coordinator Menu</span>
                  <ChevronDown size={12} className={`transition-transform duration-200 ${coordDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {coordDropdownOpen && (
                  <div className="absolute right-0 mt-2 z-50 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 animate-in fade-in slide-in-from-top-2 duration-200 text-left">
                    <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2">Student Portal Access</h3>
                    <p className="text-[10px] text-slate-400 mb-3 text-left">Control which elective portals are active for students.</p>
                    <div className="space-y-2.5">
                      {Object.keys(portalSettings).map((name) => {
                        const val = portalSettings[name];
                        return (
                          <div key={name} className="flex items-center justify-between py-1.5 px-2 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-xs font-bold text-slate-700">{name}</span>
                            <button
                              onClick={() => handleTogglePortal(name, val)}
                              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${val ? 'bg-[#568ea3]' : 'bg-slate-200'
                                }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${val ? 'translate-x-4' : 'translate-x-0'
                                  }`}
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-full text-xs font-semibold bg-[#568ea3]/15 text-[#568ea3]">
                <GraduationCap size={14} />
                <span className="hidden sm:inline">Student</span>
              </span>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-1.5 text-sm font-medium text-slate-600 rounded-xl hover:bg-slate-50 transition-colors border border-slate-200"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-xl mb-10">
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">
            Select a Program
          </h2>
          {user?.role === "student" && (
            <div className="flex items-center justify-center gap-4 sm:gap-8 max-w-md mx-auto pb-4 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#568ea3] text-white flex items-center justify-center text-xs font-bold shadow-md shadow-[#568ea3]/20">
                  1
                </div>
                <span className="text-xs font-bold text-slate-800">Program</span>
              </div>
              <div className="h-0.5 w-12 bg-slate-200 rounded"></div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <span className="text-xs font-semibold text-slate-400">Profile</span>
              </div>
              <div className="h-0.5 w-12 bg-slate-200 rounded"></div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <span className="text-xs font-semibold text-slate-400">Preferences</span>
              </div>
            </div>
          )}
        </div>

        {/* Academic Year Selector */}
        <div className="flex flex-col items-center mb-12 relative" ref={dropdownRef}>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Academic Year
          </span>

          {user?.role === "coordinator" ? (
            <>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-full border border-slate-200 hover:border-slate-300 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#568ea3]/20 cursor-pointer"
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
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-50 flex items-center justify-between cursor-pointer ${
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
            </>
          ) : (
            <div className="flex items-center gap-2 bg-slate-50 px-5 py-2.5 rounded-full border border-slate-200/60 shadow-sm">
              <span className="font-semibold text-slate-600 text-sm">AY 2026-27</span>
              <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ml-1">
                Current
              </span>
            </div>
          )}
        </div>

        {/* Program Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
          {/* Card 1: Open Elective I */}
          <div className={`rounded-3xl border-t-4 shadow-sm border-x border-b border-slate-100 p-8 flex flex-col justify-between min-h-[320px] transition-all ${isOEI
            ? "bg-white border-[#568ea3] shadow-md hover:shadow-lg hover:-translate-y-1 duration-300"
            : "bg-white/80 border-slate-200 opacity-80"
            }`}>
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isOEI ? "bg-[#568ea3]/10 text-[#568ea3]" : "bg-slate-100 text-slate-400"
                  }`}>
                  <BookOpen size={24} />
                </div>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${isOEI
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                  : "bg-slate-100 text-slate-500"
                  }`}>
                  {isOEI ? "Open" : "Coming Soon"}
                </span>
              </div>
              <h3 className={`text-xl font-bold mb-1 ${isOEI ? "text-slate-800" : "text-slate-400"}`}>Open Elective I</h3>
              <p className={`text-xs font-semibold mb-4 ${isOEI ? "text-[#568ea3]" : "text-slate-300"}`}>
                Semester 5 · A.Y. 2026-27
              </p>
              <p className={`text-sm leading-relaxed ${isOEI ? "text-slate-500" : "text-slate-400"}`}>
                Select and rank your elective preferences for Semester 5.
              </p>
            </div>
            <div className="pt-6 mt-auto">
              {isOEI ? (
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
              ) : (
                <button
                  onClick={() => handleEnterPortal("Open Elective I")}
                  className="inline-flex items-center gap-1.5 text-slate-300 hover:text-slate-400 font-medium text-sm transition-colors cursor-pointer"
                >
                  Not available yet{" "}
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Card 2: Open Elective II */}
          <div className={`rounded-3xl border-t-4 shadow-sm border-x border-b border-slate-100 p-8 flex flex-col justify-between min-h-[320px] transition-all ${isOEII
            ? "bg-white border-[#568ea3] shadow-md hover:shadow-lg hover:-translate-y-1 duration-300"
            : "bg-white/80 border-slate-200 opacity-80"
            }`}>
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isOEII ? "bg-[#568ea3]/10 text-[#568ea3]" : "bg-slate-100 text-slate-400"
                  }`}>
                  <BookOpen size={24} />
                </div>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${isOEII
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                  : "bg-slate-100 text-slate-500"
                  }`}>
                  {isOEII ? "Open" : "Coming Soon"}
                </span>
              </div>
              <h3 className={`text-xl font-bold mb-1 ${isOEII ? "text-slate-800" : "text-slate-400"}`}>Open Elective II</h3>
              <p className={`text-xs font-semibold mb-4 ${isOEII ? "text-[#568ea3]" : "text-slate-300"}`}>
                Semester 6 · A.Y. 2026-27
              </p>
              <p className={`text-sm leading-relaxed ${isOEII ? "text-slate-500" : "text-slate-400"}`}>
                Elective preference submission for Semester 6.
              </p>
            </div>
            <div className="pt-6 mt-auto">
              {isOEII ? (
                <button
                  onClick={() => handleEnterPortal("Open Elective II")}
                  className="inline-flex items-center gap-1.5 text-[#568ea3] hover:text-[#457283] font-bold text-sm transition-colors group cursor-pointer"
                >
                  Enter Portal{" "}
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </button>
              ) : (
                <button
                  onClick={() => handleEnterPortal("Open Elective II")}
                  className="inline-flex items-center gap-1.5 text-slate-300 hover:text-slate-400 font-medium text-sm transition-colors cursor-pointer"
                >
                  Not available yet{" "}
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Card 3: Mini-Project */}
          <div className={`rounded-3xl border-t-4 shadow-sm border-x border-b border-slate-100 p-8 flex flex-col justify-between min-h-[320px] transition-all ${isMP
            ? "bg-white border-[#568ea3] shadow-md hover:shadow-lg hover:-translate-y-1 duration-300"
            : "bg-white/80 border-slate-200 opacity-80"
            }`}>
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isMP ? "bg-[#568ea3]/10 text-[#568ea3]" : "bg-slate-100 text-slate-400"
                  }`}>
                  <BrainCircuit size={24} />
                </div>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${isMP
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                  : "bg-slate-100 text-slate-500"
                  }`}>
                  {isMP ? "Open" : "Coming Soon"}
                </span>
              </div>
              <h3 className={`text-xl font-bold mb-1 ${isMP ? "text-slate-800" : "text-slate-400"}`}>Mini-Project</h3>
              <p className={`text-xs font-semibold mb-4 ${isMP ? "text-[#568ea3]" : "text-slate-300"}`}>
                Semester 5-6 · A.Y. 2026-27
              </p>
              <p className={`text-sm leading-relaxed ${isMP ? "text-slate-500" : "text-slate-400"}`}>
                Mini-project group formation and guide allocation portal.
              </p>
            </div>
            <div className="pt-6 mt-auto">
              {isMP ? (
                <button
                  onClick={() => handleEnterPortal("Mini-Project")}
                  className="inline-flex items-center gap-1.5 text-[#568ea3] hover:text-[#457283] font-bold text-sm transition-colors group cursor-pointer"
                >
                  Enter Portal{" "}
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </button>
              ) : (
                <button
                  onClick={() => handleEnterPortal("Mini-Project")}
                  className="inline-flex items-center gap-1.5 text-slate-300 hover:text-slate-400 font-medium text-sm transition-colors cursor-pointer"
                >
                  Not available yet{" "}
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-100 bg-white">
        WCE Sangli · Department of Computer Science & Engineering
      </footer>
    </div>
  );
}
