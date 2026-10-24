import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  useGetAttendanceStatusQuery,
  usePunchInMutation,
  usePunchOutMutation,
  useGetMyHistoryQuery
} from '../store/api/attendanceApi';
import {
  useSubmitOvertimeRequestMutation,
  useGetMyOvertimeRequestsQuery
} from '../store/api/overtimeApi';
import { useGetDashboardStatsQuery } from '../store/api/reportApi';
import { useElapsedTime } from '../hooks/useElapsedTime';
import useBodyScrollLock from '../hooks/useBodyScrollLock';
import CameraCapture from '../components/CameraCapture';
import LocationDisplay from '../components/LocationDisplay';
import { formatCoordinates } from '../utils/formatters';
import {
  Clock,
  LogIn,
  LogOut,
  CheckCircle,
  AlertCircle,
  Hourglass,
  PlusCircle,
  MapPin,
  X,
  TrendingUp,
  Award,
  ShieldCheck,
  CalendarDays,
  Activity,
  Sparkles,
  Info
} from 'lucide-react';

export default function EmployeeDashboard() {
  const { user } = useSelector((state) => state.auth);

  // Attendance Queries & Mutations
  const { data: statusData } = useGetAttendanceStatusQuery();
  const [selectedDateFilter, setSelectedDateFilter] = useState('');
  const { data: historyData, isLoading: historyLoading } = useGetMyHistoryQuery(
    selectedDateFilter ? { startDate: selectedDateFilter, endDate: selectedDateFilter } : undefined
  );
  const { data: statsData } = useGetDashboardStatsQuery();
  const [punchInApi, { isLoading: punchingIn }] = usePunchInMutation();
  const [punchOutApi, { isLoading: punchingOut }] = usePunchOutMutation();

  // Overtime Queries & Mutations
  useGetMyOvertimeRequestsQuery();
  const [submitOtApi, { isLoading: submittingOt }] = useSubmitOvertimeRequestMutation();

  // Component State
  const [isPunchModalOpen, setIsPunchModalOpen] = useState(false);
  const [punchType, setPunchType] = useState('in'); // 'in' or 'out'
  const [capturedSelfie, setCapturedSelfie] = useState(null);
  const [capturedLocation, setCapturedLocation] = useState(null);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // OT Modal State
  const [isOtModalOpen, setIsOtModalOpen] = useState(false);
  const [otHours, setOtHours] = useState('2.0');
  const [otReason, setOtReason] = useState('');
  const [otDate, setOtDate] = useState(new Date().toISOString().split('T')[0]);

  // Image Preview Modal
  const [previewImage, setPreviewImage] = useState(null);

  const hasActiveSession = Boolean(statusData?.hasActiveSession);
  const activeSession = statusData?.activeSession;
  const latestToday = statusData?.latestToday;

  // Real-time elapsed time calculation hook
  const elapsed = useElapsedTime(
    activeSession?.punchInTime,
    hasActiveSession,
    latestToday?.totalHours || 0
  );

  const stats = statsData?.stats;

  // Lock background body scroll whenever any modal is open
  useBodyScrollLock(isPunchModalOpen || isOtModalOpen || Boolean(previewImage));

  const closePunchModal = () => {
    setIsPunchModalOpen(false);
    setCapturedSelfie(null);
    setCapturedLocation(null);
    setActionError('');
    setActionSuccess('');
  };

  const openPunchModal = (type) => {
    setPunchType(type);
    setCapturedSelfie(null);
    setCapturedLocation(null);
    setActionError('');
    setActionSuccess('');
    setIsPunchModalOpen(true);
  };

  const handlePunchSubmit = async () => {
    if (!capturedSelfie) {
      setActionError('Please take a live selfie before submitting.');
      return;
    }
    if (!capturedLocation) {
      setActionError('Please wait for GPS coordinates to be acquired.');
      return;
    }

    setActionError('');

    try {
      const payload = {
        latitude: capturedLocation.latitude,
        longitude: capturedLocation.longitude,
        accuracy: capturedLocation.accuracy,
        selfie: capturedSelfie
      };

      if (punchType === 'in') {
        await punchInApi(payload).unwrap();
        setActionSuccess('Punched in successfully! Session is now live.');
      } else {
        const res = await punchOutApi(payload).unwrap();
        setActionSuccess(res.message || 'Punched out successfully!');
      }

      setTimeout(() => {
        closePunchModal();
      }, 1500);
    } catch (err) {
      setActionError(err?.data?.message || 'Failed to submit punch.');
    }
  };

  const handleOtSubmit = async (e) => {
    e.preventDefault();
    setActionError('');

    try {
      await submitOtApi({
        date: otDate,
        requestedHours: Number(otHours),
        reason: otReason,
        attendanceId: latestToday?._id
      }).unwrap();

      setIsOtModalOpen(false);
      setOtReason('');
    } catch (err) {
      setActionError(err?.data?.message || 'Failed to submit overtime request.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8 bg-slate-950 min-h-screen text-slate-100 min-w-0">
      {/* SaaS Hero Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5" /> Biometric Presence Verified
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Hello, {user?.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Track your daily attendance with live selfie verification and real-time shift analytics. Standard threshold is <span className="text-indigo-400 font-semibold">8.0 Hours</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsOtModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700/80 text-indigo-300 text-xs font-bold rounded-xl border border-indigo-500/30 transition shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> Request Overtime
            </button>
          </div>
        </div>
      </div>

      {/* Real Backend KPI Analytics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Shift Status */}
        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Today's Status</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-white">
            {hasActiveSession ? (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> On Duty
              </span>
            ) : latestToday ? (
              <span className={latestToday.workStatus === 'COMPLETED' ? 'text-emerald-400' : 'text-amber-400'}>
                {latestToday.workStatus}
              </span>
            ) : (
              <span className="text-slate-500">Not Punched</span>
            )}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {hasActiveSession
              ? `Started at ${new Date(activeSession.punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : latestToday
              ? `${latestToday.totalHours} hrs recorded`
              : 'Punch in to start working'}
          </div>
        </div>

        {/* Card 2: Weekly Logged Hours */}
        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>7-Day Logged Hours</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-white">
            {stats?.weeklyHours ?? 0} <span className="text-xs font-normal text-slate-400">/ 40h target</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Lifetime total: {stats?.totalHoursEver ?? 0} hrs
          </div>
        </div>

        {/* Card 3: Shift Completion Rate */}
        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Shift Completions</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-emerald-400">
            {stats?.completedShifts ?? 0} <span className="text-xs font-normal text-slate-400">Completed (≥8h)</span>
          </div>
          <div className="mt-1 text-[11px] text-amber-400/90">
            {stats?.incompleteShifts ?? 0} incomplete shifts (&lt;8h)
          </div>
        </div>

        {/* Card 4: Overtime Tracking */}
        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Approved Overtime</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-purple-400">
            {stats?.approvedOvertimeHours ?? 0} <span className="text-xs font-normal text-slate-400">Approved Hours</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {stats?.pendingOvertime ?? 0} pending review
          </div>
        </div>
      </div>

      {/* Main Biometric Punch Station & Dynamic Progress Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Shift Terminal */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-3.5 h-3.5 rounded-full ${hasActiveSession ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  Live Attendance Terminal
                </h2>
              </div>
              <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                hasActiveSession
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : latestToday?.workStatus === 'COMPLETED'
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  : latestToday?.workStatus === 'INCOMPLETE'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {hasActiveSession ? 'Shift Active (On-Duty)' : latestToday ? `Shift Closed (${latestToday.workStatus})` : 'Ready to Punch In'}
              </span>
            </div>

            {/* Real Elapsed Time & Digital Clock */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-slate-950/60 border border-slate-800/80 p-6 rounded-2xl">
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-1">
                  {hasActiveSession ? 'Active Session Elapsed Time' : 'Today’s Total Duration'}
                </span>
                <div className="text-3xl sm:text-4xl font-black font-mono tracking-wider text-white">
                  {elapsed.formatted}
                </div>
                {hasActiveSession && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1.5 mt-1 font-medium">
                    <Clock className="w-3.5 h-3.5 animate-spin" /> Live real-time counter
                  </span>
                )}
              </div>

              {/* Dynamic 8-Hour Threshold Progress Bar */}
              <div className="flex-1 max-w-xs">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400 font-medium">8.0h Target Progress</span>
                  <span className="font-bold text-white">{elapsed.progressPercent}%</span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      elapsed.isTargetReached
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-md shadow-emerald-500/30'
                        : 'bg-gradient-to-r from-indigo-500 to-sky-400'
                    }`}
                    style={{ width: `${Math.min(100, elapsed.progressPercent)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>0 hrs</span>
                  <span className={elapsed.isTargetReached ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                    8.0 hrs ({elapsed.isTargetReached ? 'Completed' : 'Incomplete'})
                  </span>
                </div>
              </div>
            </div>

            {/* Location & Biometric Proof Status */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
                <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                <div>
                  <div className="text-slate-400 text-[11px]">Punch Location Tracking</div>
                  <div className="text-slate-200 font-semibold mt-0.5">
                    {hasActiveSession && formatCoordinates(activeSession?.punchInLocation)
                      ? `In: ${formatCoordinates(activeSession.punchInLocation)}`
                      : formatCoordinates(latestToday?.punchOutLocation)
                      ? `Out: ${formatCoordinates(latestToday.punchOutLocation)}`
                      : 'GPS captured on punch'}
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-slate-400 text-[11px]">Biometric Selfie Proof</div>
                  <div className="text-slate-200 font-semibold mt-0.5">
                    {hasActiveSession
                      ? 'Punch-In Selfie Stored'
                      : latestToday?.verificationStatus
                      ? `Verification: ${latestToday.verificationStatus}`
                      : 'Live Camera Capture Required'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="mt-8 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row gap-4">
            {!hasActiveSession ? (
              <button
                onClick={() => openPunchModal('in')}
                className="flex-1 py-3.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-2xl shadow-xl shadow-emerald-600/25 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <LogIn className="w-5 h-5" /> Clock In with Live Selfie
              </button>
            ) : (
              <button
                onClick={() => openPunchModal('out')}
                className="flex-1 py-3.5 px-6 bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm rounded-2xl shadow-xl shadow-rose-600/25 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" /> Clock Out with Live Selfie
              </button>
            )}
          </div>
        </div>

        {/* Right Col: Standard Shift Policy Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-4">
              <Hourglass className="w-4 h-4" /> Shift Threshold Policy
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              8-Hour Standard Rule
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Attendance records are automatically evaluated by the server upon punch out against the standard 8-hour threshold.
            </p>

            <div className="mt-6 space-y-3">
              <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl flex items-start gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 shrink-0" />
                <div className="text-xs">
                  <div className="text-white font-semibold">Completed Shift</div>
                  <div className="text-slate-400 text-[11px]">Total duration &ge; 8.0 hours. Qualifies for standard daily pay.</div>
                </div>
              </div>

              <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl flex items-start gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 mt-1 shrink-0" />
                <div className="text-xs">
                  <div className="text-white font-semibold">Incomplete Shift</div>
                  <div className="text-slate-400 text-[11px]">Total duration &lt; 8.0 hours. Marked as short shift.</div>
                </div>
              </div>

              <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl flex items-start gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 mt-1 shrink-0" />
                <div className="text-xs">
                  <div className="text-white font-semibold">Overtime Requests</div>
                  <div className="text-slate-400 text-[11px]">Requires manager approval. Tracked separately from shift duration.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            Timestamps generated securely by server
          </div>
        </div>
      </div>

      {/* Attendance History Table Card with Date Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-indigo-400" /> Attendance History
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Your historical biometric punch logs, durations, and manager verification status.
            </p>
          </div>

          {/* Date Filter & Clear Filter */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {selectedDateFilter && (
              <button
                onClick={() => setSelectedDateFilter('')}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {historyLoading ? (
          <div className="py-12 text-center text-sm text-slate-400">Loading attendance history...</div>
        ) : historyData?.records?.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400 bg-slate-950/40 rounded-2xl border border-slate-800">
            No attendance records found for this period.
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 rounded-xl border border-slate-800/80">
            <table className="w-full min-w-[760px] text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 uppercase tracking-wider text-slate-400 border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Date</th>
                  <th className="py-3.5 px-4 font-semibold">Punch In</th>
                  <th className="py-3.5 px-4 font-semibold">Punch Out</th>
                  <th className="py-3.5 px-4 font-semibold">Selfies</th>
                  <th className="py-3.5 px-4 font-semibold">GPS Coordinates</th>
                  <th className="py-3.5 px-4 font-semibold">Total Duration</th>
                  <th className="py-3.5 px-4 font-semibold">Shift Status</th>
                  <th className="py-3.5 px-4 font-semibold">Manager Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {historyData?.records?.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-semibold text-white">{record.date}</td>
                    <td className="py-3.5 px-4 text-emerald-400 font-mono">
                      {new Date(record.punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 text-rose-400 font-mono">
                      {record.punchOutTime
                        ? new Date(record.punchOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </td>
                    <td className="py-3.5 px-4 flex items-center gap-2">
                      {record.punchInSelfie && (
                        <button
                          onClick={() => setPreviewImage(record.punchInSelfie)}
                          title="Click to zoom Punch-In Selfie"
                          className="w-9 h-9 rounded-xl overflow-hidden border border-slate-700 hover:border-indigo-400 transition cursor-pointer hover:scale-105"
                        >
                          <img src={record.punchInSelfie} alt="In" className="w-full h-full object-cover" />
                        </button>
                      )}
                      {record.punchOutSelfie && (
                        <button
                          onClick={() => setPreviewImage(record.punchOutSelfie)}
                          title="Click to zoom Punch-Out Selfie"
                          className="w-9 h-9 rounded-xl overflow-hidden border border-slate-700 hover:border-indigo-400 transition cursor-pointer hover:scale-105"
                        >
                          <img src={record.punchOutSelfie} alt="Out" className="w-full h-full object-cover" />
                        </button>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      <div>In: {formatCoordinates(record.punchInLocation, 3) || 'Location unavailable'}</div>
                      {record.punchOutTime && (
                        <div>Out: {formatCoordinates(record.punchOutLocation, 3) || 'Location unavailable'}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      {record.totalHours > 0 ? `${record.totalHours} hrs` : 'In Progress'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase border ${
                        record.workStatus === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : record.workStatus === 'INCOMPLETE'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                      }`}>
                        {record.workStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase border ${
                        record.verificationStatus === 'VALID'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : record.verificationStatus === 'INVALID'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {record.verificationStatus}
                      </span>
                      {record.verificationRemarks && (
                        <div className="text-[10px] text-slate-400 italic mt-0.5 max-w-[130px] truncate" title={record.verificationRemarks}>
                          "{record.verificationRemarks}"
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Biometric Camera Punch Modal */}
      {isPunchModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-4 sm:p-6 flex items-center justify-center overscroll-contain">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto overscroll-contain">
            <button
              onClick={closePunchModal}
              className="absolute top-5 right-5 text-slate-400 hover:text-white transition cursor-pointer p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              {punchType === 'in' ? (
                <>
                  <LogIn className="w-5 h-5 text-emerald-400" /> Punch In Biometric Terminal
                </>
              ) : (
                <>
                  <LogOut className="w-5 h-5 text-rose-400" /> Punch Out Biometric Terminal
                </>
              )}
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Live camera selfie and GPS coordinates are required for shift authentication.
            </p>

            {actionError && (
              <div className="mb-4 p-3 bg-rose-950/50 border border-rose-900/80 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {actionSuccess && (
              <div className="mb-4 p-3 bg-emerald-950/50 border border-emerald-900/80 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {/* Live Camera Viewfinder */}
            <CameraCapture
              capturedImage={capturedSelfie}
              onCapture={(img) => setCapturedSelfie(img)}
              onRetake={() => setCapturedSelfie(null)}
            />

            {/* GPS Location Tracker */}
            <LocationDisplay
              location={capturedLocation}
              onLocationCaptured={(coords) => setCapturedLocation(coords)}
            />

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={closePunchModal}
                className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePunchSubmit}
                disabled={!capturedSelfie || !capturedLocation || punchingIn || punchingOut}
                className={`flex-1 py-3 px-4 font-bold text-xs rounded-xl shadow-xl transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  punchType === 'in'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                }`}
              >
                {punchingIn || punchingOut
                  ? 'Verifying & Saving...'
                  : `Confirm ${punchType === 'in' ? 'Punch In' : 'Punch Out'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overtime Request Modal */}
      {isOtModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-4 sm:p-6 flex items-center justify-center overscroll-contain">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto overscroll-contain">
            <button
              onClick={() => setIsOtModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white transition cursor-pointer p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-indigo-400" /> Overtime Claim Submission
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Submit planned or logged overtime hours for reporting manager review.
            </p>

            <form onSubmit={handleOtSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Shift Date
                </label>
                <input
                  type="date"
                  required
                  value={otDate}
                  onChange={(e) => setOtDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Requested Overtime Duration (Hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="12"
                  required
                  value={otHours}
                  onChange={(e) => setOtHours(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Business Justification / Reason
                </label>
                <textarea
                  required
                  rows={3}
                  value={otReason}
                  onChange={(e) => setOtReason(e.target.value)}
                  placeholder="Describe emergency deliverables or extra shift tasks..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsOtModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOt}
                  className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/25"
                >
                  {submittingOt ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Biometric Fullscreen Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md p-4 sm:p-6 flex items-center justify-center overscroll-contain">
          <div className="relative max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden p-4 shadow-2xl my-auto max-h-[90vh] overflow-y-auto overscroll-contain">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-5 right-5 z-10 bg-slate-950/80 p-2 rounded-full text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={previewImage} alt="Attendance Selfie Proof" className="w-full rounded-2xl object-contain max-h-[70vh]" />
            <div className="p-3 text-center text-xs text-slate-400 font-medium">
              Verified Biometric Facial Capture
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
