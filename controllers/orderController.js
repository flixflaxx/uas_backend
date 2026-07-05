const db = require('../config/db');
const {
  formatWhatsAppMessage,
  getClickToChatUrl,
  sendWhatsAppGateway
} = require('../utils/waNotification');

// @desc    Proses Checkout / Pemesanan (Membuat Order & Mengurangi Stok)
// @route   POST /api/checkout
// @access  Public
const checkout = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { name, phone, address, items } = req.body;

    if (!name || !phone || !address || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400);
      throw new Error('Data pembeli (nama, nomor HP/WA, alamat) dan array produk belanja wajib diisi');
    }

    // Buat transaction ID yang unik
    const transactionId = 'TXN-' + Date.now() + '-' + Math.floor(Math.random() * 9000 + 1000);

    let totalPrice = 0;
    const orderItemsToInsert = [];

    // Validasi stok dan hitung total harga
    for (const item of items) {
      const productId = item.productId || item.id_produk;
      const quantity = parseInt(item.quantity);

      if (!productId || isNaN(quantity) || quantity <= 0) {
        res.status(400);
        throw new Error('Format produk atau kuantitas dalam keranjang tidak valid');
      }

      // Cari produk berdasarkan product_code string (untuk kecocokan frontend) atau ID integer
      let findProductQuery = 'SELECT * FROM products WHERE id = ?';
      let param = productId;
      if (isNaN(productId)) {
        findProductQuery = 'SELECT * FROM products WHERE product_code = ?';
      }

      const [products] = await connection.query(findProductQuery, [param]);
      if (products.length === 0) {
        res.status(404);
        throw new Error(`Produk dengan ID/Kode '${productId}' tidak ditemukan`);
      }

      const product = products[0];

      // Cek ketersediaan stok
      if (product.stock < quantity) {
        res.status(400);
        throw new Error(`Stok produk '${product.name}' tidak cukup (Stok tersisa: ${product.stock}, pesanan: ${quantity})`);
      }

      // Kurangi stok produk secara otomatis
      const newStock = product.stock - quantity;
      await connection.query('UPDATE products SET stock = ? WHERE id = ?', [newStock, product.id]);

      const price = parseFloat(product.price);
      const subtotal = price * quantity;
      totalPrice += subtotal;

      orderItemsToInsert.push({
        product_id: product.id,
        name: product.name,
        price: price,
        quantity: quantity,
        subtotal: subtotal
      });
    }

    // Masukkan data ke tabel orders
    const [orderResult] = await connection.query(
      'INSERT INTO orders (transaction_id, customer_name, customer_phone, customer_address, total_price, status) VALUES (?, ?, ?, ?, ?, ?)',
      [transactionId, name.trim(), phone.trim(), address.trim(), totalPrice, 'pending']
    );

    const orderId = orderResult.insertId;

    // Masukkan rincian produk belanja ke tabel order_items
    for (const oi of orderItemsToInsert) {
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price, subtotal) VALUES (?, ?, ?, ?, ?)',
        [orderId, oi.product_id, oi.quantity, oi.price, oi.subtotal]
      );
    }

    // Selesaikan transaksi DB
    await connection.commit();
    connection.release();

    // Persiapkan data untuk pembuatan ringkasan pesan WA
    const orderData = {
      transactionId,
      date: new Date().toISOString(),
      customer: { name, phone, address },
      items: orderItemsToInsert,
      total: totalPrice
    };

    // Format pesan WhatsApp
    const message = formatWhatsAppMessage(orderData);
    const ownerNumber = process.env.OWNER_WA_NUMBER || '6289527204180';
    
    // URL Click-to-Chat untuk dialihkan di frontend
    const waUrl = getClickToChatUrl(message, ownerNumber);

    // Kirim notifikasi secara otomatis ke WhatsApp Owner di background (jika API gateway diaktifkan)
    await sendWhatsAppGateway(message, ownerNumber);

    res.status(201).json({
      success: true,
      message: 'Pesanan berhasil dikonfirmasi! Mengalihkan ke WhatsApp...',
      order: {
        transactionId,
        date: orderData.date,
        customer: orderData.customer,
        items: items, // Kembalikan format array asli
        total: totalPrice,
        status: 'pending'
      },
      whatsapp_url: waUrl
    });
  } catch (error) {
    await connection.rollback();
    connection.release();
    next(error);
  }
};

