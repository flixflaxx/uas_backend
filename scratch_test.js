const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkOrders() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'uas_flixxmart'
  });

  try {
    const [orders] = await connection.query('SELECT * FROM orders');
    console.log('--- Orders in Database ---');
    console.log(orders);
  } catch (err) {
    console.error('Error querying orders:', err);
  } finally {
    await connection.end();
  }
}

checkOrders();
