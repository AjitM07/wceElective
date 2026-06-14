import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  User,
  BookOpen,
  CheckCircle2,
  Clock,
  ArrowLeft,
  HelpCircle,
  FileCheck,
  Award,
  Menu,
  UserRound
} from "lucide-react";
import api from "../../api/axios";
import useAuthStore from "../../store/authStore";
import StudentSidebar from "../../components/StudentSidebar";

export default function StudentStatus() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const selectedProgram = useAuthStore((state) => state.selectedProgram);

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getSemesterText = () => {
    if (selectedProgram === "Open Elective II") return "Sem 6";
    if (selectedProgram === "Mini-Project") return "Sem 5-6";
    return "Sem 5";
  };

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
          setProfileData(res.data.data);
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
          <p className="text-slate-500 font-medium animate-pulse">Loading dashboard details...</p>
        </div>
      </div>
    );
  }

  const student = profileData?.student || {};
  const preferences = profileData?.preferences || [];
  const allocation = profileData?.allocation || null;

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
    <div className="min-h-screen bg-[#f4f9fc] flex font-sans w-full max-w-full overflow-x-hidden">
      {/* Sidebar */}
      <StudentSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Pane */}
      <div className="flex-1 md:pl-100 pl-0 min-h-screen flex flex-col w-full max-w-full overflow-x-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-100 px-8 h-16 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-xl md:hidden cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <button
              onClick={() => navigate("/select-program")}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="font-bold text-slate-800 text-xl">My Status</h1>
              <p className="text-md text-slate-400 font-semibold">View your submission and allotment status</p>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 md:p-8 p-4 max-w-5xl w-full mx-auto space-y-6">

          {/* Three Progress Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

            {/* Card 2: Preference Submission */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between min-h-[140px]">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${student.preferences_submitted
                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                : "bg-[#7F6456]/10 text-[#7F6456] border-[#7F6456]/15"
                }`}>
                <FileCheck size={18} />
              </div>
              <div className="mt-4">
                <span className="text-[15px] text-slate-400 font-bold tracking-wider block mt-0.5">Preference Status</span>
                <span className="text-sm font-black text-slate-800 block">
                  {student.preferences_submitted ? "Submitted" : "Not Submitted"}
                </span>
                <span className={`text-[12px] font-bold mt-1.5 block ${student.preferences_submitted ? "text-emerald-600" : "text-[#7F6456]"
                  }`}>
                  {student.preferences_submitted && student.preferences_submitted_at
                    ? `Submitted at ${new Date(student.preferences_submitted_at).toLocaleString()}`
                    : "Action required"}
                </span>
              </div>
            </div>

            {/* Card 3: Allotment Status */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between min-h-[140px]">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${allocation
                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                : "bg-[#1E3E52]/10 text-[#1E3E52] border-[#1E3E52]/15"
                }`}>
                <Award size={18} />
              </div>
              <div className="mt-4">
                <span className="text-[15px] text-slate-400 font-bold tracking-wider block mt-0.5">Allotment Status</span>
                <span className="text-sm font-black text-slate-800 block">
                  {allocation ? "Allocated" : "Pending"}
                </span>
                <span className={`text-[12px] font-bold mt-1.5 block ${allocation ? "text-emerald-600" : "text-[#1E3E52]"
                  }`}>
                  {allocation ? allocation.elective_name : "Results pending"}
                </span>
              </div>
            </div>
          </div>

          {/* Preferences list card block */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs space-y-6">
            <h3 className="font-extrabold text-slate-800 text-base border-b border-slate-50 pb-4">
              {student.preferences_submitted ? "Your Submitted Preferences" : "Your Draft Preferences"}
            </h3>

            {preferences.length > 0 ? (
              <div className="space-y-3">
                {preferences.map((p, idx) => (
                  <div
                    key={p.preference_rank}
                    className="bg-white rounded-xl border border-slate-400 py-2 px-6 sm:py-1.8 sm:px-8 flex items-center gap-3 sm:gap-6 shadow-sm"
                  >
                    {/* Position Label */}
                    <div className="w-12 h-12 rounded-xl bg-[#568ea3]/5 text-[#000] flex flex-col items-center justify-center flex-shrink-0 border border-[#568ea3]/10">
                      <span className="font-bold text-2xl">{p.preference_rank}</span>
                    </div>

                    {/* Preference Item Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="bg-[#568ea3]/15 text-[#568ea3] font-mono text-md font-bold px-1.5 py-0.5 rounded">
                          {p.code}
                        </span>
                        <h4 className="font-bold text-slate-800 truncate px-3">{p.elective_name}</h4>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen size={48} className="mx-auto text-slate-200 mb-3" />
                <p className="text-slate-400 font-semibold text-sm">No preferences submitted or drafted yet.</p>
                <button
                  onClick={() => navigate("/student/preferences")}
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#568ea3] to-[#68c3d4] text-white font-bold text-xs rounded-xl shadow-md shadow-[#568ea3]/15 cursor-pointer hover:shadow-lg transition-all"
                >
                  Configure Preferences
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
