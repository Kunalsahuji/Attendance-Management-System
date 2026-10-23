const express = require('express');
const router = express.Router();
const { getDailyReport, getDashboardStats } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.get('/dashboard-stats', protect, getDashboardStats);
router.get('/daily', protect, getDailyReport);

module.exports = router;
