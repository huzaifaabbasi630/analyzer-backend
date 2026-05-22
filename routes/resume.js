const express = require('express');
const {
  uploadResume,
  getResumeHistory,
  getResume,
  saveBuiltResume,
} = require('../controllers/resumeController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect);

router.post('/upload', upload.single('resume'), uploadResume);
router.post('/save-built', saveBuiltResume);
router.get('/history', getResumeHistory);
router.get('/:id', getResume);

module.exports = router;
