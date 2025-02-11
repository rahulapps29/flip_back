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
    cc: employee.managerEmailId,
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


// -----------------------------------
// 6) Send Emails to All Employees
// -----------------------------------
const sendEmails = async (req, res) => {
  try {
    const employees = await Employee.find();

    await Promise.all(employees.map(sendEmail));

    res.json({ message: 'Emails sent successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Error sending emails.', error: err });
  }
};

module.exports = {
  sendEmails
};
