const Employee = require('../models/Employee');
const nodemailer = require('nodemailer');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const generateUniqueLink = require('../utils/linkGenerator'); // Import the utility
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// -----------------------------------
// 1) Bulk Upload Function
// -----------------------------------
const bulkUpload = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  const filePath = req.file.path;
  const employees = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      const employee = {};

      // Dynamically map all columns to arrays except internetEmail
      Object.keys(row).forEach((key) => {
        if (key === 'internetEmail') {
          // Keep internetEmail as string
          employee[key] = row[key];
        } else {
          // Convert to an array (single element by default)
          // If you expect multiple comma-separated values, you could do row[key].split(',')
          employee[key] = row[key] ? [row[key]] : [];
        }
      });

      employees.push(employee);
    })
    .on('end', async () => {
      try {
        const bulkOps = employees.map((employee) => ({
          updateOne: {
            filter: { internetEmail: employee.internetEmail },
            update: { $set: employee },
            upsert: true,
          },
        }));

        await Employee.bulkWrite(bulkOps);
        res
          .status(200)
          .json({ message: 'Bulk upload successful!', count: employees.length });
      } catch (err) {
        console.error('Error in bulk write:', err);
        res
          .status(500)
          .json({ message: 'Error uploading employees.', error: err.message });
      } finally {
        fs.unlinkSync(filePath);
      }
    })
    .on('error', (err) => {
      console.error('Error reading CSV file:', err);
      res
        .status(500)
        .json({ message: 'Error processing CSV file.', error: err.message });
    });
};

// -----------------------------------
// 2) Helper: Send Email to Single Employee
// -----------------------------------
const sendEmail = async (employee) => {
  // Because serialNumber is now an array, safely pick the first element
  const sn = employee.serialNumber && employee.serialNumber.length > 0
    ? employee.serialNumber[0]
    : 'UnknownSN';

  const uniqueLink = generateUniqueLink(sn, 'serialNumber');
  
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: employee.internetEmail,
    subject: 'Form Submission Request',
    text: `Please fill out the form using this link: ${uniqueLink}`,
  });
  
  employee.lastEmailSent = new Date();
  await employee.save();
};

// -----------------------------------
// 3) Submit Form (Reconcile Data)
// -----------------------------------
const submitForm = async (req, res) => {
  const { token, formDetails, serialNumber } = req.body;
  console.log({ formDetails }, serialNumber);

  try {
    // Verify the token to authenticate the user
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { identifier } = decoded; // This should be the user's email

    // Find the employee based on the email
    const employee = await Employee.findOne({ internetEmail: identifier });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    console.log('database value (serialNumber):', employee.serialNumber);

    // Because serialNumber is an array, we check if the submitted serialNumber is among them
    if (employee.serialNumber && employee.serialNumber.includes(serialNumber)) {
      // Mark reconciliationStatus as ["Yes"]
      employee.reconciliationStatus = ['Yes'];

      // Store the entered serialNumber as an array (or append if desired)
      employee.serialNumberEntered = [serialNumber];

      // Update assetCondition if provided
      if (formDetails.assetCondition) {
        employee.assetCondition = [formDetails.assetCondition];
      }

      await employee.save();

      return res
        .status(200)
        .json({
          message: 'Form submitted successfully and serial number reconciled.',
          correct: true,
        });
    } else {
      return res
        .status(400)
        .json({
          message: 'Serial number does not match our records.',
          correct: false,
        });
    }
  } catch (err) {
    console.error('Error:', err);
    return res
      .status(401)
      .json({ message: 'Invalid or expired token.', correct: false });
  }
};

// -----------------------------------
// 4) Get Dashboard
// -----------------------------------
const getDashboard = async (req, res) => {
  try {
    // Fetch all employee data
    const employees = await Employee.find().lean(); 
    res.status(200).json(employees);
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    res
      .status(500)
      .json({ message: 'Error fetching dashboard data.', error: err.message });
  }
};

