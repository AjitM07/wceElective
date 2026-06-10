const express    = require('express');
const router     = express.Router();
const {
  studentLogin,
  coordinatorLogin,
  getMe,
  loginValidation,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/student/login', loginValidation, studentLogin);
router.post('/coordinator/login', loginValidation, coordinatorLogin);
router.get('/me', authenticate, getMe);

module.exports = router;