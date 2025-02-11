// Required Modules
const Employee = require('../models/Employee');
const nodemailer = require('nodemailer');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const generateUniqueLink = require('../utils/linkGenerator');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });




// -----------------------------------
// 2) Send Email to Single Employee
// -----------------------------------



// -----------------------------------
// 3) Submit Form (Reconcile Data)
// -----------------------------------
const submitForm = async (req, res) => {
  const { token, formDetails } = req.body; // formDetails is an array of asset details

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { identifier } = decoded;

    const employee = await Employee.findOne({ internetEmail: identifier });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    // Update each asset based on form submission
    employee.assets.forEach((asset, index) => {
      if (formDetails[index]) {
        const {
          serialNumber,
          assetConditionEntered,
          manufacturerNameEntered,
          modelVersionEntered
        } = formDetails[index];

        // Update asset details
        asset.serialNumberEntered = serialNumber;
        asset.assetConditionEntered = assetConditionEntered;
        asset.manufacturerNameEntered = manufacturerNameEntered;
        asset.modelVersionEntered = modelVersionEntered;
        asset.timestamp = new Date();

        // Reconciliation Status Check
        if (
          asset.serialNumber === serialNumber
        ) {
          asset.reconciliationStatus = "Yes";
        } else {
          asset.reconciliationStatus = "No";
        }
      }
    });

    await employee.save();

    return res.status(200).json({ message: 'Form submitted successfully.', correct: true });
  } catch (err) {
    console.error('Error:', err);
    return res.status(401).json({ message: 'Invalid or expired token.', correct: false });
  }
};


// -----------------------------------
// 4) Get Dashboard
// -----------------------------------
const getDashboard = async (req, res) => {
  try {
    const employees = await Employee.find().lean();
    res.status(200).json(employees);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching dashboard data.', error: err.message });
  }
};

// -----------------------------------
// 5) Delete All Employees
// -----------------------------------
const deleteAllEmployees = async (req, res) => {
  try {
    await Employee.deleteMany({});
    res.json({ message: 'All records deleted successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting records.', error: err });
  }
};



// -----------------------------------
// 7) Delete a Single Employee
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
// 8) Update a Single Employee
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

// -----------------------------------
// 9) Get Form
// -----------------------------------
const getForm = async (req, res) => {
  const { identifier } = req.user;

  try {
    const employee = await Employee.findOne({ internetEmail: identifier });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    const name = employee.internetEmail.split('@')[0]; // Extract name from email
    const email = employee.internetEmail;

    res.status(200).json({ name, email }); // Only return name and email
  } catch (err) {
    res.status(500).json({ message: 'Error accessing form.', error: err.message });
  }
};

const getEmployeeAssets = async (req, res) => {
  const { token } = req.query;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { identifier } = decoded;

    const employee = await Employee.findOne({ internetEmail: identifier });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    // Only return the number of assets, not the actual data
    const assetCount = employee.assets.length;

    // Update formOpened to "Yes"
    employee.assets.forEach((asset) => {
      asset.formOpened = "Yes";
    });
    await employee.save();

    return res.status(200).json({ assetCount });  // Send only the count
  } catch (err) {
    console.error('Error:', err);
    return res.status(401).json({ message: 'Invalid or expired token.', error: err.message });
  }
};

module.exports = {
  
  submitForm,
  getDashboard,
  deleteAllEmployees,
  deleteEmployee,
  updateEmployee,
  getForm,
  getEmployeeAssets,
};
