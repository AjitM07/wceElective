import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ChevronUp,
  ChevronDown,
  Save,
  Send,
  Lock,
  CheckCircle,
  Clock,
  ArrowLeft,
  BookOpen,
  Menu
} from "lucide-react";
import api from "../../api/axios";
import useAuthStore from "../../store/authStore";
import StudentSidebar from "../../components/StudentSidebar";

export default function ElectivePreferences() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const [student, setStudent] = useState(null);
  const [electives, setElectives] = useState([]);
  const [rankedList, setRankedList] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [submittedAt, setSubmittedAt] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Submit modal state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleDragStart = (e, index) => {
    if (isLocked) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (isLocked || draggedIndex === null || draggedIndex === index) return;

    // Swap items in real-time
    const newList = [...rankedList];
    const draggedItem = newList[draggedIndex];

    newList.splice(draggedIndex, 1);
    newList.splice(index, 0, draggedItem);

    setRankedList(newList);
    setDraggedIndex(index);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const [deadline, setDeadline] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");

  const fetchData = async () => {
    try {
      // Fetch profile & electives
      const [profileRes, electivesRes] = await Promise.all([
        api.get("/students/profile"),
        api.get("/students/electives")
      ]);

      if (profileRes.data.success && electivesRes.data.success) {
        const profile = profileRes.data.data.student;
        if (!profile.details_verified) {
          navigate("/student/confirm-details");
          return;
        }

        setStudent(profile);
        setIsLocked(!!profile.preferences_submitted);
        setSubmittedAt(profile.preferences_submitted_at);
        if (profileRes.data.data.deadline) {
          setDeadline(new Date(profileRes.data.data.deadline));
        }

        const allElectives = electivesRes.data.data.electives;
        setElectives(allElectives);

        // Sort ranked list based on existing preferences
        const savedPrefs = profileRes.data.data.preferences || [];

        let initialList = [];
        // 1. Put already saved preferences first
        savedPrefs.forEach(pref => {
          const match = allElectives.find(e => e.id === pref.elective_id);
          if (match) {
            initialList.push(match);
          }
        });

        // 2. Add remaining electives that weren't in saved preferences
        allElectives.forEach(e => {
          if (!initialList.some(item => item.id === e.id)) {
            initialList.push(e);
          }
        });

        setRankedList(initialList);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load elective details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!deadline) return;
    const timer = setInterval(() => {
      const now = new Date();
      const diff = deadline - now;
      if (diff <= 0) {
        setTimeLeft("00:00:00 left");
        clearInterval(timer);
        fetchData();
        return;
      }
      const totalHours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      const formatNum = (num) => String(num).padStart(2, "0");
      setTimeLeft(`${formatNum(totalHours)}:${formatNum(minutes)}:${formatNum(seconds)} left`);
    }, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  // Handle reordering up
  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newList = [...rankedList];
    const temp = newList[index];
    newList[index] = newList[index - 1];
    newList[index - 1] = temp;
    setRankedList(newList);
  };

  // Handle reordering down
  const handleMoveDown = (index) => {
    if (index === rankedList.length - 1) return;
    const newList = [...rankedList];
    const temp = newList[index];
    newList[index] = newList[index + 1];
    newList[index + 1] = temp;
    setRankedList(newList);
  };

  // Save draft preferences
  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      const payload = rankedList.map((el, i) => ({
        elective_id: el.id,
        rank: i + 1,
        reason: ""
      }));

      const res = await api.post("/students/preferences", {
        preferences: payload,
        is_submitted: false
      });

      if (res.data.success) {
        toast.success("Draft saved! You can still reorder and save again before submitting.");
        const now = new Date();
        setLastSaved(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save draft preferences.");
    } finally {
      setSavingDraft(false);
    }
  };

  // Confirm and submit final preferences
  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = rankedList.map((el, i) => ({
        elective_id: el.id,
        rank: i + 1,
        reason: ""
      }));

      const res = await api.post("/students/preferences", {
        preferences: payload,
        is_submitted: true
      });

      if (res.data.success) {
        toast.success("Preferences submitted successfully!");
        setShowSubmitModal(false);
        setIsLocked(true);
        setSubmittedAt(new Date());
        fetchData();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to submit preferences.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f9fc]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#568ea3", borderTopColor: "transparent" }}></div>
          <p className="text-slate-500 font-medium animate-pulse">Loading elective preferences...</p>
        </div>
      </div>
    );
  }

  const getRankSuffix = (rank) => {
    if (rank === 1) return "st";
    if (rank === 2) return "nd";
    if (rank === 3) return "rd";
    return "th";
  };

  return (
    <div className="min-h-screen bg-[#f4f9fc] flex font-sans w-full max-w-full overflow-x-hidden">
      {/* Sidebar */}
      <StudentSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Pane */}
      <div className="flex-1 md:pl-100 pl-0 min-h-screen flex flex-col w-full max-w-full overflow-x-hidden">
        {/* Top bar with back option */}
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
              <h1 className="font-bold text-slate-800 text-xl">Elective Preferences</h1>
              <p className="text-md text-slate-400 font-semibold">Rank your subject preferences</p>
            </div>
          </div>
        </header>

        {/* Inner Content scroll area */}
        <main className="flex-1 md:p-8 p-4 max-w-4xl w-full mx-auto space-y-6">
          {isLocked ? (
            /* LOCKED VERSION - READ ONLY */
            <div className="space-y-6">
              {/* Preferences Submitted success banner */}
              <div className="bg-[#ecfdf5] border border-[#d1fae5] rounded-2xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={30} />
                </div>
                <div>
                  <h3 className="font-bold text-emerald-800 text-xl">Preferences Submitted</h3>
                  <p className="text-sm text-emerald-600 mt-1 font-semibold">
                    Submitted on {new Date(submittedAt).toLocaleString()}. Your ranking is locked.
                  </p>
                </div>
              </div>

              {/* Status information line */}
              <div className="flex flex-wrap items-center justify-between gap-4 py-2 border-b border-slate-100">
                <p className="text-md font-bold text-slate-700  tracking-wider">Your submitted ranking is shown below.</p>
                <div className="flex items-center gap-3">
                  <div className="bg-amber-50 text-amber-700 text-sm px-3 py-1 rounded-full font-bold flex items-center gap-1.5 border border-amber-200">
                    <Clock size={20} />
                    <span>{timeLeft}</span>
                  </div>
                  <div className="bg-slate-100 text-slate-600 text-sm px-3 py-1 rounded-full font-bold flex items-center gap-1.5 border border-gray-200">
                    <Lock size={20} />
                    <span>Locked</span>
                  </div>
                </div>
              </div>

              {/* Subject Cards (Locked) */}
              <div className="space-y-3">
                {rankedList.map((el, i) => (
                  <div key={el.id} className="bg-white rounded-xl border border-slate-400 py-2 px-6 sm:py-1.8 sm:px-8 flex items-center gap-3 sm:gap-6 shadow-sm">
                    {/* Position Label */}
                    <div className="w-12 h-12 rounded-xl bg-[#568ea3]/5 text-[#000] flex flex-col items-center justify-center flex-shrink-0 border border-[#568ea3]/10">
                      <span className="font-bold text-2xl">{i + 1}</span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="bg-[#568ea3]/15 text-[#568ea3] font-mono text-md font-bold px-1.5 py-0.5 rounded">
                          {el.code}
                        </span>
                        <h4 className="font-bold text-slate-800 truncate px-3">{el.name}</h4>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* INTERACTIVE VERSION - RANKING & ACTIONS */
            <div className="space-y-6">
              {/* Instructions and Time Left Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                <p className="text-md font-bold text-slate-500">
                  Use the <span className="font-black text-slate-800">↑ ↓</span> buttons to set your ranking. <br></br><span className="font-bold text-[#568ea3]">1st = most preferred</span>.
                </p>
                <div className="flex items-center gap-3">
                  <div className="bg-amber-50 text-amber-700 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5 border border-amber-200">
                    <Clock size={25} />
                    <span>{timeLeft}</span>
                  </div>
                  {lastSaved && (
                    <span className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle size={25} /> Saved {lastSaved}
                    </span>
                  )}
                </div>
              </div>

              {/* Deadline & Warning Banner */}
              <div className="bg-emerald-50/60 border border-emerald-400 rounded-md p-4 space-y-1">
                <p className="text-sm text-emerald-900 leading-tight">
                  Save your draft preferences anytime before deadline — unsubmitted preferences auto-submit at deadline.
                </p>
              </div>

              {/* Subject Cards (Interactive) */}
              <div className="space-y-3">
                {rankedList.map((el, i) => {
                  const style = draggedIndex === i ? { transform: "scale(0.98)" } : {};

                  return (
                    <div
                      key={el.id}
                      draggable={!isLocked}
                      onDragStart={(e) => handleDragStart(e, i)}
                      onDragOver={(e) => handleDragOver(e, i)}
                      onDragEnd={handleDragEnd}
                      onDrop={handleDrop}
                      style={style}
                      className={`bg-white rounded-xl border border-slate-400 py-2 px-6 sm:py-1.8 sm:px-8 flex items-center gap-3 sm:gap-6 shadow-sm hover:shadow-md transition-all duration-300 ease-in-out group cursor-grab active:cursor-grabbing ${draggedIndex === i ? "opacity-30 border-dashed border-[#568ea3]" : ""
                        }`}
                    >
                      {/* Position Label with arrows */}
                      <div className="w-12 h-12 rounded-xl bg-[#568ea3]/5 text-[#000] flex flex-col items-center justify-center flex-shrink-0 border border-[#568ea3]/10">
                        <span className="font-bold text-2xl">{i + 1}</span>
                      </div>



                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="bg-[#568ea3]/15 text-[#568ea3] font-mono text-md font-bold px-1.5 py-0.5 rounded">
                            {el.code}
                          </span>
                          <h4 className="font-bold text-slate-800 truncate px-3">{el.name}</h4>

                        </div>
                      </div>

                      {/* Drag decoration lines or dots */}
                      <div className="flex flex-col gap-1 px-4 text-slate-300 select-none">
                        <div className="flex gap-1">
                          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        </div>
                        <div className="flex gap-1">
                          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        </div>
                        <div className="flex gap-1">
                          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        </div>
                      </div>

                      {/* Up/Down buttons */}
                      <div className="flex flex-col gap-1.5 flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveUp(i);
                          }}
                          disabled={i === 0}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${i === 0
                            ? "border-slate-100 text-slate-200 cursor-not-allowed"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-1000 active:scale-95"
                            }`}
                          title="Move Up"
                        >
                          <ChevronUp size={15} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveDown(i);
                          }}
                          disabled={i === rankedList.length - 1}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${i === rankedList.length - 1
                            ? "border-slate-100 text-slate-200 cursor-not-allowed"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-1000 active:scale-95"
                            }`}
                          title="Move Down"
                        >
                          <ChevronDown size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={handleSaveDraft}
                  disabled={savingDraft}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600/10 rounded-xl border border-emerald-300 text-emerald-700 font-bold text-md hover:bg-emerald-600 hover:border-emerald-600 hover:text-white transition-all focus:outline-none 
                  
                  disabled:opacity-50 cursor-pointer"
                >
                  <Save size={20} />
                  <span>{savingDraft ? "Saving Draft..." : "Save Preferences"}</span>
                </button>
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#568ea3] to-[#68c3d4] hover:opacity-95 font-bold text-md text-white shadow-md shadow-[#568ea3]/20 transition-all focus:outline-none hover:shadow-lg active:scale-95 cursor-pointer"
                >
                  <Send size={20} />
                  <span>Submit Final</span>
                </button>
              </div>

              {/* Warning label below buttons */}
              <p className="text-[11px] text-center text-slate-400 font-medium mt-3">
                * Saving keeps a draft · Submitting is permanent and cannot be modified afterwards
              </p>
            </div>
          )}
        </main>
      </div>

      {/* CONFIRMATION SUBMIT DIALOG MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200 flex flex-col gap-8">

            {/* Modal Icon and Titles */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-5 border border-amber-200">
                <Send size={20} className="ml-1" />
              </div>
              <h3 className="font-bold text-slate-800 text-2xl">Submit Final Preferences?</h3>
              <p className="text-sm font-semibold text-slate-500">Once submitted, You cannot change the preferences ranking.</p>
            </div>

            {/* List Preview */}
            <div className="max-h-80 overflow-y-auto border border-slate-400 rounded-xl bg-slate-50 py-3 px-6 divide-y divide-slate-300">
              {rankedList.map((el, index) => (
                <div key={el.id} className="py-2.5 flex items-center justify-between text-sm font-semibold">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-[#568ea3]/10 text-[#568ea3] flex items-center justify-center font-bold">
                      {index + 1}
                    </span>
                    <span className="text-slate-700 font-bold">{el.name}</span>
                  </div>
                  <span className="font-mono text-slate-400">{el.code}</span>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
                className="py-3 rounded-xl border border-slate-200 font-bold text-sm text-slate-600 hover:bg-slate-50 transition-colors focus:outline-none cursor-pointer"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={submitting}
                className="py-3 rounded-xl bg-gradient-to-r from-[#568ea3] to-[#68c3d4] hover:opacity-95 font-bold text-sm text-white shadow-md shadow-[#568ea3]/20 hover:shadow-lg focus:outline-none transition-colors disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Submitting..." : "Confirm Submit"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
