// routes/userRoutes.js
const express = require('express');
const authenticateAndGetUserDb = require('../middleware/middleware');
const { getUserDb } = require('../config/userDb');

const router = express.Router();

// Protected route example
router.get('/my-data', authenticateAndGetUserDb, async (req, res) => {
  try {
    // Example: you can use req.userDb to query user's own DB
    // const items = await req.userDb.collection('items').find({}).toArray();

    res.status(200).json({ name: "Hetvik Test" });
  } catch (error) {
    console.error('Error in /my-data route:', error);
    res.status(500).json({ error: 'Server error while fetching data.' });
  }
});

// POST /save-config
router.post("/save-config",authenticateAndGetUserDb, async (req, res) => {
  console.log(req);
  
  const { schema } = req.body;
  const userId = req.user.userId; // from auth middleware

  // Find user's DB URL from main DB
  const mainDb = await mainDb.collection("users").findOne({ _id: userId });
  const userDb = getUserDb(req.token);

  // Save schema to user DB
  await userDb.collection("settings").updateOne(
    { schemaType: "jobCard" },
    { $set: { schema, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );

  // Mark schemaConfigured = true in main DB
  await mainDb.collection("users").updateOne(
    { _id: userId },
    { $set: { schemaConfigured: true } }
  );

  res.status(200).json({ message: "Configuration saved successfully!" });
});

module.exports = router;
