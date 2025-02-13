const fs = require('fs');
const csv = require('csv-parser');
const Employee = require('../models/Employee');

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return email && emailRegex.test(email); // Ensures email is not empty and follows the pattern
};

const requiredHeaders = [
  'internetEmail', 'managerEmailId', 'itamOrganization', 'assetId', 'serialNumber', 
  'manufacturerName', 'modelVersion', 'building', 'locationId', 'department',
  'employeeId', 'managerEmployeeId', 'assetCondition', 'formOpened', 'serialNumberEntered',
  'reconciliationStatus', 'assetConditionEntered', 'manufacturerNameEntered', 'modelVersionEntered'
];

const bulkUpload = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  const filePath = req.file.path;
  const employeeData = {};
  const errors = [];
  let headersChecked = false; // Track if headers have been checked
  let rowNumber = 1; // Start row numbering from 1


  fs.createReadStream(filePath)
    .pipe(csv())
    .on('headers', (headers) => {
      // Validate required headers
      const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
      // if (missingHeaders.length > 0) {
      //   errors.push({ error: `Missing headers: ${missingHeaders.join(', ')}` });
      // }
      if (missingHeaders.length > 0) {
        errors.push({ row: 'Header Validation', error: `Missing headers: ${missingHeaders.join(', ')}` });
      }
      
      headersChecked = true;
    })
    .on('data', (row) => {
      if (!headersChecked) return; // Ensure headers are checked before processing rows
    
      const email = row.internetEmail ? row.internetEmail.trim() : '';
      const managerEmail = row.managerEmailId ? row.managerEmailId.trim() : '';
    
      // Validate emails
      if (!validateEmail(email)) {
        errors.push({ row: rowNumber, error: `Invalid email format: "${email}"` });
      }
      if (managerEmail && !validateEmail(managerEmail)) {
        errors.push({ row: rowNumber, error: `Invalid manager email format: "${managerEmail}"` });
      }
    
      rowNumber++; // Move to the next row
    
    

      const asset = {
        itamOrganization: row.itamOrganization,
        assetId: row.assetId,
        serialNumber: row.serialNumber,
        manufacturerName: row.manufacturerName,
        modelVersion: row.modelVersion,
        building: row.building,
        locationId: row.locationId,
        department: row.department,
        employeeId: row.employeeId,
        managerEmployeeId: row.managerEmployeeId,
        managerEmailId: row.managerEmailId,
        assetCondition: row.assetCondition,
        formOpened: row.formOpened,
        serialNumberEntered: row.serialNumberEntered,
        reconciliationStatus: row.reconciliationStatus,
        assetConditionEntered: row.assetConditionEntered,
        manufacturerNameEntered: row.manufacturerNameEntered,
        modelVersionEntered: row.modelVersionEntered
      };

      if (employeeData[email]) {
        const existingAssets = employeeData[email].assets;
        const isDuplicate = existingAssets.some(existingAsset => existingAsset.serialNumber === asset.serialNumber);
        
        if (!isDuplicate) {
          existingAssets.push(asset);
        }
      } else {
        employeeData[email] = {
          internetEmail: email,
          assets: [asset],
          emailSent: row.emailSent === 'true',
          lastEmailSentAt: row.lastEmailSentAt ? new Date(row.lastEmailSentAt) : null,
          managerEmailSent: row.managerEmailSent === 'true',
          lastManagerEmailSentAt: row.lastManagerEmailSentAt ? new Date(row.lastManagerEmailSentAt) : null
        };
      }
    })








    .on('end', async () => {
      if (errors.length > 0) {
        fs.unlinkSync(filePath); // Delete the file if validation fails
        return res.status(400).json({ message: 'Validation errors found', errors });
      }

      try {
        const employees = Object.values(employeeData);

        for (const employee of employees) {
          const existingEmployee = await Employee.findOne({ internetEmail: employee.internetEmail });

          if (existingEmployee) {
            const newAssets = employee.assets.filter(asset => 
              !existingEmployee.assets.some(existingAsset => existingAsset.serialNumber === asset.serialNumber)
            );

            if (newAssets.length > 0) {
              await Employee.updateOne(
                { internetEmail: employee.internetEmail },
                { 
                  $push: { assets: { $each: newAssets } },
                  $set: { 
                    emailSent: employee.emailSent,
                    lastEmailSentAt: employee.lastEmailSentAt,
                    managerEmailSent: employee.managerEmailSent,
                    lastManagerEmailSentAt: employee.lastManagerEmailSentAt
                  }
                }
              );
            }
          } else {
            await Employee.create(employee);
          }
        }

        fs.unlinkSync(filePath);
        res.status(200).json({ message: 'Bulk upload successful!' });
      } catch (err) {
        console.error('Error in bulk upload:', err);
        res.status(500).json({ message: 'Error uploading employees.', error: err.message });
      }
    })
    .on('error', (err) => {
      console.error('Error reading CSV file:', err);
      res.status(500).json({ message: 'Error processing CSV file.', error: err.message });
    });
};

module.exports = {
  bulkUpload,
};
