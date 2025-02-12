const fs = require('fs');
const csv = require('csv-parser');
const Employee = require('../models/Employee');

const bulkUpload = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  const filePath = req.file.path;
  const employeeData = {};

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      const email = row.internetEmail;
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
          emailSent: row.emailSent === 'true', // Convert CSV boolean
          lastEmailSentAt: row.lastEmailSentAt ? new Date(row.lastEmailSentAt) : null,
          managerEmailSent: row.managerEmailSent === 'true', // Convert CSV boolean
          lastManagerEmailSentAt: row.lastManagerEmailSentAt ? new Date(row.lastManagerEmailSentAt) : null
        };
      }
    })
    .on('end', async () => {
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
