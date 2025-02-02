const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const multer = require('multer');
const verifyToken = require('../middleware/authMiddleware'); // Import the middleware

const upload = multer({ dest: 'uploads/' });

router.post('/bulk-upload', upload.single('file'), employeeController.bulkUpload);
router.post('/submit-form', employeeController.submitForm);
router.get('/dashboard', employeeController.getDashboard);
router.delete('/delete-all', employeeController.deleteAllEmployees);
router.post('/send-emails', employeeController.sendEmails);
// New routes for deleting and updating a single employee
router.delete('/employee/:id', employeeController.deleteEmployee);
router.put('/employee/:id', employeeController.updateEmployee);


// Add a new route for accessing the form
router.get('/form', verifyToken, employeeController.getForm);

module.exports = router;