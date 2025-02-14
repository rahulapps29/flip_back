const mongoose = require("mongoose");

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
  assetCondition: { type: String },
  formOpened: { type: String },
  serialNumberEntered: { type: String },
  reconciliationStatus: { type: String },
  assetConditionEntered: { type: String },
  manufacturerNameEntered: { type: String },
  modelVersionEntered: { type: String },
  timestamp: { type: Date, default: Date.now },
});

const employeeSchema = new mongoose.Schema({
  internetEmail: { type: String, required: true, unique: true }, // Ensuring unique email
  assets: {
    type: [assetSchema],
    validate: {
      validator: function (assets) {
        const serialNumbers = assets.map((a) => a.serialNumber);
        return new Set(serialNumbers).size === serialNumbers.length; // Ensuring no duplicate serialNumbers
      },
      message: "Duplicate serialNumber found in assets array.",
    },
  },
  emailSent: { type: Boolean, default: false }, // ✅ Track if email was sent
  lastEmailSentAt: { type: Date }, // ✅ Track last email sent time

  // ✅ New Fields for Manager Email Tracking
  managerEmailSent: { type: Boolean, default: false }, // ✅ Track if email was sent to manager
  lastManagerEmailSentAt: { type: Date }, // ✅ Track last email sent time to manager
});

module.exports = mongoose.model("Employee", employeeSchema);
