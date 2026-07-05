const mysql = require('mysql2/promise');
require('dotenv').config();

let pool;

if (process.env.MYSQL_URL) {
  // Jika menggunakan string koneksi penuh (seperti di Railway/Render)
  pool = mysql.createPool(process.env.MYSQL_URL);
} else {
  // Fallback menggunakan konfigurasi terpisah (lokal atau cloud)
  pool = mysql.createPool({
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'uas_flixxmart',
    port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
  });
}

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
