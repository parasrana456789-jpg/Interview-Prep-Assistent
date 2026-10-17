const router = require('express').Router();
const c = require('../controllers/interview.controller');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/start', c.start);
router.post('/submit', c.submit);
router.get('/history', c.history);
router.get('/:id', c.getOne);

module.exports = router;
