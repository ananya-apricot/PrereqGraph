const router = require('express').Router();
const c = require('../controllers/conceptController');
const { protect, requireRole } = require('../middleware/authMiddleware');
const { validate, validateIds } = require('../middleware/validationMiddleware');

// Admin only. Creating a dependency runs cycle detection first.
router.use(protect, requireRole('admin'));
router.post('/', validate(c.dependencySchema), c.createDependency);
router.delete('/:id', validateIds('id'), c.deleteDependency);

module.exports = router;
