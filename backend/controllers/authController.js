const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
require('dotenv').config();

// Helper to generate token
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            name: user.name,   // <--- Added Name
            email: user.email, // <--- Added Email
            role: user.role 
        },
        process.env.JWT_SECRET, 
        { expiresIn: '30d' }   // <--- Extended to 30 days for better UX
    );
};

// 1. REGISTER
exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    // 1. Check if user exists (MySQL uses '?' instead of '$1')
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // 3. Insert User (MySQL doesn't use 'RETURNING id', it uses result.insertId)
    const userRole = role || 'customer';
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, password_hash, userRole]
    );

    const userId = result.insertId;

    // 4. Generate Token
    const token = jwt.sign({ id: userId, role: userRole }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    res.status(201).json({ token, user: { id: userId, name, email, role: userRole } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. LOGIN
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // 1. Find User
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }
    
    const user = users[0]; // MySQL returns an array of rows

    // 2. Check Password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    // 3. Generate Token
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};