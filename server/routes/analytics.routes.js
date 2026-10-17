const router = require('express').Router();
const c = require('../controllers/analytics.controller');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/dashboard', c.dashboard);
router.get('/progress', c.progress);

module.exports = router;
