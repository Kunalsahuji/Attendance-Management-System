import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  useGetTeamAttendanceQuery,
  useVerifyAttendanceMutation
} from '../store/api/attendanceApi';
import {
  useGetTeamOvertimeRequestsQuery,
  useReviewOvertimeRequestMutation
} from '../store/api/overtimeApi';
import { useGetDashboardStatsQuery } from '../store/api/reportApi';
import {
  Users,
  CheckCircle,
  XCircle,
  ShieldAlert,
  Clock,
  Calendar,
  Search,
  Check,
  Ban,
  Maximize2,
  X,
  ExternalLink,
  MapPin,
  TrendingUp,
  UserCheck,
  AlertTriangle,
  FileCheck
} from 'lucide-react';
import { formatCoordinates, hasValidCoordinates } from '../utils/formatters';
import useBodyScrollLock from '../hooks/useBodyScrollLock';

export default function ManagerDashboard() {
  const { user } = useSelector((state) => state.auth);

  // Queries
  const { data: statsData, isLoading: statsLoading } = useGetDashboardStatsQuery();
  const { data: teamData, isLoading: teamLoading } = useGetTeamAttendanceQuery();
  const { data: otData, isLoading: otLoading } = useGetTeamOvertimeRequestsQuery();

  // Mutations
  const [verifyAttendanceApi, { isLoading: verifying }] = useVerifyAttendanceMutation();
  const [reviewOtApi, { isLoading: reviewingOt }] = useReviewOvertimeRequestMutation();

  // Navigation & Filter States
  const [activeTab, setActiveTab] = useState('verification'); // 'verification' | 'overtime' | 'history'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [verificationFilter, setVerificationFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  // Modals & Notifications
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [verifyStatus, setVerifyStatus] = useState('VALID');
  const [verifyRemarks, setVerifyRemarks] = useState('');

  const [selectedOt, setSelectedOt] = useState(null);
  const [otDecision, setOtDecision] = useState('APPROVED');
  const [otNotes, setOtNotes] = useState('');

  const [previewImage, setPreviewImage] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Freeze background scrolling when any manager modal is active
  useBodyScrollLock(Boolean(selectedRecord) || Boolean(selectedOt) || Boolean(previewImage));

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
  };

  // Filtered attendance records
  const allRecords = useMemo(() => teamData?.records || [], [teamData?.records]);
  const filteredRecords = useMemo(() => {
    return allRecords.filter((rec) => {
      const nameMatch = rec.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const statusMatch = statusFilter === 'ALL' || rec.workStatus === statusFilter;
      const verifyMatch = verificationFilter === 'ALL' || rec.verificationStatus === verificationFilter;
      const dateMatch = !dateFilter || rec.date === dateFilter;
      return nameMatch && statusMatch && verifyMatch && dateMatch;
    });
  }, [allRecords, searchQuery, statusFilter, verificationFilter, dateFilter]);

  // Pending items for immediate review queue
  const pendingVerifications = useMemo(() => {
    return allRecords.filter((r) => r.verificationStatus === 'PENDING');
  }, [allRecords]);

  const pendingOtRequests = useMemo(() => {
    return otData?.requests?.filter((r) => r.status === 'PENDING') || [];
  }, [otData]);

  // Handlers
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!selectedRecord) return;

    try {
      await verifyAttendanceApi({
        id: selectedRecord._id,
        status: verifyStatus,
        remarks: verifyRemarks.trim() || `Verified by ${user?.name || 'Manager'}`
      }).unwrap();

      showFeedback('success', `Attendance for ${selectedRecord.user?.name} marked as ${verifyStatus}.`);
      setSelectedRecord(null);
      setVerifyRemarks('');
    } catch (err) {
      showFeedback('error', err?.data?.message || 'Failed to update verification status.');
    }
  };

  const handleOtReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOt) return;

    try {
      await reviewOtApi({
        id: selectedOt._id,
        status: otDecision,
        reviewerNotes: otNotes.trim()
      }).unwrap();

      showFeedback('success', `Overtime claim of ${selectedOt.requestedHours}h for ${selectedOt.user?.name} was ${otDecision}.`);
      setSelectedOt(null);
      setOtNotes('');
    } catch (err) {
      showFeedback('error', err?.data?.message || 'Failed to submit overtime decision.');
    }
  };

  const stats = statsData?.stats || {};

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8 bg-slate-950 min-h-screen text-slate-100 min-w-0">
      {/* Page Header */}
      <div className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Department Operations
            </span>
            <span className="text-xs text-slate-400 font-medium">Team Management Portal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400 shrink-0" />
            <span>Team Attendance & Verification Hub</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Audit live biometric selfies, inspect geolocation coordinates, and adjudicate pending overtime requests for your direct team.
          </p>
        </div>

        {/* Supervising Manager Card */}
        <div className="flex items-center gap-3 bg-slate-800/70 border border-slate-700/70 p-3 sm:px-4 sm:py-2.5 rounded-xl w-full md:w-auto shrink-0 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/25 text-sm shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || 'M'}
          </div>
          <div className="flex flex-col min-w-0 text-left">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Supervising Manager</div>
            <div className="text-sm font-bold text-white truncate">{user?.name || 'Manager'}</div>
            <div className="text-[11px] text-indigo-400 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse"></span>
              <span className="truncate">{user?.department || 'Operations'}</span>
            </div>
          </div>
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
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider">Team Size</span>
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white">{statsLoading ? '—' : stats.teamSize ?? 0}</div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">Assigned Members</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider">Present Today</span>
            <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-400">{statsLoading ? '—' : stats.presentToday ?? 0}</div>
          <div className="text-[10px] sm:text-[11px] text-emerald-500/80 mt-0.5 font-medium truncate">
            {stats.attendanceRate ?? 0}% Turnout Rate
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider">Active On Duty</span>
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-indigo-400">{statsLoading ? '—' : stats.activeSessions ?? 0}</div>
          <div className="text-[10px] sm:text-[11px] text-indigo-500/80 mt-0.5 truncate">Punch-In Active</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider">Completed Shifts</span>
            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-teal-400">{statsLoading ? '—' : stats.completedShifts ?? 0}</div>
          <div className="text-[10px] sm:text-[11px] text-teal-500/80 mt-0.5 truncate">Standard 8h+</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-md relative overflow-hidden">
          {stats.pendingVerifications > 0 && (
            <div className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full animate-ping" />
          )}
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider">Pending Verify</span>
            <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-400">{statsLoading ? '—' : stats.pendingVerifications ?? 0}</div>
          <div className="text-[10px] sm:text-[11px] text-amber-500/80 mt-0.5 truncate">Biometric Queue</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-md relative overflow-hidden">
          {stats.pendingOvertime > 0 && (
            <div className="absolute top-2 right-2 w-2 h-2 bg-purple-500 rounded-full animate-ping" />
          )}
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider">Pending OT</span>
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-purple-400">{statsLoading ? '—' : stats.pendingOvertime ?? 0}</div>
          <div className="text-[10px] sm:text-[11px] text-purple-500/80 mt-0.5 truncate">Awaiting Decision</div>
        </div>
      </div>

      {/* Navigation Tabs (Swipeable on mobile) */}
      <div className="flex border-b border-slate-800 gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none pb-px -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveTab('verification')}
          className={`py-2.5 sm:py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'verification'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>Biometric Verification Queue</span>
          {pendingVerifications.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-[10px]">
              {pendingVerifications.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('overtime')}
          className={`py-2.5 sm:py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'overtime'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4 shrink-0" />
          <span>Overtime Claims</span>
          {pendingOtRequests.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-[10px]">
              {pendingOtRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`py-2.5 sm:py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'history'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCheck className="w-4 h-4 shrink-0" />
          <span>All Team Attendance Records</span>
          <span className="ml-1 px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded-full text-[10px]">
            {allRecords.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Biometric Verification Queue */}
      {activeTab === 'verification' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
                <span>Pending Biometric Verifications</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect punch selfies and live geolocation coordinates to certify authenticity.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] sm:text-xs bg-slate-800 px-3 py-1 rounded-xl text-slate-300 font-medium">
                {pendingVerifications.length} Pending Actions
              </span>
            </div>
          </div>

          {teamLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading team records...</div>
          ) : pendingVerifications.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-slate-800/20 border border-slate-800 rounded-xl space-y-1">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto opacity-80" />
              <div className="text-slate-300 font-semibold pt-1">All Biometrics Verified!</div>
              <p>There are no unverified attendance records in your team queue.</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 rounded-xl border border-slate-800/80">
              <table className="w-full min-w-[760px] text-left text-xs text-slate-300">
                <thead className="bg-slate-800/60 uppercase tracking-wider text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Punch In & Location</th>
                    <th className="py-3 px-4">Punch Out & Location</th>
                    <th className="py-3 px-4">Selfies</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {pendingVerifications.map((rec) => (
                    <tr key={rec._id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{rec.user?.name}</div>
                        <div className="text-[11px] text-slate-400">{rec.user?.email}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-200">{rec.date}</td>
                      <td className="py-3 px-4">
                        <div className="text-emerald-400 font-semibold">
                          {new Date(rec.punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {hasValidCoordinates(rec.punchInLocation) && (
                          <a
                            href={`https://maps.google.com/?q=${rec.punchInLocation.latitude},${rec.punchInLocation.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-indigo-400 hover:underline mt-0.5"
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
                                className="inline-flex items-center gap-1 text-[10px] text-indigo-400 hover:underline mt-0.5"
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
                        <div className="flex items-center gap-2">
                          {rec.punchInSelfie && (
                            <button
                              onClick={() => setPreviewImage(rec.punchInSelfie)}
                              title="Click to zoom Punch-In Selfie"
                              className="w-10 h-10 rounded-lg overflow-hidden border border-slate-700 hover:border-indigo-400 relative group cursor-pointer"
                            >
                              <img src={rec.punchInSelfie} alt="Punch In" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                <Maximize2 className="w-3 h-3 text-white" />
                              </div>
                            </button>
                          )}
                          {rec.punchOutSelfie && (
                            <button
                              onClick={() => setPreviewImage(rec.punchOutSelfie)}
                              title="Click to zoom Punch-Out Selfie"
                              className="w-10 h-10 rounded-lg overflow-hidden border border-slate-700 hover:border-indigo-400 relative group cursor-pointer"
                            >
                              <img src={rec.punchOutSelfie} alt="Punch Out" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                <Maximize2 className="w-3 h-3 text-white" />
                              </div>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{rec.totalHours > 0 ? `${rec.totalHours} hrs` : 'Active'}</div>
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            rec.workStatus === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : rec.workStatus === 'INCOMPLETE'
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-indigo-500/10 text-indigo-400'
                          }`}
                        >
                          {rec.workStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            setSelectedRecord(rec);
                            setVerifyStatus('VALID');
                            setVerifyRemarks('');
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition cursor-pointer flex items-center gap-1 shadow-md shadow-indigo-600/20"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" /> Inspect & Verify
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

      {/* Tab 2: Overtime Claims */}
      {activeTab === 'overtime' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 shrink-0" />
                <span>Team Overtime Claims</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Adjudicate extra-hour requests linked to employee attendance sessions.
              </p>
            </div>
            <span className="text-[11px] sm:text-xs bg-slate-800 px-3 py-1 rounded-xl text-slate-300 font-medium self-start sm:self-auto">
              {pendingOtRequests.length} Pending Review
            </span>
          </div>

          {otLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading overtime requests...</div>
          ) : otData?.requests?.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-slate-800/20 border border-slate-800 rounded-xl">
              No overtime requests submitted by your team yet.
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 rounded-xl border border-slate-800/80">
              <table className="w-full min-w-[720px] text-left text-xs text-slate-300">
                <thead className="bg-slate-800/60 uppercase tracking-wider text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Claimed Hours</th>
                    <th className="py-3 px-4">Submitted Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Reviewer Notes</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {otData.requests.map((ot) => (
                    <tr key={ot._id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{ot.user?.name}</div>
                        <div className="text-[11px] text-slate-400">{ot.user?.email}</div>
                      </td>
                      <td className="py-3 px-4">{ot.date}</td>
                      <td className="py-3 px-4 font-bold text-purple-400">+{ot.requestedHours} hrs</td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-300" title={ot.reason}>
                        {ot.reason}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            ot.status === 'APPROVED'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : ot.status === 'REJECTED'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {ot.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 italic max-w-xs truncate">
                        {ot.reviewerNotes || '—'}
                      </td>
                      <td className="py-3 px-4">
                        {ot.status === 'PENDING' ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedOt(ot);
                                setOtDecision('APPROVED');
                                setOtNotes('');
                              }}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition cursor-pointer flex items-center gap-1 shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedOt(ot);
                                setOtDecision('REJECTED');
                                setOtNotes('');
                              }}
                              className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-medium transition cursor-pointer flex items-center gap-1 shadow-sm"
                            >
                              <Ban className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">Decided</span>
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

      {/* Tab 3: Complete Team History & Search */}
      {activeTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 min-w-0">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 shrink-0" />
                <span>Team Attendance Directory</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Full historical log of attendance sessions for your assigned team members.
              </p>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <div className="relative w-full sm:w-44">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search employee..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-2.5 py-1.5 rounded-xl w-full sm:w-auto">
                <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-transparent text-xs text-white focus:outline-none w-full sm:w-auto"
                />
                {dateFilter && (
                  <button onClick={() => setDateFilter('')} className="text-slate-400 hover:text-white text-[10px] p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none flex-1 sm:flex-none"
              >
                <option value="ALL">All Shifts</option>
                <option value="COMPLETED">Completed (&ge;8h)</option>
                <option value="INCOMPLETE">Incomplete (&lt;8h)</option>
                <option value="IN_PROGRESS">In Progress</option>
              </select>

              <select
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none flex-1 sm:flex-none"
              >
                <option value="ALL">All Biometrics</option>
                <option value="PENDING">Pending</option>
                <option value="VALID">Valid</option>
                <option value="INVALID">Invalid</option>
              </select>
            </div>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-slate-800/20 border border-slate-800 rounded-xl">
              No team attendance records match the selected criteria.
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 rounded-xl border border-slate-800/80">
              <table className="w-full min-w-[760px] text-left text-xs text-slate-300">
                <thead className="bg-slate-800/60 uppercase tracking-wider text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">In / Out</th>
                    <th className="py-3 px-4">Selfies</th>
                    <th className="py-3 px-4">Working Hours</th>
                    <th className="py-3 px-4">Shift Status</th>
                    <th className="py-3 px-4">Biometric Verification</th>
                    <th className="py-3 px-4">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredRecords.map((rec) => (
                    <tr key={rec._id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-semibold text-white">
                        {rec.user?.name}
                        <div className="text-[11px] font-normal text-slate-400">{rec.user?.department}</div>
                      </td>
                      <td className="py-3 px-4">{rec.date}</td>
                      <td className="py-3 px-4">
                        <div>In: {new Date(rec.punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-slate-400 text-[11px]">
                          Out: {rec.punchOutTime ? new Date(rec.punchOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </div>
                      </td>
                      <td className="py-3 px-4 flex items-center gap-2">
                        {rec.punchInSelfie && (
                          <button
                            onClick={() => setPreviewImage(rec.punchInSelfie)}
                            title="Punch-In Selfie"
                            className="w-9 h-9 rounded-lg overflow-hidden border border-slate-700 hover:border-indigo-400 transition cursor-pointer"
                          >
                            <img src={rec.punchInSelfie} alt="In" className="w-full h-full object-cover" />
                          </button>
                        )}
                        {rec.punchOutSelfie && (
                          <button
                            onClick={() => setPreviewImage(rec.punchOutSelfie)}
                            title="Punch-Out Selfie"
                            className="w-9 h-9 rounded-lg overflow-hidden border border-slate-700 hover:border-indigo-400 transition cursor-pointer"
                          >
                            <img src={rec.punchOutSelfie} alt="Out" className="w-full h-full object-cover" />
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        {rec.totalHours > 0 ? `${rec.totalHours} hrs` : 'In Progress'}
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
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg text-xs font-medium border border-slate-700 transition cursor-pointer"
                        >
                          Inspect
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

      {/* Attendance Verification Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center overscroll-contain">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto overscroll-contain">
            <button
              onClick={() => setSelectedRecord(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-400" /> Biometric Authenticity Review
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Employee: <strong className="text-white">{selectedRecord.user?.name}</strong> • Date: {selectedRecord.date}
            </p>

            {/* Side-by-side Selfie and GPS Inspection */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Punch-In Proof */}
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
                    className="inline-flex items-center gap-1 text-[10px] text-indigo-400 hover:underline mt-1"
                  >
                    <MapPin className="w-3 h-3" />
                    GPS: {formatCoordinates(selectedRecord.punchInLocation, 4)}
                    {selectedRecord.punchInLocation.accuracy && ` (±${Math.round(selectedRecord.punchInLocation.accuracy)}m)`}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>

              {/* Punch-Out Proof */}
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
                    className="inline-flex items-center gap-1 text-[10px] text-indigo-400 hover:underline mt-1"
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
                  Certification Decision
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
                  Manager Verification Remarks
                </label>
                <textarea
                  rows={2}
                  value={verifyRemarks}
                  onChange={(e) => setVerifyRemarks(e.target.value)}
                  placeholder="e.g. Identity and presence verified at designated client location."
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  {verifying ? 'Submitting...' : 'Save Certification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Overtime Decision Modal */}
      {selectedOt && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center overscroll-contain">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto overscroll-contain">
            <button
              onClick={() => setSelectedOt(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" /> Overtime Claim Adjudication
            </h3>
            <div className="text-xs text-slate-300 space-y-1.5 mb-4 bg-slate-800/40 p-3.5 rounded-xl border border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">Employee:</span>
                <span className="font-semibold text-white">{selectedOt.user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date:</span>
                <span className="font-semibold text-white">{selectedOt.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Claimed Hours:</span>
                <span className="font-bold text-purple-400">+{selectedOt.requestedHours} hrs</span>
              </div>
              <div className="pt-1 border-t border-slate-700/60">
                <span className="text-slate-400">Employee Reason:</span>
                <p className="italic text-slate-200 mt-0.5">"{selectedOt.reason}"</p>
              </div>
            </div>

            <form onSubmit={handleOtReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Decision</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setOtDecision('APPROVED')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                      otDecision === 'APPROVED'
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-600/30'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    <Check className="w-4 h-4" /> Approve Claim
                  </button>
                  <button
                    type="button"
                    onClick={() => setOtDecision('REJECTED')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                      otDecision === 'REJECTED'
                        ? 'bg-rose-600 border-rose-500 text-white shadow-md shadow-rose-600/30'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    <Ban className="w-4 h-4" /> Reject Claim
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Manager Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={otNotes}
                  onChange={(e) => setOtNotes(e.target.value)}
                  placeholder="e.g. Approved for critical production deployment support."
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOt(null)}
                  className="flex-1 py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewingOt}
                  className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  {reviewingOt ? 'Saving...' : 'Submit Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
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
