import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LogOut, Users, CheckCircle, AlertCircle, BookOpen, Search, Filter, ArrowLeft } from "lucide-react";
import api from "../../api/axios";
import useAuthStore from "../../store/authStore";
import wceLogo from "../../assets/WCElogo.png";

export default function CoordinatorDashboard() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'allocated', 'pending'
  const [electiveFilter, setElectiveFilter] = useState("all"); // 'all', 'IoT', 'Advanced Machine Learning', 'Remote Sensing and GIS'
  const [submittingId, setSubmittingId] = useState(null);
  const [portalSettings, setPortalSettings] = useState([]);
  const [settingsUpdating, setSettingsUpdating] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, studentsRes, settingsRes] = await Promise.all([
        api.get("/coordinator/dashboard"),
        api.get("/students"),
        api.get("/portal-settings")
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      if (studentsRes.data.success) {
        setStudents(studentsRes.data.data.students);
      }
      if (settingsRes.data.success) {
        setPortalSettings(settingsRes.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleTogglePortal = async (name, currentStatus) => {
    setSettingsUpdating(true);
    try {
      const res = await api.post("/portal-settings", {
        name,
        is_accessible: !currentStatus
      });
      if (res.data.success) {
        toast.success(`Portal '${name}' is now ${!currentStatus ? 'accessible' : 'inaccessible'} for students.`);
        // Refresh portal settings
        const settingsRes = await api.get("/portal-settings");
        if (settingsRes.data.success) {
          setPortalSettings(settingsRes.data.data);
        }
      } else {
        toast.error(res.data.message || "Failed to update portal status.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to toggle portal status.");
    } finally {
      setSettingsUpdating(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handleAllocate = async (studentId, electiveId) => {
    setSubmittingId(studentId);
    try {
      const res = await api.post("/coordinator/allocate", {
        student_id: studentId,
        elective_id: electiveId ? parseInt(electiveId) : null
      });

      if (res.data.success) {
        toast.success("Allocation updated successfully!");
        // Refresh stats and students
        await fetchDashboardData();
      } else {
        toast.error(res.data.message || "Allocation failed.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update allocation.");
    } finally {
      setSubmittingId(null);
    }
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

  // Filter students based on search query, status, and elective selection
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.prn.includes(searchQuery);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "allocated" && s.allocated_elective) ||
      (statusFilter === "pending" && !s.allocated_elective);

    const matchesElective =
      electiveFilter === "all" ||
      s.allocated_elective === electiveFilter ||
      s.pref1 === electiveFilter;

    return matchesSearch && matchesStatus && matchesElective;
  });

  const electivesList = stats?.electives || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 grid grid-cols-3 items-center">
          {/* Left: Back Button */}
          <div className="flex justify-start">
            <button
              onClick={() => navigate("/select-program")}
              className="flex items-center gap-1.5 px-2.5 py-2 sm:px-4 sm:py-2 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors border border-gray-200 cursor-pointer"
              title="Select Program"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Select Program</span>
            </button>
          </div>

          {/* Center: WCE Logo and Title */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 text-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0">
              <img src={wceLogo} alt="WCE Logo" className="w-full h-full object-contain" />
            </div>
            <div className="text-left">
              <h1 className="font-bold text-gray-800 text-sm sm:text-base leading-tight">WCE Elective Allocation</h1>
              <p className="text-[10px] sm:text-xs text-gray-400">Coordinator Dashboard</p>
            </div>
          </div>

          {/* Right: Sign Out Button */}
          <div className="flex justify-end">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-2.5 py-2 sm:px-4 sm:py-2 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors border border-gray-200 cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
              <Users size={24} />
            </div>
            <div>
              <span className="text-gray-400 text-xs font-semibold uppercase">Total Students</span>
              <h3 className="text-2xl font-black text-gray-800">{stats?.totalStudents}</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-50 text-green-600">
              <CheckCircle size={24} />
            </div>
            <div>
              <span className="text-gray-400 text-xs font-semibold uppercase">Allocated Students</span>
              <h3 className="text-2xl font-black text-gray-800">{stats?.totalAllocated}</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">
              <AlertCircle size={24} />
            </div>
            <div>
              <span className="text-gray-400 text-xs font-semibold uppercase">Pending Allocation</span>
              <h3 className="text-2xl font-black text-gray-800">{stats?.pendingAllocation}</h3>
            </div>
          </div>
        </div>

        {/* Portal Status Controls */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
          <h3 className="font-bold text-gray-800 text-lg mb-6 flex items-center gap-2">
            <BookOpen size={20} style={{ color: "#568ea3" }} />
            Student Portal Access Controls
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {portalSettings.map((portal) => (
              <div key={portal.name} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">{portal.name}</h4>
                  <p className="text-xs text-gray-400">
                    {portal.is_accessible ? "Accessible to students" : "Closed / Inaccessible"}
                  </p>
                </div>
                <button
                  disabled={settingsUpdating}
                  onClick={() => handleTogglePortal(portal.name, portal.is_accessible)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#568ea3] focus:ring-offset-2 ${
                    portal.is_accessible ? 'bg-[#568ea3]' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      portal.is_accessible ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Electives Capacity Tracking */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
          <h3 className="font-bold text-gray-800 text-lg mb-6 flex items-center gap-2">
            <BookOpen size={20} style={{ color: "#568ea3" }} />
            Elective Capacities and Demand
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats?.electives.map((e) => {
              const allocationRate = Math.round((e.allocated_count / e.capacity) * 100);
              return (
                <div key={e.name} className="p-4 rounded-xl border border-gray-100 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm">{e.name}</h4>
                      <p className="text-xs text-gray-400">1st Pref Demand: {e.preferences_count}</p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {e.allocated_count} / {e.capacity}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="rounded-full h-2 transition-all duration-500"
                      style={{
                        width: `${Math.min(allocationRate, 100)}%`,
                        background: allocationRate > 90 ? "#ef4444" : allocationRate > 50 ? "#f59e0b" : "#10b981"
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 font-medium">
                    <span>{allocationRate}% Filled</span>
                    <span>{e.capacity - e.allocated_count} seats left</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-gray-100 space-y-4">
            <h3 className="font-bold text-gray-800 text-lg">Student Allocation Status</h3>
            
            {/* Filters Row */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search student name or PRN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#568ea3] transition-colors"
                />
              </div>

              <div className="flex flex-wrap gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2">
                  <Filter size={14} className="text-gray-400" />
                  <span className="text-xs text-gray-500">Filters:</span>
                </div>
                
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-600 bg-white outline-none focus:border-[#568ea3]"
                >
                  <option value="all">All Statuses</option>
                  <option value="allocated">Allocated Only</option>
                  <option value="pending">Pending Only</option>
                </select>

                {/* Elective/Pref Filter */}
                <select
                  value={electiveFilter}
                  onChange={(e) => setElectiveFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-600 bg-white outline-none focus:border-[#568ea3]"
                >
                  <option value="all">All Electives / Preferences</option>
                  {electivesList.map((e) => (
                    <option key={e.id} value={e.name}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">PRN</th>
                  <th className="px-6 py-4">CGPA</th>
                  <th className="px-6 py-4">1st Pref</th>
                  <th className="px-6 py-4">2nd Pref</th>
                  <th className="px-6 py-4">3rd Pref</th>
                  <th className="px-6 py-4">Allocated Elective</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-800">{s.name}</div>
                        <div className="text-xs text-gray-400">{s.email}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{s.prn}</td>
                      <td className="px-6 py-4 font-bold text-gray-800">{s.cgpa}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                          {s.pref1 || "None"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                          {s.pref2 || "None"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                          {s.pref3 || "None"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          disabled={submittingId === s.id}
                          value={s.allocated_elective_id || ""}
                          onChange={(e) => handleAllocate(s.id, e.target.value)}
                          className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-white outline-none focus:border-[#568ea3]"
                          style={{
                            color: s.allocated_elective ? "#0f766e" : "#b45309",
                            backgroundColor: s.allocated_elective ? "#f0fdfa" : "#fffbeb",
                            borderColor: s.allocated_elective ? "#ccfbf1" : "#fef3c7"
                          }}
                        >
                          <option value="" style={{ color: "#64748b" }}>Pending</option>
                          {electivesList.map((e) => (
                            <option key={e.id} value={e.id} style={{ color: "#1e293b" }}>
                              {e.name}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-gray-400 font-medium">
                      No matching students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
