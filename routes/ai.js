const express = require('express');
const {
  analyzeResume,
  analyzeSkillGap,
  jobMatch,
  generateQuestions,
  generateResumeFromAI,
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/analyze-resume', analyzeResume);
router.post('/skill-gap', analyzeSkillGap);
router.post('/job-match', jobMatch);
router.post('/interview-questions', generateQuestions);
router.post('/generate-resume', generateResumeFromAI);

module.exports = router;
