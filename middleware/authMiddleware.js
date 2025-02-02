const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');

// Middleware for Admin Route Protection
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
  
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized. Token missing.' });
    }
  
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid or expired token.' });
      }
      req.user = user;
      next();
    });
  };  
  

// Middleware for Form Validation (Retaining Existing Logic)
const verifyFormToken = async (req, res, next) => {
  const token = req.query.token;
  if (!token) {
    return res.status(401).json({ message: 'No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const employee = await Employee.findOne({ internetEmail: decoded.identifier });

    if (employee && employee.formFilled) {
      return res.status(403).json({ message: 'Form already submitted.' }); // Prevent reuse
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

module.exports = { authenticateToken, verifyFormToken };
