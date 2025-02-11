const Employee = require('../models/Employee'); // Import Employee model
require('dotenv').config();


// Fetch maximum lastEmailSentAt and lastManagerEmailSentAt timestamps
const getMaxEmailSentTimes = async (req, res) => {
  try {
    // Find the latest timestamp for employee emails
    const latestEmployeeEmail = await Employee.findOne().sort({ lastEmailSentAt: -1 }).select('lastEmailSentAt');
    
    // Find the latest timestamp for manager emails
    const latestManagerEmail = await Employee.findOne().sort({ lastManagerEmailSentAt: -1 }).select('lastManagerEmailSentAt');

    // Extract timestamps or return null if not found
    const lastEmailSentAt = latestEmployeeEmail ? latestEmployeeEmail.lastEmailSentAt : null;
    const lastManagerEmailSentAt = latestManagerEmail ? latestManagerEmail.lastManagerEmailSentAt : null;

    return res.status(200).json({
      lastEmailSentAt,
      lastManagerEmailSentAt
    });

  } catch (error) {
    console.error('Error fetching max email sent times:', error);
    return res.status(500).json({ message: 'Server error fetching max email sent times.' });
  }
};

module.exports = { getMaxEmailSentTimes };

