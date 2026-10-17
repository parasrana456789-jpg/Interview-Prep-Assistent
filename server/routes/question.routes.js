const router = require('express').Router();
const c = require('../controllers/question.controller');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);
router.get('/', c.list);
router.post('/', adminOnly, c.create);
router.put('/:id', adminOnly, c.update);
router.delete('/:id', adminOnly, c.remove);

module.exports = router;
