import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  User,
  LogOut,
  ArrowLeft,
  Lock,
  Mail,
  Phone,
  Check,
  BadgeCheck,
  CheckCircle2,
  GraduationCap
} from "lucide-react";
import api from "../../api/axios";
import useAuthStore from "../../store/authStore";
import wceLogo from '../../assets/WCElogo.png';

export default function ConfirmDetails() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const selectedProgram = useAuthStore((state) => state.selectedProgram);
  const selectedAcademicYear = useAuthStore((state) => state.selectedAcademicYear);

  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contactNo, setContactNo] = useState("");
  const [isDeclared, setIsDeclared] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // If no program is selected, redirect to select-program
    if (!selectedProgram) {
      navigate("/select-program");
      return;
    }

    const fetchStudentProfile = async () => {
      try {
        const res = await api.get("/students/profile");
        if (res.data.success) {
          const profile = res.data.data.student;
          if (profile.details_verified) {
            navigate("/student/dashboard");
            return;
          }
          setStudentData(profile);
          setContactNo(profile.phone || "");
        } else {
          toast.error("Failed to load profile details.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error fetching profile from database.");
        logout();
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentProfile();
  }, [navigate, selectedProgram, logout]);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handleProceed = async (e) => {
    e.preventDefault();
    if (!isDeclared) {
      toast.error("Please check the confirmation box to proceed.");
      return;
    }

    const cleanedPhone = contactNo.trim().replace(/[^0-9]/g, "");
    if (cleanedPhone.length !== 10) {
      toast.error("Please enter a valid 10-digit contact number.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.put("/students/verify-profile", {
        phone: cleanedPhone
      });

      if (res.data.success) {
        // Update local auth store so client knows details are verified
        updateUser({
          phone: cleanedPhone,
          details_verified: true
        });
        toast.success("Profile verified successfully!");
        navigate("/student/dashboard");
      } else {
        toast.error(res.data.message || "Failed to verify details.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f9fc]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#568ea3", borderTopColor: "transparent" }}></div>
          <p className="text-slate-500 font-medium animate-pulse">Loading profile records...</p>
        </div>
      </div>
    );
  }

  // Derive Semester based on selected program
  const semesterText = selectedProgram === "Open Elective II" ? "Semester 6" : "Semester 5";

  return (
    <div className="min-h-screen bg-[#f4f9fc] flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 grid grid-cols-3 items-center">
          {/* Left: Back Button */}
          <div className="flex justify-start">
            <button
              onClick={() => navigate("/select-program")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-600 rounded-xl hover:bg-slate-50 transition-colors border border-slate-200 cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
          </div>

          {/* Center: WCE Logo and Title */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 text-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0">
              <img src={wceLogo} alt="WCE Logo" className="w-full h-full object-contain" />
            </div>
            <div className="text-left">
              <h1 className="font-bold text-slate-800 text-sm sm:text-lg leading-tight">WCE Open Elective Portal</h1>
              <p className="text-[10px] sm:text-xs text-slate-400">Profile Verification</p>
            </div>
          </div>

          {/* Right: Logout Button */}
          <div className="flex justify-end">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-600 rounded-xl hover:bg-slate-50 transition-colors border border-slate-200 cursor-pointer"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">
              Verify Registered Records
            </h2>

          </div>

          {/* Stepper progress indicator */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 max-w-md mx-auto pb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                <Check size={12} />
              </div>
              <span className="text-xs font-bold text-slate-500">Program</span>
            </div>
            <div className="h-0.5 w-12 bg-emerald-500 rounded"></div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#568ea3] text-white flex items-center justify-center text-xs font-bold shadow-md shadow-[#568ea3]/20">
                2
              </div>
              <span className="text-xs font-bold text-slate-800">Profile</span>
            </div>
            <div className="h-0.5 w-12 bg-slate-200 rounded"></div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-xs font-bold">
                3
              </div>
              <span className="text-xs font-semibold text-slate-400">Preferences</span>
            </div>
          </div>

          {/* Details Form Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 sm:p-10 space-y-8">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-[#568ea3]/10 text-[#568ea3] flex items-center justify-center">
                <BadgeCheck size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">Check Your Details and Verify</h3>

              </div>
            </div>

            <form onSubmit={handleProceed} className="space-y-6">
              {/* Row 1: Name and PRN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Student Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      readOnly
                      value={studentData?.name || ""}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-100 text-slate-700 bg-slate-50 font-semibold outline-none cursor-not-allowed text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">PRN</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      readOnly
                      value={studentData?.prn || ""}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-100 text-slate-700 bg-slate-50 font-semibold outline-none cursor-not-allowed text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Division and Current Semester */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Division</label>
                  <div className="relative">
                    <GraduationCap size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      readOnly
                      value={studentData?.division ? `Division ${studentData.division}` : "Not Assigned"}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-100 text-slate-700 bg-slate-50 font-semibold outline-none cursor-not-allowed text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Current Semester</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      readOnly
                      value={`${semesterText}`}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-100 text-slate-700 bg-slate-50 font-semibold outline-none cursor-not-allowed text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: College Email */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">College Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    readOnly
                    value={studentData?.email || ""}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-100 text-slate-700 bg-slate-50 font-semibold outline-none cursor-not-allowed text-sm"
                  />
                </div>
              </div>

              <div className="w-full h-px bg-slate-100 my-4"></div>

              {/* Row 4: Editable Contact Number */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-slate-400 mb-2">Provide your active mobile number in case of modifications.</p>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#568ea3]" />
                  <input
                    type="text"
                    required
                    placeholder="Enter 10-digit mobile number"
                    value={contactNo}
                    onChange={(e) => setContactNo(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 font-semibold outline-none focus:border-[#568ea3] focus:ring-2 focus:ring-[#568ea3]/15 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Declaration Checkbox */}
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#568ea3]/5 border border-[#568ea3]/10">
                <input
                  type="checkbox"
                  id="declaration"
                  checked={isDeclared}
                  onChange={(e) => setIsDeclared(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-[#568ea3] focus:ring-[#568ea3] cursor-pointer"
                />
                <label htmlFor="declaration" className="text-xs font-semibold text-slate-600 select-none cursor-pointer leading-tight">
                  I confirm that the above information is correct and true to the best of my knowledge.
                </label>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={!isDeclared || submitting}
                className={`w-full py-3.5 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all shadow-md ${isDeclared && !submitting
                  ? "bg-gradient-to-r from-[#568ea3] to-[#68c3d4] hover:opacity-95 cursor-pointer hover:shadow-[#568ea3]/20 hover:shadow-lg active:scale-[0.98]"
                  : "bg-slate-300 shadow-none cursor-not-allowed"
                  }`}
              >
                {submitting ? "Updating Profile..." : "Save Details & Proceed to Preferences"}
              </button>
            </form>
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