// -----------------------------------
// 5) Delete All Employees
// -----------------------------------
const deleteAllEmployees = async (req, res) => {
  try {
    await Employee.deleteMany({});
    res.json({ message: 'All records have been deleted successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting records.', error: err });
  }
};

// -----------------------------------
// 6) Send Emails to All Employees
// -----------------------------------
const sendEmails = async (req, res) => {
  try {
    const employees = await Employee.find();

    const promises = employees.map(async (employee) => {
      const uniqueLink = generateUniqueLink(employee.internetEmail, 'email');

      console.log('LINK---->', uniqueLink);

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: employee.internetEmail,
        subject: 'Urgent: Physical Verification of Laptops – FY 24-25',
        html: `
          <p>Dear ${employee.internetEmail.split('@')[0]},</p>

          <p>As part of the mandatory asset verification process for the financial year FY 24-25, a physical verification of laptops issued to employees is being conducted by Protiviti India Member Private Limited. This is a statutory requirement under the Companies (Auditor’s Report) Order, 2016 (CARO), and must be completed to ensure compliance with regulatory standards.</p>

          <p><strong>Action Required:</strong></p>
          <ul>
            <li>Verify Laptop Serial Number</li>
            <li>Make and Model</li>
            <li>Condition of the Laptop</li>
            <li>Any other identifying information</li>
          </ul>

          <p><strong>How to Find the Serial Number:</strong></p>
          <ol>
            <li>Press <strong>Windows + R</strong>, type <strong>cmd</strong>, press Enter.</li>
            <li>Type <strong>"wmic bios get serialnumber"</strong> and press Enter.</li>
          </ol>

          <p><strong>Deadline for Confirmation:</strong><br>
          Please confirm your details within <strong>one week</strong>, no later than [Insert Date].</p>

          <p><strong>Non-Confirmation:</strong><br>
          Failure to confirm will lead to recovery as per the Laptop and Desktop Issuance Policy:</p>
          <ul>
            <li>INR 1,00,000 for Windows Laptops</li>
            <li>INR 2,00,000 for MacBooks</li>
          </ul>

          <p><a href="${uniqueLink}" style="color: blue; text-decoration: underline; font-weight: bold;">Complete the Form Here</a></p>

          <p>Thank you for your prompt attention.</p>

          <p>Best regards,<br>Asset Management Team</p>
        `,
      });

      employee.lastEmailSent = new Date();
      await employee.save();
    });

    await Promise.all(promises);
    res.json({ message: 'Emails sent successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Error sending emails.', error: err });
  }
};

// -----------------------------------
// 7) Get Form
// -----------------------------------
const getForm = async (req, res) => {
  const { identifier } = req.user;

  try {
    const employee = await Employee.findOne({ internetEmail: identifier });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    const name = employee.internetEmail.split('@')[0]; 
    const email = employee.internetEmail;

    res.status(200).json({ name, email });
  } catch (err) {
    res.status(500).json({ message: 'Error accessing form.', error: err.message });
  }
};

// -----------------------------------
// 8) Delete a Single Employee
// -----------------------------------
const deleteEmployee = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await Employee.findByIdAndDelete(id);
    if (result) {
      res.json({ message: 'Employee deleted successfully!' });
    } else {
      res.status(404).json({ message: 'Employee not found.' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error deleting employee.', error: err.message });
  }
};

// -----------------------------------
// 9) Update a Single Employee
// -----------------------------------
const updateEmployee = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const updatedEmployee = await Employee.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (updatedEmployee) {
      res.json({ message: 'Employee updated successfully!', employee: updatedEmployee });
    } else {
      res.status(404).json({ message: 'Employee not found.' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error updating employee.', error: err.message });
  }
};

module.exports = {
  bulkUpload,
  submitForm,
  getDashboard,
  deleteAllEmployees,
  sendEmails,
  deleteEmployee,
  updateEmployee,
  getForm,
};
