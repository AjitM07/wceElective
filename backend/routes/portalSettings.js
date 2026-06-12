const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/portalSettingsController');
const { authenticate, requireCoordinator } = require('../middleware/auth');

// Both students and coordinators can view the settings (authenticated)
router.get('/', authenticate, getSettings);

// Only coordinators can update the settings
router.post('/', authenticate, requireCoordinator, updateSettings);

module.exports = router;
