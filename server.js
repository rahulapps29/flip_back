require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const employeeRoutes = require("./routes/employeeRoutes");
const emailRoutes = require("./routes/emailRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const maxTimeRoutes = require("./routes/maxTimeRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(express.json());
app.use(cors());

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api", employeeRoutes);
app.use("/api", emailRoutes);
app.use("/api", uploadRoutes);
app.use("/api", maxTimeRoutes);

const PORT = process.env.PORT || 4043;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
