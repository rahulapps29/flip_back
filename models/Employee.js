const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    itamOrganization: { type: [String], required: true },
    assetId: { type: [String], required: true },
    serialNumber: { type: [String], required: true },
    manufacturerName: { type: [String], required: true },
    modelVersion: { type: [String], required: true },
    building: { type: [String], required: true },
    locationId: { type: [String], required: true },
    
    // Keep internetEmail as a single String.
    internetEmail: { type: String, required: true, unique: true },
    
    department: { type: [String], required: true },
    employeeId: { type: [String], required: true },
    managerEmployeeId: { type: [String], required: true },
    managerEmailId: { type: [String], required: true },
    emailDelivery: { type: [String], required: true },
    serialNumberEntered: { type: [String], required: true },
    reconciliationStatus: { type: [String], required: true },
    assetCondition: { type: [String], required: true },
    assetConditionEntered: { type: [String], required: true },
  },
  { strict: false } // Allows dynamic fields if needed
);

module.exports = mongoose.model('Employee', employeeSchema);
