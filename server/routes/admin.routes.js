const router = require('express').Router();
const c = require('../controllers/admin.controller');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);
router.get('/overview', c.overview);
router.get('/users', c.users);
router.patch('/users/:id', c.updateUser);
router.delete('/users/:id', c.deleteUser);
router.get('/reports', c.reports);

module.exports = router;
