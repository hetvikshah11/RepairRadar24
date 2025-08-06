// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { getMainDb } = require('../config/mainDb');
const bcrypt = require('bcrypt');

// POST /api/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: 'All fields are required.' });

    const db = getMainDb();

    // Check if email already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser)
      return res.status(409).json({ error: 'Email already registered.' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await db.collection('users').insertOne({
      name,
      email,
      password: hashedPassword,
      createdAt: new Date()
    });

    res.status(201).json({
      message: 'User registered successfully',
      userId: result.insertedId
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error during signup.' });
  }
});

module.exports = router;
