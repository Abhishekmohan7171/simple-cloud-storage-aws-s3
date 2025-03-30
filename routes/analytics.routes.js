const express = require('express');
const router = express.Router();
const { 
  getStorageAnalytics, 
  getAccessAnalytics 
} = require('../controllers/analytics.controller');
const { protect } = require('../middleware/auth');

router.get('/storage', protect, getStorageAnalytics);
router.get('/access', protect, getAccessAnalytics);

module.exports = router;