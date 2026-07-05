const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Ambil token dari header Authorization: Bearer <token>
      token = req.headers.authorization.split(' ')[1];

      // Verifikasi token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_flixxmart');

      // Lampirkan data user ke request object
      req.user = {
        id: decoded.id,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role
      };

      return next();
    } catch (error) {
      console.error('Verifikasi JWT gagal:', error.message);
      return res.status(401).json({ error: 'Token tidak valid atau kedaluwarsa, autentikasi gagal' });
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Tidak diotorisasi, token tidak ditemukan' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Akses ditolak, khusus untuk Administrator' });
  }
};

module.exports = { protect, adminOnly };
