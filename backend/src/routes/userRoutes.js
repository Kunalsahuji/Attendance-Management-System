const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getManagers,
  getTeamMembers,
  assignManager
} = require('../controllers/userController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.get('/managers', getManagers);
router.get('/team-members', protect, authorizeRoles('Manager', 'Admin'), getTeamMembers);
router.get('/all', protect, authorizeRoles('Admin'), getAllUsers);
router.patch('/:id/assign-manager', protect, authorizeRoles('Admin'), assignManager);

module.exports = router;
