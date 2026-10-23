const User = require('../models/User');

// @desc    Get all users (Admin only)
// @route   GET /api/users/all
// @access  Private/Admin
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .populate('managerId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get list of managers (for assignments/signup)
// @route   GET /api/users/managers
// @access  Public (or authenticated)
const getManagers = async (req, res, next) => {
  try {
    const managers = await User.find({ role: 'Manager', isActive: true })
      .select('_id name email department');

    res.status(200).json({
      success: true,
      managers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get team members assigned to current Manager
// @route   GET /api/users/team-members
// @access  Private/Manager or Admin
const getTeamMembers = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'Manager') {
      query.managerId = req.user._id;
    } else if (req.user.role === 'Admin') {
      if (req.query.managerId) {
        query.managerId = req.query.managerId;
      }
    }

    const team = await User.find(query).select('-password');

    res.status(200).json({
      success: true,
      count: team.length,
      team
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign manager to an employee (Admin only)
// @route   PATCH /api/users/:id/assign-manager
// @access  Private/Admin
const assignManager = async (req, res, next) => {
  try {
    const { managerId } = req.body;
    const employeeId = req.params.id;

    if (managerId) {
      const manager = await User.findById(managerId);
      if (!manager || (manager.role !== 'Manager' && manager.role !== 'Admin')) {
        return res.status(400).json({
          success: false,
          message: 'Target user must have Manager or Admin role.'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      employeeId,
      { managerId: managerId || null },
      { new: true, runValidators: true }
    ).populate('managerId', 'name email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Manager assigned successfully.',
      user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getManagers,
  getTeamMembers,
  assignManager
};
