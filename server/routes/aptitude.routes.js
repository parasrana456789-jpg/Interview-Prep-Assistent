const router = require('express').Router();
const c = require('../controllers/aptitude.controller');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/generate', c.generate);
router.post('/submit', c.submit);
router.get('/history', c.history);
router.get('/:id', c.getOne);

module.exports = router;
