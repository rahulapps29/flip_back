const jwt = require("jsonwebtoken");
require("dotenv").config();

const { v4: uuidv4 } = require("uuid");

const generateUniqueLink = (identifier, type = "email") => {
  const token = jwt.sign(
    { identifier, type, nonce: uuidv4() }, // Adding unique nonce
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN },
  );
  return `https://flipkart.algoapp.in/form?token=${token}`;
};

module.exports = generateUniqueLink;
