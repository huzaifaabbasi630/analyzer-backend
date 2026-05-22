const express = require('express');
const {
  getMe,
  updateDetails,
  deleteAccount,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/profile', getMe);
router.put('/profile', updateDetails);
router.delete('/profile', deleteAccount);

module.exports = router;
