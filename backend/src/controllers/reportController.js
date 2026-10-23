const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Overtime = require('../models/Overtime');

// Helper to format date YYYY-MM-DD
const getFormattedDate = (date = new Date()) => {
  return date.toISOString().split('T')[0];
};

// @desc    Generate daily attendance report scoped by user role with Overtime status
// @route   GET /api/reports/daily
// @access  Private (Employee: Own, Manager: Team, Admin: All)
const getDailyReport = async (req, res, next) => {
  try {
    const { date, userFilter, status, verificationStatus } = req.query;
    const targetDate = date || getFormattedDate();

    let query = { date: targetDate };

    // Role-based scoping
    if (req.user.role === 'Employee') {
      query.user = req.user._id;
    } else if (req.user.role === 'Manager') {
      const teamUsers = await User.find({ managerId: req.user._id }).select('_id');
      const teamIds = teamUsers.map(u => u._id);
      query.user = { $in: teamIds };
    } else if (req.user.role === 'Admin') {
      if (userFilter) {
        query.user = userFilter;
      }
    }

    if (status) {
      query.workStatus = status;
    }
    if (verificationStatus) {
      query.verificationStatus = verificationStatus;
    }

    const records = await Attendance.find(query)
      .populate('user', 'name email department')
      .populate('verifiedBy', 'name email')
      .sort({ punchInTime: -1 });

    // Fetch related overtime records for this date
    const userIds = records.map(r => r.user?._id).filter(Boolean);
    const overtimeRecords = await Overtime.find({
      date: targetDate,
      user: { $in: userIds }
    });

    const otMap = new Map();
    overtimeRecords.forEach(ot => {
      otMap.set(ot.user.toString(), ot);
    });

    // Format report records
    const reportData = records.map(rec => {
      const uId = rec.user ? rec.user._id.toString() : '';
      const ot = otMap.get(uId);

      return {
        attendanceId: rec._id,
        userId: rec.user ? rec.user._id : null,
        employeeName: rec.user ? rec.user.name : 'Unknown',
        employeeEmail: rec.user ? rec.user.email : 'Unknown',
        department: rec.user ? rec.user.department : 'General',
        date: rec.date,
        punchInTime: rec.punchInTime,
        punchInLocation: rec.punchInLocation,
        punchInSelfie: rec.punchInSelfie,
        punchOutTime: rec.punchOutTime,
        punchOutLocation: rec.punchOutLocation,
        punchOutSelfie: rec.punchOutSelfie,
        totalHours: rec.totalHours,
        totalMinutes: rec.totalMinutes,
        workStatus: rec.workStatus, // COMPLETED (>= 8h) vs INCOMPLETE (< 8h) vs IN_PROGRESS
        verificationStatus: rec.verificationStatus, // PENDING, VALID, INVALID
        verificationRemarks: rec.verificationRemarks,
        verifiedBy: rec.verifiedBy ? rec.verifiedBy.name : null,
        verifiedAt: rec.verifiedAt,
        // Overtime integration
        overtimeStatus: ot ? ot.status : 'NONE', // NONE, PENDING, APPROVED, REJECTED
        overtimeHours: ot ? ot.requestedHours : 0,
        overtimeReason: ot ? ot.reason : null,
        overtimeId: ot ? ot._id : null
      };
    });

    res.status(200).json({
      success: true,
      date: targetDate,
      count: reportData.length,
      report: reportData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get live, real-time dashboard analytics scoped by user role
// @route   GET /api/reports/dashboard-stats
// @access  Private (Employee, Manager, Admin)
const getDashboardStats = async (req, res, next) => {
  try {
    const today = getFormattedDate();

    // 1. Employee Dashboard Stats
    if (req.user.role === 'Employee') {
      const todaySession = await Attendance.findOne({
        user: req.user._id,
        date: today
      }).sort({ createdAt: -1 });

      const allRecords = await Attendance.find({ user: req.user._id });
      const completedCount = allRecords.filter(r => r.workStatus === 'COMPLETED').length;
      const incompleteCount = allRecords.filter(r => r.workStatus === 'INCOMPLETE').length;

      // Last 7 days records for hours calculation
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentRecords = await Attendance.find({
        user: req.user._id,
        createdAt: { $gte: sevenDaysAgo }
      });

      const weeklyHours = recentRecords.reduce((acc, curr) => acc + (curr.totalHours || 0), 0);
      const totalHoursEver = allRecords.reduce((acc, curr) => acc + (curr.totalHours || 0), 0);

      // Overtime stats
      const userOts = await Overtime.find({ user: req.user._id });
      const pendingOtCount = userOts.filter(ot => ot.status === 'PENDING').length;
      const approvedOtHours = userOts
        .filter(ot => ot.status === 'APPROVED')
        .reduce((acc, curr) => acc + (curr.requestedHours || 0), 0);

      return res.status(200).json({
        success: true,
        role: 'Employee',
        stats: {
          todayStatus: todaySession ? todaySession.workStatus : 'NOT_STARTED',
          todayHours: todaySession ? todaySession.totalHours : 0,
          todayMinutes: todaySession ? todaySession.totalMinutes : 0,
          punchInTime: todaySession ? todaySession.punchInTime : null,
          punchOutTime: todaySession ? todaySession.punchOutTime : null,
          isPunchedIn: Boolean(todaySession && todaySession.workStatus === 'IN_PROGRESS'),
          weeklyHours: Number(weeklyHours.toFixed(2)),
          totalHoursEver: Number(totalHoursEver.toFixed(2)),
          completedShifts: completedCount,
          incompleteShifts: incompleteCount,
          pendingOvertime: pendingOtCount,
          approvedOvertimeHours: approvedOtHours,
          standardShiftTarget: 8.0
        }
      });
    }

    // 2. Manager Dashboard Stats (Scoped to assigned team)
    if (req.user.role === 'Manager') {
      const teamMembers = await User.find({ managerId: req.user._id }).select('_id name email department');
      const teamIds = teamMembers.map(u => u._id);

      const todayTeamAttendance = await Attendance.find({
        date: today,
        user: { $in: teamIds }
      });

      const activeOnDuty = todayTeamAttendance.filter(r => r.workStatus === 'IN_PROGRESS').length;
      const completedToday = todayTeamAttendance.filter(r => r.workStatus === 'COMPLETED').length;
      const incompleteToday = todayTeamAttendance.filter(r => r.workStatus === 'INCOMPLETE').length;

      const totalHoursToday = todayTeamAttendance.reduce((acc, curr) => acc + (curr.totalHours || 0), 0);
      const finishedTodayCount = completedToday + incompleteToday;
      const avgHoursToday = finishedTodayCount > 0 ? Number((totalHoursToday / finishedTodayCount).toFixed(2)) : 0;

      const teamSize = teamMembers.length;
      const attendanceRate = teamSize > 0 ? Math.round((todayTeamAttendance.length / teamSize) * 100) : 0;

      // Pending verification actions for team
      const pendingVerifications = await Attendance.countDocuments({
        user: { $in: teamIds },
        workStatus: { $ne: 'IN_PROGRESS' },
        verificationStatus: 'PENDING'
      });

      // Pending overtime requests for team
      const pendingOvertime = await Overtime.countDocuments({
        user: { $in: teamIds },
        status: 'PENDING'
      });

      return res.status(200).json({
        success: true,
        role: 'Manager',
        stats: {
          teamSize,
          todayAttendanceCount: todayTeamAttendance.length,
          activeOnDuty,
          completedToday,
          incompleteToday,
          attendanceRate,
          totalHoursToday: Number(totalHoursToday.toFixed(2)),
          avgHoursToday,
          pendingVerifications,
          pendingOvertime
        }
      });
    }

    // 3. Admin Dashboard Stats (Company-Wide)
    if (req.user.role === 'Admin') {
      const totalEmployees = await User.countDocuments({ role: 'Employee', isActive: true });
      const totalManagers = await User.countDocuments({ role: 'Manager', isActive: true });
      const unassignedEmployees = await User.countDocuments({ role: 'Employee', managerId: null, isActive: true });

      const todayAllAttendance = await Attendance.find({ date: today });
      const activeOnDuty = todayAllAttendance.filter(r => r.workStatus === 'IN_PROGRESS').length;
      const completedToday = todayAllAttendance.filter(r => r.workStatus === 'COMPLETED').length;
      const incompleteToday = todayAllAttendance.filter(r => r.workStatus === 'INCOMPLETE').length;

      const totalHoursToday = todayAllAttendance.reduce((acc, curr) => acc + (curr.totalHours || 0), 0);
      const finishedCount = completedToday + incompleteToday;
      const avgHoursToday = finishedCount > 0 ? Number((totalHoursToday / finishedCount).toFixed(2)) : 0;

      const attendanceRate = totalEmployees > 0 ? Math.round((todayAllAttendance.length / totalEmployees) * 100) : 0;

      const pendingVerifications = await Attendance.countDocuments({
        workStatus: { $ne: 'IN_PROGRESS' },
        verificationStatus: 'PENDING'
      });

      const pendingOvertime = await Overtime.countDocuments({
        status: 'PENDING'
      });

      return res.status(200).json({
        success: true,
        role: 'Admin',
        stats: {
          totalEmployees,
          totalManagers,
          unassignedEmployees,
          todayAttendanceCount: todayAllAttendance.length,
          activeOnDuty,
          completedToday,
          incompleteToday,
          attendanceRate,
          totalHoursToday: Number(totalHoursToday.toFixed(2)),
          avgHoursToday,
          pendingVerifications,
          pendingOvertime
        }
      });
    }

    res.status(400).json({ success: false, message: 'Invalid role' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDailyReport,
  getDashboardStats
};
