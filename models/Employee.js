const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  itamOrganization: { type: String },
  assetId: { type: String },
  serialNumber: { type: String, required: true, unique: true }, // Ensuring unique serialNumber
  manufacturerName: { type: String },
  modelVersion: { type: String },
  building: { type: String },
  locationId: { type: String },
  department: { type: String },
  employeeId: { type: String },
  managerEmployeeId: { type: String },
  managerEmailId: { type: String },
  emailDelivery: { type: String },
  serialNumberEntered: { type: String },
  reconciliationStatus: { type: String },
  assetCondition: { type: String },
  timestamp: { type: Date, default: Date.now }
});

const employeeSchema = new mongoose.Schema({
  internetEmail: { type: String, required: true, unique: true }, // Ensuring unique email
  assets: {
    type: [assetSchema],
    validate: {
      validator: function (assets) {
        const serialNumbers = assets.map(a => a.serialNumber);
        return new Set(serialNumbers).size === serialNumbers.length; // Ensuring no duplicate serialNumbers
      },
      message: 'Duplicate serialNumber found in assets array.'
    }
  }
});

module.exports = mongoose.model('Employee', employeeSchema);
