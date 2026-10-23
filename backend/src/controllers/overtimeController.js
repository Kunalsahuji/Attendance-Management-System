const Overtime = require('../models/Overtime');
const User = require('../models/User');
const Attendance = require('../models/Attendance');

// @desc    Submit an overtime request
// @route   POST /api/overtime/request
// @access  Private
const submitOvertimeRequest = async (req, res, next) => {
  try {
    const { date, requestedHours, reason, attendanceId } = req.body;

    if (!date || !requestedHours || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide date, requested hours, and reason.'
      });
    }

    if (Number(requestedHours) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Requested hours must be greater than zero.'
      });
    }

    // Check if an overtime request for this date already exists for user
    const existing = await Overtime.findOne({
      user: req.user._id,
      date,
      status: 'PENDING'
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A pending overtime request already exists for this date.'
      });
    }

    const overtime = await Overtime.create({
      user: req.user._id,
      date,
      requestedHours: Number(requestedHours),
      reason,
      attendance: attendanceId || null,
      status: 'PENDING'
    });

    res.status(201).json({
      success: true,
      message: 'Overtime request submitted successfully.',
      overtime
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get personal overtime requests
// @route   GET /api/overtime/my-requests
// @access  Private
const getMyOvertimeRequests = async (req, res, next) => {
  try {
    const requests = await Overtime.find({ user: req.user._id })
      .populate('reviewedBy', 'name email')
      .populate('attendance', 'punchInTime punchOutTime totalHours workStatus')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get team overtime requests (Manager: assigned team; Admin: all)
// @route   GET /api/overtime/team-requests
// @access  Private/Manager or Admin
const getTeamOvertimeRequests = async (req, res, next) => {
  try {
    const { status, date } = req.query;
    let userFilter = {};

    if (req.user.role === 'Manager') {
      const teamUsers = await User.find({ managerId: req.user._id }).select('_id');
      const teamIds = teamUsers.map(u => u._id);
      userFilter = { $in: teamIds };
    } else if (req.user.role === 'Admin' && req.query.managerId) {
      const teamUsers = await User.find({ managerId: req.query.managerId }).select('_id');
      const teamIds = teamUsers.map(u => u._id);
      userFilter = { $in: teamIds };
    }

    let query = {};
    if (Object.keys(userFilter).length > 0) {
      query.user = userFilter;
    }
    if (status) query.status = status.toUpperCase();
    if (date) query.date = date;

    const requests = await Overtime.find(query)
      .populate('user', 'name email department managerId')
      .populate('reviewedBy', 'name email')
      .populate('attendance', 'punchInTime punchOutTime totalHours workStatus')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or reject overtime request
// @route   PATCH /api/overtime/:id/review
// @access  Private/Manager or Admin
const reviewOvertimeRequest = async (req, res, next) => {
  try {
    const { status, reviewerNotes } = req.body;
    const overtimeId = req.params.id;

    if (!status || !['APPROVED', 'REJECTED'].includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Decision must be either 'APPROVED' or 'REJECTED'."
      });
    }

    const overtime = await Overtime.findById(overtimeId).populate('user');
    if (!overtime) {
      return res.status(404).json({
        success: false,
        message: 'Overtime request not found.'
      });
    }

    // Resource Authorization Check for Managers: Must be assigned manager
    if (req.user.role === 'Manager') {
      const isAssigned = overtime.user.managerId &&
        overtime.user.managerId.toString() === req.user._id.toString();

      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only review overtime requests for your assigned team members.'
        });
      }
    }

    overtime.status = status.toUpperCase();
    overtime.reviewerNotes = reviewerNotes || '';
    overtime.reviewedBy = req.user._id;
    overtime.reviewedAt = new Date();

    await overtime.save();

    res.status(200).json({
      success: true,
      message: `Overtime request has been ${overtime.status.toLowerCase()}.`,
      overtime
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitOvertimeRequest,
  getMyOvertimeRequests,
  getTeamOvertimeRequests,
  reviewOvertimeRequest
};
