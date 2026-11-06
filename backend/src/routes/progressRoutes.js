const router = require('express').Router();
const c = require('../controllers/progressController');
const { protect } = require('../middleware/authMiddleware');
const { validate, validateIds } = require('../middleware/validationMiddleware');

// mounted at /api/users/me
router.use(protect);
router.get('/dashboard', c.getDashboard);
router.get('/progress', c.getProgress);
router.get('/attempts', c.getAttempts);
router.get('/learning-path/:targetId', validateIds('targetId'), c.getLearningPath);
router.patch('/progress/:conceptId', validateIds('conceptId'), validate(c.updateSchema), c.updateProgress);

module.exports = router;
