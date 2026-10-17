const router = require('express').Router();
const c = require('../controllers/resume.controller');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', c.get);
router.get('/from-profile', c.fromProfile);
router.get('/pdf', c.pdf);
router.put('/', c.save);
router.post('/ai-summary', c.aiSummary);

module.exports = router;
