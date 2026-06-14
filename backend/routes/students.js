const express    = require('express');
const router     = express.Router();
const { getProfile, getAllStudents, verifyProfile, getElectives, savePreferences } = require('../controllers/studentController');
const { authenticate, requireStudent, requireCoordinator } = require('../middleware/auth');

router.get('/profile', authenticate, requireStudent, getProfile);
router.put('/verify-profile', authenticate, requireStudent, verifyProfile);
router.get('/electives', authenticate, requireStudent, getElectives);
router.post('/preferences', authenticate, requireStudent, savePreferences);
router.get('/', authenticate, requireCoordinator, getAllStudents);

module.exports = router;