// middleware/auth.js
const jwt = require('jsonwebtoken');
// Import the Map from your config file
const { userDbConnections } = require('../config/userDb.js'); 

require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined in .env file");
  process.exit(1); 
}

function authenticateAndGetUserDb(req, res, next) {
  const authHeader = req.headers['authorization'];
  // console.log("Auth Header:", authHeader);

  if (!authHeader) {
    console.log("No authorization header provided");
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log("Invalid token format");
    return res.status(401).json({ error: 'Invalid token format' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log("Invalid token");
      return res.status(401).json({ error: 'Invalid token' });
    }

    // --- NEW LOGIC STARTS HERE ---

    // 1. Get the connection object from the Map
    const connectionData = userDbConnections.get(token);

    // Check if the connection exists
    // (It might be missing if the server restarted or the cleanup job deleted it)
    if (!connectionData) {
        console.log("Valid JWT but no active DB connection found in memory.");
        return res.status(401).json({ 
            error: 'Session expired or connection closed. Please Login again.' 
        });
    }

    // 2. Update the Timestamp (Heartbeat)
    // This tells the cleanup job: "I am still using this, don't delete me!"
    connectionData.lastAccessed = Date.now();

    // 3. Attach the DB instance to the request
    // This extracts the .db property so your routes can use req.db.collection(...)
    req.db = connectionData.db;

    // --- NEW LOGIC ENDS HERE ---

    req.user = decoded;
    req.token = token;

    next();
  });
}

module.exports = authenticateAndGetUserDb;