// Utility to generate unique form submission links
const generateUniqueLink = (identifier, type = 'email') => {
    const baseUrl = 'https://flipkart.algoapp.in/form';
    
    if (type === 'serialNumber') {
      return `${baseUrl}?serialNumber=${identifier}`;
    } else {
      return `${baseUrl}?email=${identifier}`;
    }
  };
  
  module.exports = generateUniqueLink;
  