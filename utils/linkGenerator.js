const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const generateUniqueLink = (identifier, type = 'email') => {
  const token = jwt.sign(
    { identifier, type, nonce: uuidv4() },  // Adding unique nonce
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  return `https://flipkart.algoapp.in/form?token=${token}`;
};

module.exports = generateUniqueLink;
