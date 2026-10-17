const router = require('express').Router();
const c = require('../controllers/coding.controller');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/generate', c.generate);
router.post('/run', c.run);
router.post('/analyze', c.analyze);
router.post('/submit', c.submit);
router.get('/history', c.history);
router.get('/:id', c.getOne);

module.exports = router;
