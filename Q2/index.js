const express = require('express');
const axios = require('axios');

// System parameters
const PORT = 9876;
const WINDOW_SIZE = 10;
const API_TIMEOUT = 500; // timeout limit in ms
const BASE_API_URL = 'http://20.244.56.144/evaluation-service';

// Storage for tracked values
let numbersWindow = [];

// Routing dictionary for number categories
const mapping = {
    p: 'primes',
    f: 'fibo',
    e: 'even',
    r: 'rand'
}; 

// Initialize web service
const app = express();

// Main request handler for number retrieval
app.get('/numbers/:numberid', async (req, res) => {
  const { numberid } = req.params;
   
  // Input validation check
  const endpoint = mapping[numberid];
  if (!endpoint) {
    return res.status(400).json({ error: 'Invalid number type identifier' });
  }
  
  // Record existing data state
  const windowPrevState = [...numbersWindow];
  let fetchedNumbers = [];
  
  try {
    // External data acquisition
    const response = await axios.get(`${BASE_API_URL}/${endpoint}`, {
        timeout: API_TIMEOUT,
        headers: {
          Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQ2ODAwMjQ2LCJpYXQiOjE3NDY3OTk5NDYsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6IjZjZTEwNGI0LWEzOTMtNDZjZi1hY2U2LTY5YmNkZDdlMjkxMyIsInN1YiI6ImFrc2hhdC4yMjI2ZWMxMTg1QGtpZXQuZWR1In0sImVtYWlsIjoiYWtzaGF0LjIyMjZlYzExODVAa2lldC5lZHUiLCJuYW1lIjoiYWtzaGF0IHRvbWFyIiwicm9sbE5vIjoiMjIwMDI5MDEyMDAyMSIsImFjY2Vzc0NvZGUiOiJTeFZlamEiLCJjbGllbnRJRCI6IjZjZTEwNGI0LWEzOTMtNDZjZi1hY2U2LTY5YmNkZDdlMjkxMyIsImNsaWVudFNlY3JldCI6InlRYkpNRGNnclhZeFB4VFcifQ.2QBDPg3r61HjkgvqtRKqZvMPN6Vm84ADa-jD0W8t6Q0'
        }
    });
    console.log('Raw API respnse:', response.data);

    
    // Handle incoming values
    if (response.data && Array.isArray(response.data.numbers)) {
      fetchedNumbers = response.data.numbers;
      
      // Identify non-duplicate entries
      const uniqueNewNumbers = fetchedNumbers.filter(num => !numbersWindow.includes(num));
      
      // Insert fresh entries
      numbersWindow.push(...uniqueNewNumbers);
      
      // Control collection size
      if (numbersWindow.length > WINDOW_SIZE) {
        numbersWindow = numbersWindow.slice(-WINDOW_SIZE);
      }
    }
  } catch (error) {
    // Continue execution despite data retrieval issues
    console.error(`Error fething from /${endpoint}: ${error.message}`);
    // No modifications to tracked values
  }
  
  // Compute statistical mean
  let average = 0;
  if (numbersWindow.length > 0) {
    const sum = numbersWindow.reduce((acc, num) => acc + num, 0);
    average = parseFloat((sum / numbersWindow.length).toFixed(2));
  }
  
  // Assemble output package
  return res.json({
    windowPrevState,
    windowCurrState: numbersWindow,
    numbers: fetchedNumbers,
    avg: average
  });
});

// Launch service
app.listen(PORT, () => {
  console.log(`Average Calculator service running on http://localhost:${PORT}`);
});