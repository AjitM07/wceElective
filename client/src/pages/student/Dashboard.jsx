import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { User, LogOut, BookOpen, Award, CheckCircle, Clock, ArrowLeft } from "lucide-react";
import api from "../../api/axios";
import useAuthStore from "../../store/authStore";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/students/profile");
        if (res.data.success) {
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

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#568ea3", borderTopColor: "transparent" }}></div>
          <p className="text-gray-500 font-medium animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const student = profileData?.student || {};
  const preferences = profileData?.preferences || [];
  const allocation = profileData?.allocation || null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm sm:text-base" style={{ background: "linear-gradient(135deg, #1e3d4f, #568ea3)" }}>
              W
            </div>
            <div>
              <h1 className="font-bold text-gray-800 text-sm sm:text-base leading-tight">WCE Elective Allocation</h1>
              <p className="text-[10px] sm:text-xs text-gray-400 hidden md:block">Student Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate("/select-program")}
              className="flex items-center gap-1.5 px-2.5 py-2 sm:px-4 sm:py-2 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors border border-gray-200"
              title="Select Program"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Select Program</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-2.5 py-2 sm:px-4 sm:py-2 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors border border-gray-200"
              title="Sign Out"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Student Profile Details */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(86,142,163,0.1)", color: "#568ea3" }}>
                  <User size={28} />
                </div>
                <div>
                  <h2 className="font-bold text-gray-800 text-lg leading-tight">{student.name}</h2>
                  <p className="text-sm text-gray-500">PRN: {student.prn}</p>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <span className="block text-gray-400 text-xs uppercase font-semibold">College Email</span>
                  <span className="font-medium text-gray-700">{student.email}</span>
                </div>
                <div>
                  <span className="block text-gray-400 text-xs uppercase font-semibold">Contact Number</span>
                  <span className="font-medium text-gray-700">{student.phone || "Not Provided"}</span>
                </div>
                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                  <div>
                    <span className="block text-gray-400 text-xs uppercase font-semibold">Academic CGPA</span>
                    <span className="text-2xl font-black text-gray-800">{student.cgpa}</span>
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(86,142,163,0.1)", color: "#568ea3" }}>
                    B.Tech CSE
                  </div>
                </div>
              </div>
            </div>

            {/* Allocation Status Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Award size={18} style={{ color: "#568ea3" }} />
                Allocation Status
              </h3>
              {allocation ? (
                <div className="rounded-xl p-4 border border-green-100 bg-green-50/50 space-y-3">
                  <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
                    <CheckCircle size={16} /> Allocated Successfully
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 text-base">{allocation.elective_name}</div>
                    <div className="text-xs text-gray-500 font-medium">Code: {allocation.code}</div>
                  </div>
                  <div className="text-xs text-gray-400 flex items-center gap-1 pt-1">
                    <Clock size={12} /> Allocated on {new Date(allocation.allocated_at).toLocaleDateString()}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl p-4 border border-amber-100 bg-amber-50/50 space-y-2">
                  <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm animate-pulse">
                    <Clock size={16} /> Allocation Pending
                  </div>
                  <p className="text-xs text-gray-600">
                    The elective coordinator is currently reviewing requests. You will see your assigned elective here once finalized.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Preferences */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-xs">
            <h3 className="font-bold text-gray-800 text-lg mb-6 flex items-center gap-2">
              <BookOpen size={20} style={{ color: "#568ea3" }} />
              Submitted Preferences
            </h3>

            {preferences.length > 0 ? (
              <div className="space-y-6">
                {preferences.map((p) => (
                  <div
                    key={p.preference_rank}
                    className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm"
                      style={{
                        background: p.preference_rank === 1 ? "rgba(86,142,163,0.15)" : p.preference_rank === 2 ? "rgba(104,195,212,0.15)" : "rgba(226,232,240,0.7)",
                        color: p.preference_rank === 1 ? "#568ea3" : p.preference_rank === 2 ? "#3b82f6" : "#64748b"
                      }}
                    >
                      #{p.preference_rank}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-bold text-gray-800 text-base">{p.elective_name}</h4>
                        <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-gray-100 text-gray-500">{p.code}</span>
                      </div>
                      {p.reason && (
                        <p className="text-gray-600 text-sm italic pt-1">
                          &ldquo;{p.reason}&rdquo;
                        </p>
                      )}
                      <div className="text-xs text-gray-400 pt-2 flex items-center gap-1">
                        Submitted: {new Date(p.submitted_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">No elective preferences submitted.</p>
              </div>
            )}
          </div>
          
        </div>
      </main>
    </div>
  );
}
