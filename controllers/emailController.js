const nodemailer = require('nodemailer');
const generateUniqueLink = require('../utils/linkGenerator');
const Employee = require('../models/Employee');
require('dotenv').config();


// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  

// -----------------------------------
// Send Email to Single Employee
// -----------------------------------
const sendEmail = async (employee) => {
  const uniqueLink = generateUniqueLink(employee.internetEmail, 'email');
  const employeeName = employee.internetEmail.split('@')[0].replace(/\./g, ' ').replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: employee.internetEmail,
    // cc: employee.managerEmailId,
    subject: 'Mandatory: Physical Verification of Company-Issued Laptops – FY 2024-25',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <p>Dear ${employeeName},</p>

        <p>We hope this message finds you well. As part of our annual asset verification process for the fiscal year 2024-25, <strong>Protiviti India Member Private Limited</strong> is conducting a mandatory physical verification of all company-issued laptops. This verification is a statutory requirement under the <em>Companies (Auditor’s Report) Order, 2016 (CARO)</em> to ensure regulatory compliance.</p>

        <p><strong>Required Action:</strong></p>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Verify the Laptop Serial Number</li>
          <li>Confirm Make and Model</li>
          <li>Report the Current Condition of the Laptop</li>
          <li>Provide Any Other Identifying Information</li>
        </ul>

        <p><strong>Steps to Locate the Serial Number:</strong></p>
        <ol style="margin: 0; padding-left: 20px;">
          <li>Press <strong>Windows + R</strong>, type <strong>cmd</strong>, and press Enter.</li>
          <li>In the command prompt, type <strong>wmic bios get serialnumber</strong> and press Enter.</li>
        </ol>

        <p><strong>Submission Deadline:</strong><br>
        Kindly complete and submit the verification form within <strong>one week</strong>, no later than <strong>[Insert Date]</strong>.</p>

        <p><strong>Important Notice:</strong><br>
        Failure to confirm your laptop details by the specified deadline may result in recovery actions as per the Laptop and Desktop Issuance Policy:</p>
        <ul style="margin: 0; padding-left: 20px;">
          <li><strong>INR 1,00,000</strong> for Windows Laptops</li>
          <li><strong>INR 2,00,000</strong> for MacBooks</li>
        </ul>

        <p style="margin: 20px 0;">
          <a href="${uniqueLink}" style="display: inline-block; background-color: #1a73e8; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Complete the Verification Form</a>
        </p>

        <p>We appreciate your prompt attention to this matter. Should you have any queries or require assistance, please do not hesitate to reach out.</p>

        <p>Warm regards,<br>
        <strong>Asset Management Team</strong><br>
        <em>Protiviti India Member Private Limited</em></p>
      </div>
    `
  });

  employee.lastEmailSent = new Date();
  await employee.save();
};


const sendEmails = async (req, res) => {
    const batchSize = parseInt(req.query.batchSize) || 1400; // ✅ Default batch size
  
    try {
      // ✅ Get employees who haven't received an email yet
      const employees = await Employee.find({ emailSent: false }).limit(batchSize);
  
      if (employees.length === 0) {
        return res.json({ message: 'All emails have been sent!' });
      }
  
      // ✅ Send emails one by one
      await Promise.all(employees.map(async (employee) => {
        await sendEmail(employee);
        employee.emailSent = true;  // ✅ Mark as sent
        employee.lastEmailSentAt = new Date(); // ✅ Track time of sending
        await employee.save();
      }));
  
      // ✅ Count remaining emails
      const remainingEmployees = await Employee.countDocuments({ emailSent: false });
  
      res.json({ 
        message: `Sent ${employees.length} emails successfully!`,
        remaining: remainingEmployees
      });
  
    } catch (err) {
      console.error('Error sending emails:', err);
      res.status(500).json({ message: 'Error sending emails.', error: err });
    }
  };
  
  // ✅ API to get remaining email count
  const getRemainingEmails = async (req, res) => {
    try {
      const remaining = await Employee.countDocuments({ emailSent: false });
      res.json({ remaining });
    } catch (err) {
      res.status(500).json({ message: 'Error fetching remaining emails.', error: err.message });
    }
  };

  const getRemainingManagerEmails = async (req, res) => {
    try {
      // ✅ Count employees who have been emailed but whose manager hasn't received the email
      const remainingManagers = await Employee.countDocuments({ managerEmailSent: false });
  
      res.json({ remaining: remainingManagers });
    } catch (err) {
      res.status(500).json({ message: 'Error fetching remaining manager emails.', error: err.message });
    }
  };
  
  
  // ✅ API to reset email statuses manually
  const resetEmailFlags = async (req, res) => {
    try {
      await Employee.updateMany({}, { emailSent: false });
      res.json({ message: 'Employees Email statuses reset successfully!' });
    } catch (err) {
      res.status(500).json({ message: 'Error resetting emails.', error: err.message });
    }
  };
  

  // ✅ Function to send email to employee + manager in CC
  const sendEmailToManager = async (employee) => {
    if (!employee.assets || employee.assets.length === 0) return; // ✅ Skip if no assets assigned
  
    // ✅ Get manager email from the first asset
    const managerEmail = employee.assets[0].managerEmailId; 
  
    if (!managerEmail) return; // ✅ Skip if no manager email
  
    const uniqueLink = generateUniqueLink(employee.internetEmail, 'email');
    const employeeName = employee.internetEmail.split('@')[0].replace(/\./g, ' ').replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: employee.internetEmail,
      cc: managerEmail, // ✅ Now correctly fetching manager's email from first asset
      subject: 'Mandatory: Physical Verification of Company-Issued Laptops – FY 2024-25',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <p>Dear ${employeeName},</p>
  
          <p>We hope this message finds you well. As part of our annual asset verification process for the fiscal year 2024-25, <strong>Protiviti India Member Private Limited</strong> is conducting a mandatory physical verification of all company-issued laptops. This verification is a statutory requirement under the <em>Companies (Auditor’s Report) Order, 2016 (CARO)</em> to ensure regulatory compliance.</p>
          <p>This is a reminder to verify your laptop details. Your manager (${managerEmail}) has been informed.</p>
          <p><strong>Required Action:</strong></p>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Verify the Laptop Serial Number</li>
            <li>Confirm Make and Model</li>
            <li>Report the Current Condition of the Laptop</li>
            <li>Provide Any Other Identifying Information</li>
          </ul>
  
          <p><strong>Steps to Locate the Serial Number:</strong></p>
          <ol style="margin: 0; padding-left: 20px;">
            <li>Press <strong>Windows + R</strong>, type <strong>cmd</strong>, and press Enter.</li>
            <li>In the command prompt, type <strong>wmic bios get serialnumber</strong> and press Enter.</li>
          </ol>
  
          <p><strong>Submission Deadline:</strong><br>
          Kindly complete and submit the verification form within <strong>one week</strong>, no later than <strong>[Insert Date]</strong>.</p>
  
          <p><strong>Important Notice:</strong><br>
          Failure to confirm your laptop details by the specified deadline may result in recovery actions as per the Laptop and Desktop Issuance Policy:</p>
          <ul style="margin: 0; padding-left: 20px;">
            <li><strong>INR 1,00,000</strong> for Windows Laptops</li>
            <li><strong>INR 2,00,000</strong> for MacBooks</li>
          </ul>
  
          <p style="margin: 20px 0;">
            <a href="${uniqueLink}" style="display: inline-block; background-color: #1a73e8; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Complete the Verification Form</a>
          </p>
  
          <p>We appreciate your prompt attention to this matter. Should you have any queries or require assistance, please do not hesitate to reach out.</p>
  
          <p>Warm regards,<br>
          <strong>Asset Management Team</strong><br>
          <em>Protiviti India Member Private Limited</em></p>
        </div>
      `
    });
  
    employee.managerEmailSent = true;
    employee.lastManagerEmailSentAt = new Date();
    await employee.save();
  };
  
  
  // ✅ API to send emails to employees and CC managers
  const sendEmailsToManagers = async (req, res) => {
    const batchSize = parseInt(req.query.batchSize) || 1400;
  
    try {
      // ✅ Find employees who have received emails but their managers haven't been CC’d
      // const employees = await Employee.find({ emailSent: true, managerEmailSent: false }).limit(batchSize);
      const employees = await Employee.find({  managerEmailSent: false }).limit(batchSize);
  
      if (employees.length === 0) {
        return res.json({ message: 'All manager CC emails have been sent!' });
      }
  
      // ✅ Send emails to managers in parallel
      await Promise.all(employees.map(sendEmailToManager));
  
      // ✅ Count remaining employees whose managers haven't been CC’d
      const remainingManagers = await Employee.countDocuments({ managerEmailSent: false });
  
      res.json({ message: `Sent ${employees.length} emails successfully to managers!`, remaining: remainingManagers });
  
    } catch (err) {
      console.error('Error sending emails to managers:', err);
      res.status(500).json({ message: 'Error sending emails to managers.', error: err });
    }
  };
  

  // ✅ Reset manager email statuses separately
  const resetManagerEmailFlags = async (req, res) => {
    try {
      await Employee.updateMany({}, { managerEmailSent: false });
      res.json({ message: 'Manager email statuses reset successfully!' });
    } catch (err) {
      res.status(500).json({ message: 'Error resetting manager emails.', error: err.message });
    }
  };
  
  module.exports = { sendEmails, getRemainingEmails, resetEmailFlags ,resetManagerEmailFlags, sendEmailsToManagers, getRemainingManagerEmails};