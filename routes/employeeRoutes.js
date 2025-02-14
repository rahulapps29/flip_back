const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeeController");
const multer = require("multer");
const {
  authenticateToken,
  verifyFormToken,
} = require("../middleware/authMiddleware");

const upload = multer({ dest: "uploads/" });

// Admin Protected Routes
// router.post('/bulk-upload', authenticateToken, upload.single('file'), employeeController.bulkUpload);
router.get("/dashboard", authenticateToken, employeeController.getDashboard);
router.delete(
  "/delete-all",
  authenticateToken,
  employeeController.deleteAllEmployees,
);
router.delete(
  "/employee/:id",
  authenticateToken,
  employeeController.deleteEmployee,
);
router.put(
  "/employee/:id",
  authenticateToken,
  employeeController.updateEmployee,
);
router.get(
  "/employee-assets",
  verifyFormToken,
  employeeController.getEmployeeAssets,
);

// Form Submission Routes (No Authentication Required)
router.post("/submit-form", employeeController.submitForm);
router.get("/form", verifyFormToken, employeeController.getForm);

module.exports = router;
