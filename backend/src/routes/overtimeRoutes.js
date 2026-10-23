const express = require('express');
const router = express.Router();
const {
  submitOvertimeRequest,
  getMyOvertimeRequests,
  getTeamOvertimeRequests,
  reviewOvertimeRequest
} = require('../controllers/overtimeController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.post('/request', protect, submitOvertimeRequest);
router.get('/my-requests', protect, getMyOvertimeRequests);
router.get('/team-requests', protect, authorizeRoles('Manager', 'Admin'), getTeamOvertimeRequests);
router.patch('/:id/review', protect, authorizeRoles('Manager', 'Admin'), reviewOvertimeRequest);

module.exports = router;
