const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    itamOrganization: { type: String, required: true },
    assetId: { type: String, required: true },
    serialNumber: { type: String, required: true },
    manufacturerName: { type: String, required: true },
    modelVersion: { type: String, required: true },
    building: { type: String, required: true },
    locationId: { type: String, required: true },
    internetEmail: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    employeeId: { type: String, required: true },
    managerEmployeeId: { type: String, required: true },
    managerEmailId: { type: String, required: true },
    emailDelivery: { 
      type: String, 
      enum: ["Yes", "No", "Bounceback"], // Only allows these values
      required: true 
    },
    serialNumberEntered: { 
      type: String, 
      required: true 
    },
    reconciliationStatus: { 
      type: String, 
      enum: ["Yes", "No"], // Only allows these values
      required: true 
    },
    assetCondition: { 
      type: String, 
      enum: ["Good", "Bad", "Damaged"], // Only allows these values
      required: true 
    },
  });

  
module.exports = mongoose.model('Employee', employeeSchema);
