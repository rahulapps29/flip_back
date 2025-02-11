const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const multer = require('multer');
const { authenticateToken, verifyFormToken } = require('../middleware/authMiddleware');

const upload = multer({ dest: 'uploads/' });

// Admin Protected Routes
router.post('/bulk-upload', authenticateToken, upload.single('file'), uploadController.bulkUpload);


module.exports = router;
