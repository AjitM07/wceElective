const express    = require('express');
const router     = express.Router();
const { getDashboard, allocateElective } = require('../controllers/coordinatorController');
const { authenticate, requireCoordinator } = require('../middleware/auth');

router.get('/dashboard', authenticate, requireCoordinator, getDashboard);
router.post('/allocate', authenticate, requireCoordinator, allocateElective);

module.exports = router;