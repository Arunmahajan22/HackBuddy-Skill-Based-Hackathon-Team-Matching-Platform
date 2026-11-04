const express = require('express');
const { getPlatformStats } = require('../controllers/statsController');

const router = express.Router();

// GET /api/stats - Public statistics, top skills & featured openings
router.get('/', getPlatformStats);

module.exports = router;
