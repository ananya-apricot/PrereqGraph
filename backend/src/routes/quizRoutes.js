const router = require('express').Router();
const c = require('../controllers/quizController');
const { protect } = require('../middleware/authMiddleware');
const { validate, validateIds } = require('../middleware/validationMiddleware');

router.use(protect);
router.get('/:id', validateIds('id'), c.getQuiz);
router.post('/:id/submit', validateIds('id'), validate(c.submitSchema), c.submit);

module.exports = router;
