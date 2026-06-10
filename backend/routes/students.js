const express    = require('express');
const router     = express.Router();
const { getProfile, getAllStudents } = require('../controllers/studentController');
const { authenticate, requireStudent, requireCoordinator } = require('../middleware/auth');

router.get('/profile', authenticate, requireStudent, getProfile);
router.get('/', authenticate, requireCoordinator, getAllStudents);

module.exports = router;