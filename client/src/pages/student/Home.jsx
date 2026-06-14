import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  User,
  BookOpen,
  Calendar,
  Award,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertTriangle,
  Menu
} from "lucide-react";
import api from "../../api/axios";
import useAuthStore from "../../store/authStore";
import StudentSidebar from "../../components/StudentSidebar";

export default function StudentHome() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const selectedProgram = useAuthStore((state) => state.selectedProgram);

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("Hello");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [deadline, setDeadline] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [timeLeftShort, setTimeLeftShort] = useState("");
  const [allotmentPublished, setAllotmentPublished] = useState(false);
  const [allocation, setAllocation] = useState(null);
  const [showAllotmentModal, setShowAllotmentModal] = useState(false);

  const getSemesterText = () => {
    if (selectedProgram === "Open Elective II") return "Semester 6";
    if (selectedProgram === "Mini-Project") return "Semester 5-6";
    return "Semester 7"; // Defaults to Semester 7 to match mockup image
  };

  useEffect(() => {
    // Dynamic greeting based on time of day
    const hrs = new Date().getHours();
    if (hrs < 12) setGreeting("Good morning");
    else if (hrs < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  useEffect(() => {
    if (!deadline) return;
    const timer = setInterval(() => {
      const now = new Date();
      const diff = deadline - now;
      if (diff <= 0) {
        setTimeLeft("00:00:00 remaining");
        setTimeLeftShort("00:00:00 left");
        clearInterval(timer);
        return;
      }
      const totalHours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      const formatNum = (num) => String(num).padStart(2, "0");
      const timeStr = `${formatNum(totalHours)}:${formatNum(minutes)}:${formatNum(seconds)}`;

      setTimeLeft(`${timeStr} remaining`);
      setTimeLeftShort(`${timeStr} left`);
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/students/profile");
        if (res.data.success) {
          const profile = res.data.data.student;
          if (!profile.details_verified) {
            navigate("/student/confirm-details");
            return;
          }
          setStudent(profile);
          setAllotmentPublished(!!res.data.data.allotmentPublished);
          setAllocation(res.data.data.allocation || null);
          if (res.data.data.deadline) {
            setDeadline(new Date(res.data.data.deadline));
          }
        } else {
          toast.error(res.data.message || "Failed to load profile.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error connecting to server.");
        logout();
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [logout, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f9fc]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#568ea3", borderTopColor: "transparent" }}></div>
          <p className="text-slate-500 font-medium animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Get student first name for greeting
  const getFirstName = (fullName) => {
    if (!fullName) return "";
    return fullName.trim().split(/\s+/)[0];
  };

  return (
    <div className="min-h-screen bg-[#f4f9fc] flex font-sans w-full max-w-full overflow-x-hidden">
      {/* Sidebar */}
      <StudentSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Pane */}
      <div className="flex-1 md:pl-100 pl-0 min-h-screen flex flex-col w-full max-w-full overflow-x-hidden">
        {/* Header bar */}
        <header className="bg-white border-b border-slate-100 px-8 h-16 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-xl md:hidden cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-md font-bold text-slate-800 text-lg">Student Dashboard</h1>
              <p className="text-sm text-slate-400 font-semibold">Welcome back, {getFirstName(student?.name)}</p>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 md:p-8 p-4 max-w-5xl w-full mx-auto space-y-8">
          {/* Greeting and Deadline Box */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
                {greeting}, {getFirstName(student?.name)}
              </h2>
              <p className="text-md text-slate-400 font-semibold mt-1">
                Computer Science & Engineering <br /> Division {student?.division || "A"} &bull; {getSemesterText()}
              </p>
            </div>

            {/* Countdown Badge pill */}
            <div className="bg-[#FFEADB]/40 border border-[#FFEADB]/80 rounded-xl p-3 px-4 flex items-center gap-2.5 max-w-xs self-start md:self-auto">
              <Clock size={40} className="text-[#7F6456] flex-shrink-0" />
              <div>
                <span className="block text-[15px] text-slate-800 font-bold tracking-wider">Submission Deadline</span>
                <span className="text-sm font-black text-[#7F6456]">{timeLeft}</span>
              </div>
            </div>
          </div>

          {/* Action Banner Card */}
          {!student?.preferences_submitted ? (
            <div className="bg-[#FFD270]/20 border border-[#FFEADB]/60 rounded-2xl sm:rounded-xl p-6 sm:p-8 space-y-4 shadow-sm">
              <div className="flex items-start gap-3.5">
                <AlertTriangle className="text-[#FFA500] flex-shrink-0 mt-0.5" size={45} />
                <div className="space-y-1.5">
                  <h3 className="font-extrabold text-slate-800 text-md">Action Required: <br />Submit Your Elective Preferences</h3>
                  <p className="text-sm text-slate-500 leading-tight">
                    You have not yet submitted your elective preferences. The deadline is 30 August 2026.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate("/student/preferences")}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1E3E52] hover:bg-[#152C3B] font-bold text-xs text-white shadow-md shadow-[#1E3E52]/10 cursor-pointer transition-all active:translate-y-0"
              >
                <span>Submit Now</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div className="bg-emerald-50/20 border border-emerald-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
              <div className="flex items-start gap-3.5">
                <CheckCircle className="text-emerald-600 flex-shrink-0 mt-0.5" size={45} />
                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-800 text-md">Preferences Submitted Successfully</h3>
                  <p className="text-sm text-slate-500 leading-tight">
                    Your preferences are locked. They will be reviewed by the elective coordinator.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate("/student/preferences")}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#568EA3] hover:bg-[#48798e] font-bold text-xs text-white shadow-md shadow-[#568EA3]/15 cursor-pointer transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>View Preferences</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* Status Metrics Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* Card 1: Profile Status */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between min-h-[140px]">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <User size={18} />
              </div>
              <div className="mt-4">
                <span className="text-[15px] text-slate-400 font-bold tracking-wider block mt-0.5">Student Details</span>
                <span className="text-sm font-black text-slate-800 block">Verified</span>
                <span className="text-[12px] text-emerald-600 font-bold mt-1.5 block">All Details Verified</span>
              </div>
            </div>

            {/* Card 2: Preference Status */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between min-h-[140px]">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${student?.preferences_submitted
                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                : "bg-[#7F6456]/10 text-[#7F6456] border-[#7F6456]/15"
                }`}>
                <BookOpen size={18} />
              </div>
              <div className="mt-4">
                <span className="text-[15px] text-slate-400 font-bold tracking-wider block mt-0.5">Preference Status</span>
                <span className="text-sm font-black text-slate-800 block">
                  {student?.preferences_submitted ? "Submitted" : "Not Submitted"}
                </span>
                <span className={`text-[12px] font-bold mt-1.5 block ${student?.preferences_submitted ? "text-emerald-600" : "text-[#7F6456]"
                  }`}>
                  {student?.preferences_submitted ? "Complete" : "Action required"}
                </span>
              </div>
            </div>

            {/* Card 3: Submission Deadline */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between min-h-[140px]">
              <div className="w-10 h-10 rounded-xl bg-[#FFEADB]/40 text-[#7F6456] flex items-center justify-center border border-[#FFEADB]/80">
                <Calendar size={18} />
              </div>
              <div className="mt-4">
                <span className="text-[15px] text-slate-400 font-bold  tracking-wider block mt-0.5">Submission Deadline</span>
                <span className="text-sm font-black text-slate-800 block">30 August 2026</span>
                <span className="text-[12px] text-[#7F6456] font-bold mt-1.5 block">{timeLeftShort}</span>
              </div>
            </div>

            {/* Card 4: Allotment Status */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between min-h-[140px]">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${allotmentPublished && allocation
                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                  : "bg-[#1E3E52]/10 text-[#1E3E52] border-[#1E3E52]/15"
                }`}>
                <Award size={18} />
              </div>
              <div className="mt-4">
                <span className="text-[15px] text-slate-400 font-bold tracking-wider block mt-0.5">Allotment Status</span>
                <span className="text-sm font-black text-slate-800 block">
                  {allotmentPublished ? (allocation ? "Allocated" : "Not Allocated") : "Pending"}
                </span>
                <span className={`text-[12px] font-bold mt-1.5 block ${allotmentPublished && allocation ? "text-emerald-600" : "text-[#1E3E52]"
                  }`}>
                  {allotmentPublished ? (allocation ? allocation.elective_name : "Awaiting assignment") : "Results pending"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Navigation Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Navigation Card A: Set Preferences */}
            <button
              onClick={() => navigate("/student/preferences")}
              className="bg-[#568EA3] border border-[#406d7d] hover:bg-[#48798e] rounded-xl p-5 flex items-center justify-between text-left shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group text-white"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-white/15 text-white flex items-center justify-center border border-white/20">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xl">
                    {student?.preferences_submitted ? "View Submitted Preferences" : "Set Preferences"}
                  </h4>
                  <p className="text-s text-sky-100/80 font-semibold mt-0.5">
                    {student?.preferences_submitted ? "View your locked choices" : "Rank your elective choices"}
                  </p>
                </div>
              </div>
              <ArrowRight size={16} className="text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </button>

            {/* Navigation Card B: Allotment Result */}
            <button
              disabled={!allotmentPublished}
              onClick={() => {
                if (allotmentPublished) {
                  setShowAllotmentModal(true);
                }
              }}
              className={`w-full border p-5 flex items-center justify-between text-left rounded-xl transition-all duration-200 ${allotmentPublished
                  ? "bg-[#568EA3] border-[#406d7d] hover:bg-[#48798e] shadow-sm hover:shadow-md cursor-pointer group text-white"
                  : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${allotmentPublished
                    ? "bg-white/15 text-white border-white/20"
                    : "bg-slate-200/50 text-slate-400 border-slate-300/30"
                  }`}>
                  <Award size={20} />
                </div>
                <div>
                  <h4 className={`font-bold text-xl ${allotmentPublished ? "text-white" : "text-slate-500"}`}>Allotment Result</h4>
                  <p className={`text-s font-semibold mt-0.5 ${allotmentPublished ? "text-sky-100/80" : "text-slate-400"}`}>
                    {allotmentPublished ? "View your allocated elective" : "Results pending publication"}
                  </p>
                </div>
              </div>
              <ArrowRight size={16} className={`transition-all ${allotmentPublished
                  ? "text-white/60 group-hover:text-white group-hover:translate-x-1"
                  : "text-slate-300"
                }`} />
            </button>

          </div>

        </main>
      </div>

      {/* ALLOTMENT RESULT MODAL */}
      {showAllotmentModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200 flex flex-col gap-6">

            {/* Modal Icon and Title */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                <Award size={24} />
              </div>
              <h3 className="font-bold text-slate-800 text-2xl">Elective Allotment Result</h3>
              <p className="text-sm font-semibold text-slate-500">The coordinator has published the allotment results.</p>
            </div>

            {/* Allotment details block */}
            {allocation ? (
              <div className="border border-slate-200 rounded-xl bg-slate-50 p-6 space-y-4">
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Allotted Elective</span>
                  <span className="text-lg font-extrabold text-slate-800">{allocation.elective_name}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Course Code</span>
                    <span className="text-sm font-bold text-slate-700 font-mono">{allocation.code}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Allotted On</span>
                    <span className="text-sm font-bold text-slate-700">
                      {allocation.allocated_at ? new Date(allocation.allocated_at).toLocaleDateString() : "Pending"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-amber-200 rounded-xl bg-amber-50/50 p-6 text-center space-y-2">
                <p className="text-sm font-bold text-amber-800">No elective has been allocated to you yet.</p>
                <p className="text-xs text-amber-600/90 font-semibold">Please check back later or contact your elective coordinator.</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowAllotmentModal(false)}
                className="px-6 py-2.5 rounded-xl bg-[#568ea3] hover:opacity-95 font-bold text-sm text-white shadow-md shadow-[#568ea3]/20 hover:shadow-lg focus:outline-none transition-all cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
