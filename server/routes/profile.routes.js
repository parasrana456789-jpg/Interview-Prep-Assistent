const router = require('express').Router();
const c = require('../controllers/profile.controller');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);
router.get('/', c.getProfile);
router.put('/', c.updateProfile);
router.post('/avatar', upload.single('avatar'), c.uploadAvatar);
router.delete('/avatar', c.removeAvatar);

module.exports = router;