// @desc    Ambil riwayat pesanan (Admin melihat semua, pelanggan hanya melihat miliknya)
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res, next) => {
  try {
    let queryStr = 'SELECT * FROM orders ORDER BY id DESC';
    const queryParams = [];

    // Jika bukan admin, saring berdasarkan nama pelanggan
    if (req.user.role !== 'admin') {
      queryStr = 'SELECT * FROM orders WHERE customer_name = ? ORDER BY id DESC';
      queryParams.push(req.user.name);
    }

    const [orders] = await db.query(queryStr, queryParams);

    const formattedOrders = [];
    for (const order of orders) {
      // Ambil detail rincian produk untuk setiap order
      const [items] = await db.query(
        `SELECT oi.quantity, oi.price, oi.subtotal, p.name, p.product_code, p.image_url 
         FROM order_items oi 
         JOIN products p ON oi.product_id = p.id 
         WHERE oi.order_id = ?`,
        [order.id]
      );

      formattedOrders.push({
        transactionId: order.transaction_id,
        date: order.created_at,
        customer: {
          name: order.customer_name,
          phone: order.customer_phone,
          address: order.customer_address
        },
        items: items.map(item => ({
          productId: item.product_code, // format string prod_xxx
          name: item.name,
          price: Number(item.price),
          quantity: Number(item.quantity),
          image: item.image_url
        })),
        total: Number(order.total_price),
        status: order.status
      });
    }

    res.json(formattedOrders);
  } catch (error) {
    next(error);
  }
};

// @desc    Ubah status pesanan
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res, next) => {
  try {
    const transactionId = req.params.id;
    const { status } = req.body;

    if (!status) {
      res.status(400);
      throw new Error('Status wajib diisi');
    }

    const [orders] = await db.query('SELECT * FROM orders WHERE transaction_id = ?', [transactionId]);
    if (orders.length === 0) {
      res.status(404);
      throw new Error('Pesanan tidak ditemukan');
    }

    await db.query('UPDATE orders SET status = ? WHERE transaction_id = ?', [status, transactionId]);
    
    res.json({
      success: true,
      message: `Status transaksi ${transactionId} diubah menjadi: ${status}`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Ambil daftar semua customer beserta jumlah belanjaan (Admin Only)
// @route   GET /api/admin/customers
// @access  Private/Admin
const getCustomers = async (req, res, next) => {
  try {
    // Gabungkan tabel user dengan order untuk menghitung total statistik
    const [customers] = await db.query(
      `SELECT 
        u.id, u.name, u.email, u.role,
        COUNT(o.id) as order_count,
        IFNULL(SUM(CASE WHEN o.status NOT IN ('failed', 'refunded_cancelled') THEN o.total_price ELSE 0 END), 0) as total_spent
       FROM users u
       LEFT JOIN orders o ON u.name = o.customer_name
       WHERE u.role != 'admin'
       GROUP BY u.id, u.name, u.email, u.role
       ORDER BY u.id ASC`
    );

    res.json(customers.map(c => ({
      id: 'user_' + c.id,
      name: c.name,
      email: c.email,
      role: c.role,
      order_count: Number(c.order_count),
      total_spent: Number(c.total_spent)
    })));
  } catch (error) {
    next(error);
  }
};

// @desc    Ambil laporan penjualan per kategori untuk Chart.js (Admin Only)
// @route   GET /api/admin/reports/category-sales
// @access  Private/Admin
const getCategorySalesReport = async (req, res, next) => {
  try {
    const [report] = await db.query(
      `SELECT 
        p.category,
        IFNULL(SUM(oi.price * oi.quantity), 0) as total_sales
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.status NOT IN ('failed', 'refunded_cancelled')
       GROUP BY p.category`
    );

    const formattedReport = {
      Pakaian: 0,
      Elektronik: 0,
      Sepatu: 0,
      Tas: 0
    };

    report.forEach(row => {
      if (formattedReport[row.category] !== undefined) {
        formattedReport[row.category] = Number(row.total_sales);
      }
    });

    res.json(formattedReport);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkout,
  getOrders,
  updateOrderStatus,
  getCustomers,
  getCategorySalesReport
};
