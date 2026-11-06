const router = require('express').Router();
const c = require('../controllers/subjectController');
const { protect, requireRole } = require('../middleware/authMiddleware');
const { validate, validateIds } = require('../middleware/validationMiddleware');

router.use(protect);
router.get('/', c.listSubjects);
router.get('/:id/concepts', validateIds('id'), c.getSubjectConcepts);
router.get('/:id/graph', validateIds('id'), c.getSubjectGraph);
router.post('/', requireRole('admin'), validate(c.subjectSchema), c.createSubject);

module.exports = router;
