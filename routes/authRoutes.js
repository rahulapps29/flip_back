const express = require("express");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const router = express.Router();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ username }, process.env.JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
    return res.json({ token });
  }

  return res.status(401).json({ message: "Invalid credentials." });
});

module.exports = router;
