const router = require('express').Router();
const c = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');

router.post('/register', validate(c.registerSchema), c.register);
router.post('/login', validate(c.loginSchema), c.login);
router.get('/me', protect, c.me);
router.patch('/me', protect, validate(c.profileSchema), c.updateMe);

module.exports = router;
