require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const employeeRoutes = require('./routes/employeeRoutes');

const app = express();

app.use(express.json());
app.use(cors());

connectDB();

app.use('/api', employeeRoutes);

const PORT = process.env.PORT || 4043;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
