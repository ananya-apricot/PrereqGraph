const router = require('express').Router();
const c = require('../controllers/conceptController');
const { protect, requireRole } = require('../middleware/authMiddleware');
const { validate, validateIds } = require('../middleware/validationMiddleware');

router.use(protect);
router.get('/:id', validateIds('id'), c.getConcept);
router.get('/:id/graph', validateIds('id'), c.getConceptGraph);
router.get('/:id/prerequisites', validateIds('id'), c.getPrerequisites);
router.get('/:id/quiz', validateIds('id'), c.getConceptQuiz);
// admin-managed curriculum
router.post('/', requireRole('admin'), validate(c.conceptSchema), c.createConcept);

module.exports = router;
