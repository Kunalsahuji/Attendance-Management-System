const express = require('express');
const router = express.Router();
const {
  getAttendanceStatus,
  punchIn,
  punchOut,
  getMyHistory,
  getTeamAttendance,
  getAllAttendance,
  verifyAttendance
} = require('../controllers/attendanceController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.get('/status', protect, getAttendanceStatus);
router.post('/punch-in', protect, authorizeRoles('Employee'), punchIn);
router.post('/punch-out', protect, authorizeRoles('Employee'), punchOut);
router.get('/my-history', protect, getMyHistory);

router.get('/team', protect, authorizeRoles('Manager', 'Admin'), getTeamAttendance);
router.get('/all', protect, authorizeRoles('Admin'), getAllAttendance);
router.patch('/:id/verify', protect, authorizeRoles('Manager', 'Admin'), verifyAttendance);

module.exports = router;
