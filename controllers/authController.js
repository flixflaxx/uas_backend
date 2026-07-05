const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Helper untuk generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'secret_key_flixxmart',
    { expiresIn: '30d' }
  );
};

// @desc    Register user baru
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Semua field wajib diisi');
    }

    if (password.length < 6) {
      res.status(400);
      throw new Error('Password minimal 6 karakter');
    }

    // Periksa apakah user dengan email tersebut sudah ada
    const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      res.status(400);
      throw new Error('Email sudah terdaftar');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Simpan ke database
    await db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name.trim(), email.trim(), hashedPassword, 'user']
    );

    res.status(201).json({ success: true, message: 'Registrasi berhasil! Silakan login.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user & generate session token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Email dan password wajib diisi');
    }

    // Cari user berdasarkan email
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      res.status(400);
      throw new Error('Email atau password salah');
    }

    const user = users[0];

    // Bandingkan password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400);
      throw new Error('Email atau password salah');
    }

    // Kembalikan objek session yang cocok dengan keys di LocalStorage script.js
    res.json({
      success: true,
      session: {
        userId: user.id.toString(), // konversi ke string untuk konsistensi frontend
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user)
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { registerUser, loginUser };
