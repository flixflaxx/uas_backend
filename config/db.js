const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'uas_flixxmart',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

// Test connection at startup
pool.getConnection()
  .then(connection => {
    console.log('Database terhubung dengan sukses ke MySQL Pool.');
    connection.release();
  })
  .catch(error => {
    console.error('Database gagal terhubung:', error.message);
  });

module.exports = pool;
