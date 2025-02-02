const Employee = require('../models/Employee');
const nodemailer = require('nodemailer');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const generateUniqueLink = require('../utils/linkGenerator'); // Import the utility
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



// Bulk upload employees
const bulkUpload = async (req, res) => {

    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
      }
    
      const filePath = req.file.path;
      const employees = [];
    
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          // Map CSV row to the employee schema
          const employee = {
            itamOrganization: row['itamOrganization'],
            assetId: row['assetId'],
            serialNumber: row['serialNumber'],
            manufacturerName: row['manufacturerName'],
            modelVersion: row['modelVersion'],
            building: row['building'],
            locationId: row['locationId'],
            internetEmail: row['internetEmail'],
            department: row['department'],
            employeeId: row['employeeId'],
            managerEmployeeId: row['managerEmployeeId'],
            managerEmailId: row['managerEmailId'],
            emailDelivery: row['emailDelivery'],
            serialNumberEntered: row['serialNumberEntered'],
            reconciliationStatus: row['reconciliationStatus'],
            assetCondition: row['assetCondition'],
          };
    
          employees.push(employee);
        })
        .on('end', async () => {
          try {
            // Perform bulk write operation
            const bulkOps = employees.map((employee) => ({
              updateOne: {
                filter: { internetEmail: employee.internetEmail }, // Use internetEmail as the unique identifier
                update: { $set: employee },
                upsert: true, // Insert if not found, update if found
              },
            }));
    
            await Employee.bulkWrite(bulkOps);
            res.status(200).json({ message: 'Bulk upload successful!', count: employees.length });
          } catch (err) {
            console.error('Error in bulk write:', err);
            res.status(500).json({ message: 'Error uploading employees.', error: err.message });
          } finally {
            fs.unlinkSync(filePath); // Delete the file after processing
          }
        })
        .on('error', (err) => {
          console.error('Error reading CSV file:', err);
          res.status(500).json({ message: 'Error processing CSV file.', error: err.message });
        });
};

// Send email function
const sendEmail = async (employee) => {
  const uniqueLink = generateUniqueLink(employee.serialNumbers[0], 'serialNumber');
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: employee.internetEmail,
    subject: 'Form Submission Request',
    text: `Please fill out the form using this link: ${uniqueLink}`,
  });
  employee.lastEmailSent = new Date();
  await employee.save();
};

// Submit Form
const submitForm = async (req, res) => {
  const { token, formDetails } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify the token
    const { identifier } = decoded;

    const employee = await Employee.findOne({ internetEmail: identifier });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    employee.formDetails = formDetails;
    employee.formFilled = true;
    await employee.save();

    res.json({ message: 'Form submitted successfully!', correct: true });
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token.', correct: false });
  }
};

// Dashboard
const getDashboard = async (req, res) => {
    try {
        const employees = await Employee.find();
        const report = employees.map(emp => ({
          itamOrganization: emp.itamOrganization,
          assetId: emp.assetId,
          serialNumber: emp.serialNumber,
          manufacturerName: emp.manufacturerName,
          modelVersion: emp.modelVersion,
          building: emp.building,
          locationId: emp.locationId,
          internetEmail: emp.internetEmail,
          department: emp.department,
          employeeId: emp.employeeId,
          managerEmployeeId: emp.managerEmployeeId,
          managerEmailId: emp.managerEmailId,
          emailDelivery: emp.emailDelivery,
          serialNumberEntered: emp.serialNumberEntered,
          reconciliationStatus: emp.reconciliationStatus,
          assetCondition: emp.assetCondition,
          formFilled: emp.formFilled || false, // Default to false if not present
          formDetails: emp.formDetails || null, // Default to null if not present
        }));
        res.status(200).json(report);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        res.status(500).json({ message: 'Error fetching dashboard data.', error: err.message });
      }
};





// Delete all employees
const deleteAllEmployees = async (req, res) => {
  try {
    await Employee.deleteMany({});
    res.json({ message: 'All records have been deleted successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting records.', error: err });
  }
};

// Send Emails
const sendEmails = async (req, res) => {
  try {
    const employees = await Employee.find();
    const promises = employees.map(async (employee) => {
      const uniqueLink = generateUniqueLink(employee.internetEmail, 'email');
      console.log('Generated Link:', uniqueLink);
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: employee.internetEmail,
        subject: 'Please Complete Your Form',
        text: `Click the following link to complete your form: ${uniqueLink}`,
      });
    });

    await Promise.all(promises);
    res.json({ message: 'Emails sent to all employees successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Error sending emails.', error: err });
  }
};


const getForm = async (req, res) => {
  const { identifier, type } = req.user; // Extracted from the JWT
  try {
    const employee = await Employee.findOne({ internetEmail: identifier });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }
    res.status(200).json({ message: 'Form access granted.', employee });
  } catch (err) {
    res.status(500).json({ message: 'Error accessing form.', error: err.message });
  }
};

module.exports = { bulkUpload, submitForm, getDashboard, deleteAllEmployees, sendEmails, getForm };



// Delete a single employee
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
  
  // Update a single employee
  const updateEmployee = async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
  
    try {
      const updatedEmployee = await Employee.findByIdAndUpdate(id, updateData, { new: true });
      if (updatedEmployee) {
        res.json({ message: 'Employee updated successfully!', employee: updatedEmployee });
      } else {
        res.status(404).json({ message: 'Employee not found.' });
      }
    } catch (err) {
      res.status(500).json({ message: 'Error updating employee.', error: err.message });
    }
  };
  
  module.exports = { bulkUpload, submitForm, getDashboard, deleteAllEmployees, sendEmails, deleteEmployee, updateEmployee };
  