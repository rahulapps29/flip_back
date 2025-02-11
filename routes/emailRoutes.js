const express = require('express');
const router = express.Router();

const emailController = require('../controllers/emailController');
const multer = require('multer');
const { authenticateToken, verifyFormToken } = require('../middleware/authMiddleware');

const upload = multer({ dest: 'uploads/' });

// Admin Protected Routes
router.post('/send-emails', authenticateToken, emailController.sendEmails);

module.exports = router;
