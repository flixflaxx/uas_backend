const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Konfigurasi CORS agar frontend (misal file:/// atau localhost port lain) bisa terhubung tanpa kendala keamanan browser
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parser Body Request
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Morgan Logger untuk mencetak log HTTP Request di terminal
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('tiny'));
}

// Endpoint status sederhana untuk pengujian
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'active', 
    message: 'Backend API FlixxMart berhasil berjalan dengan lancar.' 
  });
});

// Registrasi / mounting routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api', orderRoutes); // mounting /checkout, /orders, /admin/customers, dll.

// Middleware penanganan kesalahan / error handler
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server Express berhasil berjalan di port ${PORT} dalam mode ${process.env.NODE_ENV || 'development'}`);
  console.log(`Buka http://localhost:${PORT}/api/status untuk memeriksa status.`);
});
