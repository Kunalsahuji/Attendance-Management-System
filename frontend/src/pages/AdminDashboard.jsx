import { useState, useMemo } from 'react';
import {
  useGetAllUsersQuery,
  useGetManagersQuery,
  useAssignManagerMutation
} from '../store/api/userApi';
import {
  useGetAllAttendanceQuery,
  useVerifyAttendanceMutation
} from '../store/api/attendanceApi';
import { useGetDashboardStatsQuery } from '../store/api/reportApi';
import {
  ShieldCheck,
  Users,
  Clock,
  UserPlus,
  Search,
  Calendar,
  X,
  CheckCircle,
  XCircle,
  ExternalLink,
  MapPin,
  TrendingUp,
  UserCheck,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCoordinates, hasValidCoordinates } from '../utils/formatters';
import useBodyScrollLock from '../hooks/useBodyScrollLock';

export default function AdminDashboard() {
  // Queries
  const { data: statsData, isLoading: statsLoading } = useGetDashboardStatsQuery();
  const { data: usersData, isLoading: usersLoading } = useGetAllUsersQuery();
  const { data: managersData } = useGetManagersQuery();
  const { data: attendanceData, isLoading: attLoading } = useGetAllAttendanceQuery();

  // Mutations
  const [assignManagerApi, { isLoading: assigning }] = useAssignManagerMutation();
  const [verifyAttendanceApi, { isLoading: verifying }] = useVerifyAttendanceMutation();

  // State
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'attendance'
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');

  const [attSearch, setAttSearch] = useState('');
  const [attDateFilter, setAttDateFilter] = useState('');
  const [attStatusFilter, setAttStatusFilter] = useState('ALL');
  const [attVerifyFilter, setAttVerifyFilter] = useState('ALL');

  // Modals & Feedback
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [verifyStatus, setVerifyStatus] = useState('VALID');
  const [verifyRemarks, setVerifyRemarks] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Freeze background scrolling when any admin modal is active
  useBodyScrollLock(Boolean(selectedUser) || Boolean(selectedRecord) || Boolean(previewImage));

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
  };

  // Filtered Users
  const allUsers = useMemo(() => usersData?.users || [], [usersData?.users]);
  const filteredUsers = useMemo(() => {
    return allUsers.filter((u) => {
      const matchSearch =
        u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.department?.toLowerCase().includes(userSearch.toLowerCase());
      const matchRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
      return matchSearch && matchRole;
    });
  }, [allUsers, userSearch, userRoleFilter]);

  // Filtered Attendance
  const allAttendance = useMemo(() => attendanceData?.records || [], [attendanceData?.records]);
  const filteredAttendance = useMemo(() => {
    return allAttendance.filter((rec) => {
      const matchSearch =
        rec.user?.name?.toLowerCase().includes(attSearch.toLowerCase()) ||
        rec.user?.email?.toLowerCase().includes(attSearch.toLowerCase());
      const matchDate = !attDateFilter || rec.date === attDateFilter;
      const matchStatus = attStatusFilter === 'ALL' || rec.workStatus === attStatusFilter;
      const matchVerify = attVerifyFilter === 'ALL' || rec.verificationStatus === attVerifyFilter;
      return matchSearch && matchDate && matchStatus && matchVerify;
    });
  }, [allAttendance, attSearch, attDateFilter, attStatusFilter, attVerifyFilter]);

  // Handlers
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      await assignManagerApi({
        id: selectedUser._id,
        managerId: selectedManagerId || null
      }).unwrap();

      showFeedback('success', `Manager assignment updated for ${selectedUser.name}!`);
      setSelectedUser(null);
    } catch (err) {
      showFeedback('error', err?.data?.message || 'Failed to update manager assignment.');
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!selectedRecord) return;

    try {
      await verifyAttendanceApi({
        id: selectedRecord._id,
        status: verifyStatus,
        remarks: verifyRemarks.trim() || 'Verified by System Administrator'
      }).unwrap();

      showFeedback('success', `Attendance for ${selectedRecord.user?.name} certified as ${verifyStatus}.`);
      setSelectedRecord(null);
      setVerifyRemarks('');
    } catch (err) {
      showFeedback('error', err?.data?.message || 'Failed to update attendance verification.');
    }
  };

  const stats = statsData?.stats || {};

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8 bg-slate-950 min-h-screen text-slate-100 min-w-0">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
              System Administration
            </span>
            <span className="text-xs text-slate-400 font-medium">Enterprise Control Plane</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 shrink-0" />
            <span>Executive Administration Hub</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Company-wide workforce hierarchy management, manager assignments, and authorized attendance surveillance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/reports"
            className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition flex items-center justify-center gap-1.5 shadow-md"
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-400" /> View Daily Reports
          </Link>
        </div>
      </div>

      {/* Global Feedback Alert */}
      {feedback.message && (
        <div
          className={`p-3.5 sm:p-4 rounded-xl text-xs font-medium border flex items-center justify-between shadow-lg transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/70 border-rose-800 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback({ type: '', message: '' })} className="hover:opacity-75 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Real-time KPI Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider">Total Staff</span>
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white">
            {statsLoading ? '—' : (stats.totalEmployees ?? 0) + (stats.totalManagers ?? 0)}
          </div>
          <div className="text-[10px] sm:text-[11px] text-purple-400 mt-0.5 truncate">
            {stats.totalEmployees ?? 0} Empl • {stats.totalManagers ?? 0} Mgrs
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider">Present Today</span>
            <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-400">{statsLoading ? '—' : stats.presentToday ?? 0}</div>
          <div className="text-[10px] sm:text-[11px] text-emerald-500/80 mt-0.5 font-medium truncate">
            {stats.attendanceRate ?? 0}% Company Turnout
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider">Active On Duty</span>
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-indigo-400">{statsLoading ? '—' : stats.activeSessions ?? 0}</div>
          <div className="text-[10px] sm:text-[11px] text-indigo-500/80 mt-0.5 truncate">Live Sessions</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider">Unassigned</span>
            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-400">{statsLoading ? '—' : stats.unassignedEmployees ?? 0}</div>
          <div className="text-[10px] sm:text-[11px] text-amber-500/80 mt-0.5 truncate">Require Mgr Link</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider">Pending Verify</span>
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-teal-400">{statsLoading ? '—' : stats.pendingVerifications ?? 0}</div>
          <div className="text-[10px] sm:text-[11px] text-teal-500/80 mt-0.5 truncate">Biometrics Queue</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider">Pending OT</span>
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-rose-400">{statsLoading ? '—' : stats.pendingOvertime ?? 0}</div>
          <div className="text-[10px] sm:text-[11px] text-rose-500/80 mt-0.5 truncate">Overtime Queue</div>
        </div>
      </div>

      {/* Navigation Tabs (Swipeable on mobile) */}
      <div className="flex border-b border-slate-800 gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none pb-px -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveTab('users')}
          className={`py-2.5 sm:py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-purple-500 text-purple-400 bg-purple-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>User Directory & Team Hierarchy</span>
          <span className="ml-1 px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded-full text-[10px]">
            {allUsers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`py-2.5 sm:py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'attendance'
              ? 'border-purple-500 text-purple-400 bg-purple-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4 shrink-0" />
          <span>System-Wide Attendance Audit</span>
          <span className="ml-1 px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded-full text-[10px]">
            {allAttendance.length}
          </span>
        </button>
      </div>

      {/* Tab 1: User Directory & Manager Assignment */}
      {activeTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 shrink-0" />
                <span>Enterprise User Directory</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect organizational roles and map employees to supervising department managers.
              </p>
            </div>

            {/* User Search & Filters */}
            <div className="flex items-center gap-2.5">
              <div className="relative w-full sm:w-auto">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search name, email, dept..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 w-52"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="ALL">All Roles</option>
                <option value="Employee">Employees</option>
                <option value="Manager">Managers</option>
                <option value="Admin">Administrators</option>
              </select>
            </div>
          </div>

          {usersLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading user directory...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-slate-800/20 border border-slate-800 rounded-xl">
              No users match the search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 rounded-xl border border-slate-800/80">
              <table className="w-full min-w-[700px] text-left text-xs text-slate-300">
                <thead className="bg-slate-800/60 uppercase tracking-wider text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Reporting Manager</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{u.name}</div>
                        <div className="text-[11px] text-slate-400">{u.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            u.role === 'Admin'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                              : u.role === 'Manager'
                              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-medium">{u.department}</td>
                      <td className="py-3 px-4">
                        {u.managerId ? (
                          <div className="text-indigo-300 font-semibold flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                            {u.managerId.name}
                          </div>
                        ) : u.role === 'Employee' ? (
                          <span className="text-amber-400/90 italic font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Unassigned
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">Self-directed</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {u.role === 'Employee' && (
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setSelectedManagerId(u.managerId?._id || '');
                            }}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-lg font-medium border border-slate-700 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            {u.managerId ? 'Reassign Manager' : 'Assign Manager'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: System Attendance Audit */}
      {activeTab === 'attendance' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 min-w-0">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 shrink-0" />
                <span>System-Wide Attendance Audit Trail</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Authorized executive view of all employee punch sessions, biometrics, and GPS coordinates.
              </p>
            </div>

            {/* Attendance Filter Controls */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <div className="relative w-full sm:w-44">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search employee..."
                  value={attSearch}
                  onChange={(e) => setAttSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-2.5 py-1.5 rounded-xl w-full sm:w-auto">
                <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <input
                  type="date"
                  value={attDateFilter}
                  onChange={(e) => setAttDateFilter(e.target.value)}
                  className="bg-transparent text-xs text-white focus:outline-none w-full sm:w-auto"
                />
                {attDateFilter && (
                  <button onClick={() => setAttDateFilter('')} className="text-slate-400 hover:text-white text-[10px] p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <select
                value={attStatusFilter}
                onChange={(e) => setAttStatusFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none flex-1 sm:flex-none"
              >
                <option value="ALL">All Shifts</option>
                <option value="COMPLETED">Completed (&ge;8h)</option>
                <option value="INCOMPLETE">Incomplete (&lt;8h)</option>
                <option value="IN_PROGRESS">In Progress</option>
              </select>

              <select
                value={attVerifyFilter}
                onChange={(e) => setAttVerifyFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none flex-1 sm:flex-none"
              >
                <option value="ALL">All Biometrics</option>
                <option value="PENDING">Pending</option>
                <option value="VALID">Valid</option>
                <option value="INVALID">Invalid</option>
              </select>
            </div>
          </div>

          {attLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading attendance logs...</div>
          ) : filteredAttendance.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-slate-800/20 border border-slate-800 rounded-xl">
              No attendance records found matching filters.
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 rounded-xl border border-slate-800/80">
              <table className="w-full min-w-[780px] text-left text-xs text-slate-300">
                <thead className="bg-slate-800/60 uppercase tracking-wider text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Punch In & GPS</th>
                    <th className="py-3 px-4">Punch Out & GPS</th>
                    <th className="py-3 px-4">Selfies</th>
                    <th className="py-3 px-4">Hours</th>
                    <th className="py-3 px-4">Shift Status</th>
                    <th className="py-3 px-4">Verification</th>
                    <th className="py-3 px-4">Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredAttendance.map((rec) => (
                    <tr key={rec._id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{rec.user?.name}</div>
                        <div className="text-[11px] text-slate-400">{rec.user?.email}</div>
                      </td>
                      <td className="py-3 px-4 font-medium">{rec.date}</td>
                      <td className="py-3 px-4">
                        <div className="text-emerald-400 font-semibold">
                          {new Date(rec.punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {hasValidCoordinates(rec.punchInLocation) && (
                          <a
                            href={`https://maps.google.com/?q=${rec.punchInLocation.latitude},${rec.punchInLocation.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-purple-400 hover:underline mt-0.5"
                          >
                            <MapPin className="w-3 h-3" />
                            {formatCoordinates(rec.punchInLocation, 4)}
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {rec.punchOutTime ? (
                          <>
                            <div className="text-rose-400 font-semibold">
                              {new Date(rec.punchOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            {hasValidCoordinates(rec.punchOutLocation) && (
                              <a
                                href={`https://maps.google.com/?q=${rec.punchOutLocation.latitude},${rec.punchOutLocation.longitude}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] text-purple-400 hover:underline mt-0.5"
                              >
                                <MapPin className="w-3 h-3" />
                                {formatCoordinates(rec.punchOutLocation, 4)}
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </>
                        ) : (
                          <span className="text-[11px] text-indigo-400 font-medium">Session in progress</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {rec.punchInSelfie && (
                            <button
                              onClick={() => setPreviewImage(rec.punchInSelfie)}
                              title="Punch-In Selfie"
                              className="w-9 h-9 rounded-lg overflow-hidden border border-slate-700 hover:border-purple-400 transition cursor-pointer"
                            >
                              <img src={rec.punchInSelfie} alt="In" className="w-full h-full object-cover" />
                            </button>
                          )}
                          {rec.punchOutSelfie && (
                            <button
                              onClick={() => setPreviewImage(rec.punchOutSelfie)}
                              title="Punch-Out Selfie"
                              className="w-9 h-9 rounded-lg overflow-hidden border border-slate-700 hover:border-purple-400 transition cursor-pointer"
                            >
                              <img src={rec.punchOutSelfie} alt="Out" className="w-full h-full object-cover" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        {rec.totalHours > 0 ? `${rec.totalHours} hrs` : 'Active'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full font-semibold border ${
                            rec.workStatus === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : rec.workStatus === 'INCOMPLETE'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                          }`}
                        >
                          {rec.workStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full font-semibold ${
                            rec.verificationStatus === 'VALID'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : rec.verificationStatus === 'INVALID'
                              ? 'bg-rose-500/10 text-rose-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {rec.verificationStatus}
                        </span>
                        {rec.verificationRemarks && (
                          <div className="text-[10px] text-slate-400 italic mt-0.5 max-w-[120px] truncate" title={rec.verificationRemarks}>
                            "{rec.verificationRemarks}"
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            setSelectedRecord(rec);
                            setVerifyStatus(rec.verificationStatus === 'INVALID' ? 'INVALID' : 'VALID');
                            setVerifyRemarks(rec.verificationRemarks || '');
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-lg font-medium border border-slate-700 transition cursor-pointer"
                        >
                          Audit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Assign Manager Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center overscroll-contain">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto overscroll-contain">
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-purple-400" /> Assign Reporting Manager
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Select an authorized Manager for employee <strong className="text-white">{selectedUser.name}</strong> ({selectedUser.email}).
            </p>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Designated Manager
                </label>
                <select
                  value={selectedManagerId}
                  onChange={(e) => setSelectedManagerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">No Manager (Unassigned)</option>
                  {managersData?.managers?.map((mgr) => (
                    <option key={mgr._id} value={mgr._id}>
                      {mgr.name} — {mgr.department} ({mgr.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  {assigning ? 'Saving...' : 'Update Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Attendance Audit Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center overscroll-contain">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto overscroll-contain">
            <button
              onClick={() => setSelectedRecord(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-400" /> Executive Biometric Audit
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Employee: <strong className="text-white">{selectedRecord.user?.name}</strong> • Date: {selectedRecord.date}
            </p>

            {/* Side-by-side Selfie and GPS Inspection */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800 flex flex-col items-center">
                <span className="text-[11px] font-semibold text-slate-300 mb-2">Punch-In Biometrics</span>
                {selectedRecord.punchInSelfie ? (
                  <img
                    src={selectedRecord.punchInSelfie}
                    alt="Punch In Selfie"
                    onClick={() => setPreviewImage(selectedRecord.punchInSelfie)}
                    className="w-full aspect-4/3 max-h-36 sm:max-h-44 object-cover rounded-lg cursor-pointer hover:opacity-90 border border-slate-700"
                  />
                ) : (
                  <div className="w-full aspect-4/3 bg-slate-900 rounded-lg flex items-center justify-center text-xs text-slate-500">
                    No photo captured
                  </div>
                )}
                <div className="text-[11px] text-emerald-400 font-semibold mt-2">
                  {new Date(selectedRecord.punchInTime).toLocaleTimeString()}
                </div>
                {hasValidCoordinates(selectedRecord.punchInLocation) && (
                  <a
                    href={`https://maps.google.com/?q=${selectedRecord.punchInLocation.latitude},${selectedRecord.punchInLocation.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-purple-400 hover:underline mt-1"
                  >
                    <MapPin className="w-3 h-3" />
                    GPS: {formatCoordinates(selectedRecord.punchInLocation, 4)}
                    {selectedRecord.punchInLocation.accuracy && ` (±${Math.round(selectedRecord.punchInLocation.accuracy)}m)`}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>

              <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800 flex flex-col items-center">
                <span className="text-[11px] font-semibold text-slate-300 mb-2">Punch-Out Biometrics</span>
                {selectedRecord.punchOutSelfie ? (
                  <img
                    src={selectedRecord.punchOutSelfie}
                    alt="Punch Out Selfie"
                    onClick={() => setPreviewImage(selectedRecord.punchOutSelfie)}
                    className="w-full aspect-4/3 max-h-36 sm:max-h-44 object-cover rounded-lg cursor-pointer hover:opacity-90 border border-slate-700"
                  />
                ) : (
                  <div className="w-full aspect-4/3 bg-slate-900 rounded-lg flex items-center justify-center text-xs text-slate-500">
                    {selectedRecord.punchOutTime ? 'No photo captured' : 'Session In Progress'}
                  </div>
                )}
                <div className="text-[11px] text-rose-400 font-semibold mt-2">
                  {selectedRecord.punchOutTime ? new Date(selectedRecord.punchOutTime).toLocaleTimeString() : 'In Progress'}
                </div>
                {hasValidCoordinates(selectedRecord.punchOutLocation) && (
                  <a
                    href={`https://maps.google.com/?q=${selectedRecord.punchOutLocation.latitude},${selectedRecord.punchOutLocation.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-purple-400 hover:underline mt-1"
                  >
                    <MapPin className="w-3 h-3" />
                    GPS: {formatCoordinates(selectedRecord.punchOutLocation, 4)}
                    {selectedRecord.punchOutLocation.accuracy && ` (±${Math.round(selectedRecord.punchOutLocation.accuracy)}m)`}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            </div>

            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Administrative Decision
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setVerifyStatus('VALID')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      verifyStatus === 'VALID'
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-600/30'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" /> Certify as Valid
                  </button>

                  <button
                    type="button"
                    onClick={() => setVerifyStatus('INVALID')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      verifyStatus === 'INVALID'
                        ? 'bg-rose-600 border-rose-500 text-white shadow-md shadow-rose-600/30'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <XCircle className="w-4 h-4" /> Flag as Invalid (Suspicious)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Administrative Audit Notes
                </label>
                <textarea
                  rows={2}
                  value={verifyRemarks}
                  onChange={(e) => setVerifyRemarks(e.target.value)}
                  placeholder="e.g. Identity and timestamp audited against enterprise biometric logs."
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="flex-1 py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifying}
                  className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  {verifying ? 'Saving...' : 'Certify Attendance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selfie Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md p-4 sm:p-6 flex items-center justify-center overscroll-contain">
          <div className="relative max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-3 shadow-2xl my-auto max-h-[90vh] overflow-y-auto overscroll-contain">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-5 right-5 z-10 bg-slate-950/80 p-2 rounded-full text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={previewImage} alt="Attendance Selfie Proof" className="w-full rounded-xl object-contain max-h-[75vh]" />
          </div>
        </div>
      )}
    </div>
  );
}
