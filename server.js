// File: server.js (Node.js + Express)

require('dotenv').config(); // Load environment variables from .env

const express = require('express');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const cron = require('node-cron');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// MongoDB connection using environment variable
mongoose.connect(process.env.MONGODB_URI).then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

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

const Employee = mongoose.model('Employee', employeeSchema);

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail', // Change as per your email provider
  auth: {
    user: process.env.EMAIL_USER, // Email from .env
    pass: process.env.EMAIL_PASS, // Password from .env
  },
});

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

// Bulk upload route
app.post('/api/bulk-upload', upload.single('file'), async (req, res) => {
  const filePath = req.file.path;
  const employees = new Map();
 

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      const internetEmail = row['internetEmail'];
      const serialNumbers = row['serialNumber']
        ? row['serialNumber'].split(';').filter(sn => sn.trim() !== '')
        : [];
  
      if (employees.has(internetEmail)) {
        employees.get(internetEmail).serialNumbers.push(...serialNumbers);
      } else {
        employees.set(internetEmail, {
          internetEmail,               // ✅ Correct field name
          serialNumbers,
          managerEmailId: row['managerEmailId'],  // ✅ Match schema
        });
      }
    })
    .on('end', async () => {
      try {
        const bulkOps = Array.from(employees.values()).map((employee) => ({
          updateOne: {
            filter: { internetEmail: employee.internetEmail },
            update: { $set: employee },
            upsert: true,
          },
        }));
  
        await Employee.bulkWrite(bulkOps);
      } catch (err) {
        console.error('Error in bulk write:', err);
      }
    });
  

});

// Send email function
async function sendEmail(employee) {
  const uniqueLink = `https://flipkart.algoapp.in/form?serialNumber=${employee.serialNumbers[0]}`;
  await transporter.sendMail({
    from: 'your-email@gmail.com',
    to: employee.email,
    subject: 'Form Submission Request',
    text: `Please fill out the form using this link: ${uniqueLink}`,
  });
  employee.lastEmailSent = new Date();
  await employee.save();
}

// Schedule task to send reminders every 5 days
cron.schedule('0 0 */5 * *', async () => {
  const employees = await Employee.find({ formFilled: false });
  for (const employee of employees) {
    const now = new Date();
    if (!employee.lastEmailSent || now - new Date(employee.lastEmailSent) >= 5 * 24 * 60 * 60 * 1000) {
      await sendEmail(employee);
    }
  }
});

// API routes
app.post('/api/submit-form', async (req, res) => {
  const { serialNumber, formDetails } = req.body;
  const employee = await Employee.findOne({ serialNumbers: serialNumber });

  if (employee) {
    employee.formDetails = formDetails;
    employee.formFilled = true;
    await employee.save();
    res.json({ message: 'Form submitted successfully!', correct: true });
  } else {
    res.json({ message: 'Incorrect Serial Number. Please try again.', correct: false });
  }
});

app.get('/api/dashboard', async (req, res) => {
  const employees = await Employee.find();
  const report = employees.map(emp => ({
    email: emp.email,
    name: emp.name,
    serialNumbers: emp.serialNumbers,
    formFilled: emp.formFilled,
    formDetails: emp.formDetails,
  }));
  res.json(report);
});

// Add this route to your backend (server.js):
app.delete('/api/delete-all', async (req, res) => {
  try {
    await Employee.deleteMany({}); // Remove all records from the database
    res.json({ message: 'All records have been deleted successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting records.', error: err });
  }
});

// Add this route to your backend (server.js):
app.post('/api/send-emails', async (req, res) => {
  try {
    const employees = await Employee.find();
    const promises = employees.map(async (employee) => {
      const uniqueLink = `https://flipkart.algoapp.in/form?email=${employee.email}`;
      await transporter.sendMail({
        from: 'your-email@gmail.com',
        to: employee.email,
        subject: 'Please Complete Your Form',
        text: `Click the following link to complete your form: ${uniqueLink}`,
      });
    });

    await Promise.all(promises);
    res.json({ message: 'Emails sent to all employees successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Error sending emails.', error: err });
  }
});



// Get the port from the environment variable
const PORT = process.env.PORT || 4043;

// New GET route to return the running port
app.get('/', (req, res) => {
  res.json({ message: `Server is running on port ${PORT}` });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});