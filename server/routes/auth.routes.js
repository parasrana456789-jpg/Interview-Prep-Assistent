const router = require('express').Router();
const c = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

router.post('/register', c.register);
router.post('/login', c.login);
router.post('/forgot-password', c.forgotPassword);
router.post('/reset-password/:token', c.resetPassword);
router.get('/me', protect, c.me);
router.post('/logout', protect, c.logout);
router.post('/change-password', protect, c.changePassword);

module.exports = router;
