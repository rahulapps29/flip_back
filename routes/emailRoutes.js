const express = require("express");
const router = express.Router();

const {
  sendEmails,
  getRemainingEmails,
  resetEmailFlags,
  sendEmailsToManagers,
  resetManagerEmailFlags,
  getRemainingManagerEmails,
} = require("../controllers/emailController");
const multer = require("multer");
const {
  authenticateToken,
  verifyFormToken,
} = require("../middleware/authMiddleware");

const upload = multer({ dest: "uploads/" });

// Admin Protected Routes
router.post("/send-emails", authenticateToken, sendEmails);
// ✅ Route to get remaining email count
router.get("/remaining-emails", authenticateToken, getRemainingEmails);
// ✅ Route to manually reset email statuses
router.post("/reset-email-status", authenticateToken, resetEmailFlags);
router.get(
  "/remaining-manager-emails",
  authenticateToken,
  getRemainingManagerEmails,
);

// ✅ Route to send emails to managers (after employees)
router.post(
  "/send-emails-to-managers",
  authenticateToken,
  sendEmailsToManagers,
);

// ✅ Route to reset manager email statuses
router.post(
  "/reset-manager-email-status",
  authenticateToken,
  resetManagerEmailFlags,
);

module.exports = router;
