const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { saveSelfieImage } = require('../utils/imageStorage');

// Format date helper: YYYY-MM-DD
const getFormattedDate = (date = new Date()) => {
  return date.toISOString().split('T')[0];
};

// @desc    Get current attendance status for logged-in user
// @route   GET /api/attendance/status
// @access  Private
const getAttendanceStatus = async (req, res, next) => {
  try {
    const today = getFormattedDate();

    // Find any ongoing open session
    const activeSession = await Attendance.findOne({
      user: req.user._id,
      workStatus: 'IN_PROGRESS'
    });

    // Find today's latest session if any
    const latestToday = await Attendance.findOne({
      user: req.user._id,
      date: today
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      hasActiveSession: Boolean(activeSession),
      activeSession,
      latestToday
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Punch In with live camera selfie & location
// @route   POST /api/attendance/punch-in
// @access  Private
const punchIn = async (req, res, next) => {
  try {
    const { latitude, longitude, accuracy, selfie } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Location coordinates (latitude and longitude) are required for punch-in.'
      });
    }

    if (!selfie) {
      return res.status(400).json({
        success: false,
        message: 'A live camera selfie is required for punch-in. File uploads are not permitted.'
      });
    }

    // Check for an already active session
    const existingSession = await Attendance.findOne({
      user: req.user._id,
      workStatus: 'IN_PROGRESS'
    });

    if (existingSession) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active punch-in session. Please punch out before punching in again.'
      });
    }

    // Process and store the selfie image
    const selfieUrl = await saveSelfieImage(selfie, 'punch-in');

    const punchInTime = new Date();
    const dateStr = getFormattedDate(punchInTime);

    const attendance = await Attendance.create({
      user: req.user._id,
      date: dateStr,
      punchInTime,
      punchInLocation: {
        latitude: Number(latitude),
        longitude: Number(longitude),
        accuracy: Number(accuracy || 0)
      },
      punchInSelfie: selfieUrl,
      workStatus: 'IN_PROGRESS',
      verificationStatus: 'PENDING'
    });

    res.status(201).json({
      success: true,
      message: 'Punched in successfully.',
      attendance
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Punch Out with live camera selfie & location, calculate hours
// @route   POST /api/attendance/punch-out
// @access  Private
const punchOut = async (req, res, next) => {
  try {
    const { latitude, longitude, accuracy, selfie } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Location coordinates are required for punch-out.'
      });
    }

    if (!selfie) {
      return res.status(400).json({
        success: false,
        message: 'A live camera selfie is required for punch-out. File uploads are not permitted.'
      });
    }

    // Find active session
    const session = await Attendance.findOne({
      user: req.user._id,
      workStatus: 'IN_PROGRESS'
    });

    if (!session) {
      return res.status(400).json({
        success: false,
        message: 'No active punch-in session found to punch out.'
      });
    }

    // Process selfie
    const selfieUrl = await saveSelfieImage(selfie, 'punch-out');

    const punchOutTime = new Date();

    // Server-side duration calculation
    const durationMs = punchOutTime.getTime() - new Date(session.punchInTime).getTime();
    const totalMinutes = Math.max(0, Math.round(durationMs / (1000 * 60)));
    const totalHours = Number((totalMinutes / 60).toFixed(2));

    // Standard Shift threshold: 8 hours
    const workStatus = totalHours >= 8.0 ? 'COMPLETED' : 'INCOMPLETE';

    session.punchOutTime = punchOutTime;
    session.punchOutLocation = {
      latitude: Number(latitude),
      longitude: Number(longitude),
      accuracy: Number(accuracy || 0)
    };
    session.punchOutSelfie = selfieUrl;
    session.totalHours = totalHours;
    session.totalMinutes = totalMinutes;
    session.workStatus = workStatus;

    await session.save();

    res.status(200).json({
      success: true,
      message: `Punched out successfully. Total hours: ${totalHours} hrs (${workStatus}).`,
      attendance: session
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get personal attendance history
// @route   GET /api/attendance/my-history
// @access  Private
const getMyHistory = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    let query = { user: req.user._id };

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.date = { $gte: startDate };
    }

    const records = await Attendance.find(query).sort({ punchInTime: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      records
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get team attendance (Manager: assigned team; Admin: all)
// @route   GET /api/attendance/team
// @access  Private/Manager or Admin
const getTeamAttendance = async (req, res, next) => {
  try {
    const { date, status, verificationStatus } = req.query;
    let userFilter = {};

    if (req.user.role === 'Manager') {
      const teamUsers = await User.find({ managerId: req.user._id }).select('_id');
      const teamUserIds = teamUsers.map(u => u._id);
      userFilter = { $in: teamUserIds };
    } else if (req.user.role === 'Admin' && req.query.managerId) {
      const teamUsers = await User.find({ managerId: req.query.managerId }).select('_id');
      const teamUserIds = teamUsers.map(u => u._id);
      userFilter = { $in: teamUserIds };
    }

    let query = {};
    if (Object.keys(userFilter).length > 0) {
      query.user = userFilter;
    }

    if (date) query.date = date;
    if (status) query.workStatus = status;
    if (verificationStatus) query.verificationStatus = verificationStatus;

    const records = await Attendance.find(query)
      .populate('user', 'name email department managerId')
      .populate('verifiedBy', 'name email')
      .sort({ punchInTime: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      records
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all attendance (Admin only)
// @route   GET /api/attendance/all
// @access  Private/Admin
const getAllAttendance = async (req, res, next) => {
  try {
    const { date, status, verificationStatus } = req.query;
    let query = {};

    if (date) query.date = date;
    if (status) query.workStatus = status;
    if (verificationStatus) query.verificationStatus = verificationStatus;

    const records = await Attendance.find(query)
      .populate('user', 'name email department')
      .populate('verifiedBy', 'name email')
      .sort({ punchInTime: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      records
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify attendance (Mark Valid/Invalid with remarks)
// @route   PATCH /api/attendance/:id/verify
// @access  Private/Manager or Admin
const verifyAttendance = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    const attendanceId = req.params.id;

    if (!status || !['VALID', 'INVALID'].includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'VALID' or 'INVALID'."
      });
    }

    const attendance = await Attendance.findById(attendanceId).populate('user');
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found.'
      });
    }

    // Resource Authorization Check for Managers: Must be assigned manager
    if (req.user.role === 'Manager') {
      const isAssigned = attendance.user.managerId &&
        attendance.user.managerId.toString() === req.user._id.toString();

      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only verify attendance records for your assigned team members.'
        });
      }
    }

    attendance.verificationStatus = status.toUpperCase();
    attendance.verificationRemarks = remarks || '';
    attendance.verifiedBy = req.user._id;
    attendance.verifiedAt = new Date();

    await attendance.save();

    res.status(200).json({
      success: true,
      message: `Attendance marked as ${attendance.verificationStatus}.`,
      attendance
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAttendanceStatus,
  punchIn,
  punchOut,
  getMyHistory,
  getTeamAttendance,
  getAllAttendance,
  verifyAttendance
};
