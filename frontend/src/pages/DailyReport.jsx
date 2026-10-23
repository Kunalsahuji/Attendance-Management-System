import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useGetDailyReportQuery } from '../store/api/reportApi';
import {
  FileSpreadsheet,
  Calendar,
  MapPin,
  X,
  Search,
  Filter,
  Download,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { formatCoordinates, hasValidCoordinates } from '../utils/formatters';
import useBodyScrollLock from '../hooks/useBodyScrollLock';

export default function DailyReport() {
  const { user } = useSelector((state) => state.auth);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [shiftFilter, setShiftFilter] = useState('ALL');
  const [verifyFilter, setVerifyFilter] = useState('ALL');
  const [otFilter, setOtFilter] = useState('ALL');

  const [previewImage, setPreviewImage] = useState(null);

  // Freeze background scrolling when image zoom modal is open
  useBodyScrollLock(Boolean(previewImage));

  // RTK Query fetches daily report scoped on the backend
  const { data: reportData, isLoading } = useGetDailyReportQuery({
    date: selectedDate
  });

  const rawRecords = useMemo(() => reportData?.report || [], [reportData?.report]);

  // Filter records client-side for rapid reactive search
  const filteredRecords = useMemo(() => {
    return rawRecords.filter((rec) => {
      const matchSearch =
        rec.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.employeeEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.department?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchShift = shiftFilter === 'ALL' || rec.workStatus === shiftFilter;
      const matchVerify = verifyFilter === 'ALL' || rec.verificationStatus === verifyFilter;
      const matchOt = otFilter === 'ALL' || rec.overtimeStatus === otFilter;
      return matchSearch && matchShift && matchVerify && matchOt;
    });
  }, [rawRecords, searchQuery, shiftFilter, verifyFilter, otFilter]);

  // Aggregate stats for the current filtered date
  const summary = useMemo(() => {
    let totalHours = 0;
    let completed = 0;
    let pendingVerify = 0;
    let approvedOtHours = 0;

    filteredRecords.forEach((r) => {
      totalHours += r.totalHours || 0;
      if (r.workStatus === 'COMPLETED') completed++;
      if (r.verificationStatus === 'PENDING') pendingVerify++;
      if (r.overtimeStatus === 'APPROVED') approvedOtHours += r.overtimeHours || 0;
    });

    return {
      count: filteredRecords.length,
      totalHours: totalHours.toFixed(2),
      completed,
      pendingVerify,
      approvedOtHours: approvedOtHours.toFixed(1)
    };
  }, [filteredRecords]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredRecords.length) return;

    const headers = [
      'Employee Name',
      'Email',
      'Department',
      'Date',
      'Punch In Time',
      'Punch In Lat',
      'Punch In Lng',
      'Punch Out Time',
      'Punch Out Lat',
      'Punch Out Lng',
      'Total Hours',
      'Shift Status',
      'Verification Status',
      'Verification Remarks',
      'Verified By',
      'Overtime Status',
      'Overtime Hours'
    ];

    const rows = filteredRecords.map((r) => [
      `"${r.employeeName}"`,
      `"${r.employeeEmail}"`,
      `"${r.department}"`,
      `"${r.date}"`,
      `"${r.punchInTime ? new Date(r.punchInTime).toLocaleTimeString() : ''}"`,
      r.punchInLocation?.latitude || '',
      r.punchInLocation?.longitude || '',
      `"${r.punchOutTime ? new Date(r.punchOutTime).toLocaleTimeString() : 'In Progress'}"`,
      r.punchOutLocation?.latitude || '',
      r.punchOutLocation?.longitude || '',
      r.totalHours || 0,
      `"${r.workStatus}"`,
      `"${r.verificationStatus}"`,
      `"${(r.verificationRemarks || '').replace(/"/g, '""')}"`,
      `"${r.verifiedBy || ''}"`,
      `"${r.overtimeStatus}"`,
      r.overtimeHours || 0
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Report_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-slate-950 min-h-screen text-slate-100">
      {/* Page Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Audit & Compliance
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {user?.role === 'Admin'
                ? 'Company-Wide Scope (All Staff)'
                : user?.role === 'Manager'
                ? 'Department Scope (Assigned Team)'
                : 'Personal Attendance Scope'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FileSpreadsheet className="w-6 h-6 text-indigo-400" /> Daily Attendance Ledger & Reports
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Authorized daily attendance logs with live camera biometric verification, GPS geofencing coordinates, and overtime linkage.
          </p>
        </div>

        {/* Date Selector & Export Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-xl shadow-inner">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span className="text-xs text-slate-300 font-medium">Audit Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={handleExportCSV}
            disabled={filteredRecords.length === 0}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Logs Found</span>
          <div className="text-2xl font-bold text-white mt-1">{summary.count}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">For {selectedDate}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Duration</span>
          <div className="text-2xl font-bold text-indigo-400 mt-1">{summary.totalHours} hrs</div>
          <div className="text-[11px] text-indigo-500/80 mt-0.5">Cumulative Work Time</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Completed (&ge;8h)</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{summary.completed}</div>
          <div className="text-[11px] text-emerald-500/80 mt-0.5">Full Shifts Completed</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pending Verify</span>
          <div className="text-2xl font-bold text-amber-400 mt-1">{summary.pendingVerify}</div>
          <div className="text-[11px] text-amber-500/80 mt-0.5">Awaiting Biometrics</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Approved OT</span>
          <div className="text-2xl font-bold text-purple-400 mt-1">+{summary.approvedOtHours} hrs</div>
          <div className="text-[11px] text-purple-500/80 mt-0.5">Authorized Extra Time</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search employee name, email or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-indigo-400" /> Filters:
          </div>

          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="ALL">All Shift Types</option>
            <option value="COMPLETED">Completed (&ge;8 hrs)</option>
            <option value="INCOMPLETE">Incomplete (&lt;8 hrs)</option>
            <option value="IN_PROGRESS">In Progress</option>
          </select>

          <select
            value={verifyFilter}
            onChange={(e) => setVerifyFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="ALL">All Biometrics</option>
            <option value="VALID">Valid</option>
            <option value="INVALID">Invalid</option>
            <option value="PENDING">Pending</option>
          </select>

          <select
            value={otFilter}
            onChange={(e) => setOtFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="ALL">All Overtime</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
            <option value="NONE">No OT</option>
          </select>
        </div>
      </div>

      {/* Report Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">
            Daily Ledger Records for {selectedDate} ({filteredRecords.length} records)
          </h2>
          <span className="text-[11px] text-slate-400">
            Authorized viewing scope enforced by server API
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading daily attendance records...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 bg-slate-800/20 border border-slate-800 rounded-xl space-y-1">
            <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
            <div className="text-slate-300 font-semibold pt-1">No attendance records found</div>
            <p>Try picking a different date or clearing active filter tags.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/60 uppercase tracking-wider text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Punch In Time & GPS</th>
                  <th className="py-3 px-4">Punch Out Time & GPS</th>
                  <th className="py-3 px-4">Selfies</th>
                  <th className="py-3 px-4">Working Hours</th>
                  <th className="py-3 px-4">Shift Status</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4">Overtime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredRecords.map((row) => (
                  <tr key={row.attendanceId} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{row.employeeName}</div>
                      <div className="text-[11px] text-slate-400">{row.employeeEmail}</div>
                      <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded">
                        {row.department}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-emerald-400">
                        {new Date(row.punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                      {hasValidCoordinates(row.punchInLocation) && (
                        <a
                          href={`https://maps.google.com/?q=${row.punchInLocation.latitude},${row.punchInLocation.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-indigo-400 hover:underline mt-0.5"
                        >
                          <MapPin className="w-3 h-3 text-indigo-400 shrink-0" />
                          {formatCoordinates(row.punchInLocation, 4)}
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {row.punchOutTime ? (
                        <>
                          <div className="font-bold text-rose-400">
                            {new Date(row.punchOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                          {hasValidCoordinates(row.punchOutLocation) && (
                            <a
                              href={`https://maps.google.com/?q=${row.punchOutLocation.latitude},${row.punchOutLocation.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-indigo-400 hover:underline mt-0.5"
                            >
                              <MapPin className="w-3 h-3 text-indigo-400 shrink-0" />
                              {formatCoordinates(row.punchOutLocation, 4)}
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
                        {row.punchInSelfie && (
                          <button
                            onClick={() => setPreviewImage(row.punchInSelfie)}
                            title="Inspect Punch-In Photo"
                            className="w-9 h-9 rounded-lg overflow-hidden border border-slate-700 hover:border-indigo-400 transition cursor-pointer"
                          >
                            <img src={row.punchInSelfie} alt="Punch In" className="w-full h-full object-cover" />
                          </button>
                        )}
                        {row.punchOutSelfie && (
                          <button
                            onClick={() => setPreviewImage(row.punchOutSelfie)}
                            title="Inspect Punch-Out Photo"
                            className="w-9 h-9 rounded-lg overflow-hidden border border-slate-700 hover:border-indigo-400 transition cursor-pointer"
                          >
                            <img src={row.punchOutSelfie} alt="Punch Out" className="w-full h-full object-cover" />
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-white">
                        {row.totalHours > 0 ? `${row.totalHours} hrs` : 'In Progress'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {row.totalMinutes ? `${row.totalMinutes} mins total` : 'Tracking...'}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          row.workStatus === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : row.workStatus === 'INCOMPLETE'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                        }`}
                      >
                        {row.workStatus}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          row.verificationStatus === 'VALID'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : row.verificationStatus === 'INVALID'
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {row.verificationStatus}
                      </span>
                      {row.verificationRemarks && (
                        <div className="text-[10px] text-slate-400 italic mt-0.5 max-w-[130px] truncate" title={row.verificationRemarks}>
                          "{row.verificationRemarks}"
                        </div>
                      )}
                      {row.verifiedBy && (
                        <div className="text-[9px] text-slate-500 mt-0.5">By: {row.verifiedBy}</div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {row.overtimeStatus && row.overtimeStatus !== 'NONE' ? (
                        <div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              row.overtimeStatus === 'APPROVED'
                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                                : row.overtimeStatus === 'REJECTED'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            }`}
                          >
                            {row.overtimeStatus}
                          </span>
                          <div className="text-[11px] font-bold text-purple-300 mt-0.5">
                            +{row.overtimeHours} hrs
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
