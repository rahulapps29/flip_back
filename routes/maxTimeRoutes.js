const express = require('express');
const router = express.Router();
const { authenticateToken, verifyFormToken } = require('../middleware/authMiddleware');


const { getMaxEmailSentTimes } = require('../controllers/maxTimeController'); // Import controller

router.get('/max-email-times', authenticateToken, getMaxEmailSentTimes);

module.exports = router;



