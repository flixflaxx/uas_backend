const db = require('../config/db');

// Helper untuk memformat produk agar kompatibel dengan properti yang digunakan frontend
const formatProduct = (p) => ({
  id: p.product_code,   // frontend menggunakan kode produk (misal: prod_001) sebagai ID utama
  db_id: p.id,          // ID auto-increment internal database
  product_code: p.product_code,
  name: p.name,
  price: Number(p.price),
  category: p.category,
  description: p.description,
  image: p.image_url,   // frontend menggunakan properti 'image' bukan 'image_url'
  image_url: p.image_url,
  stock: Number(p.stock),
  created_at: p.created_at,
  updated_at: p.updated_at
});

// @desc    Ambil semua produk dengan filter
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const { q, category, minPrice, maxPrice } = req.query;
    
    let queryStr = 'SELECT * FROM products WHERE 1=1';
    const queryParams = [];

    // Filter Pencarian kata kunci
    if (q) {
      queryStr += ' AND (name LIKE ? OR description LIKE ?)';
      const searchTerm = `%${q}%`;
      queryParams.push(searchTerm, searchTerm);
    }

    // Filter Kategori
    if (category) {
      queryStr += ' AND category = ?';
      queryParams.push(category);
    }

    // Filter Harga Minimum
    if (minPrice) {
      queryStr += ' AND price >= ?';
      queryParams.push(Number(minPrice));
    }

    // Filter Harga Maksimum
    if (maxPrice) {
      queryStr += ' AND price <= ?';
      queryParams.push(Number(maxPrice));
    }

    queryStr += ' ORDER BY id ASC';

    const [products] = await db.query(queryStr, queryParams);
    res.json(products.map(formatProduct));
  } catch (error) {
    next(error);
  }
};

// @desc    Ambil detail satu produk (mendukung pencarian ID integer maupun product_code string)
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res, next) => {
  try {
    const idOrCode = req.params.id;
    let queryStr = 'SELECT * FROM products WHERE id = ?';
    
    // Jika parameter ID bukan angka (misal 'prod_001'), cari berdasarkan product_code
    if (isNaN(idOrCode)) {
      queryStr = 'SELECT * FROM products WHERE product_code = ?';
    }

    const [products] = await db.query(queryStr, [idOrCode]);
    if (products.length === 0) {
      res.status(404);
      throw new Error('Produk tidak ditemukan');
    }

    res.json(formatProduct(products[0]));
  } catch (error) {
    next(error);
  }
};

// @desc    Tambah produk baru
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res, next) => {
  try {
    const { name, price, category, description, image, stock } = req.body;
    let { product_code } = req.body;

    if (!name || price === undefined || !category || !image || stock === undefined) {
      res.status(400);
      throw new Error('Field name, price, category, image, dan stock wajib diisi');
    }

    if (!product_code) {
      // Generate otomatis jika kosong
      product_code = 'prod_' + Date.now();
    }

    // Periksa keunikan product_code
    const [existing] = await db.query('SELECT * FROM products WHERE product_code = ?', [product_code]);
    if (existing.length > 0) {
      res.status(400);
      throw new Error(`Product code '${product_code}' sudah terdaftar`);
    }

    const [result] = await db.query(
      'INSERT INTO products (product_code, name, price, category, description, image_url, stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [product_code.trim(), name.trim(), Number(price), category.trim(), description || '', image.trim(), Number(stock)]
    );

    const [newProduct] = await db.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    res.status(201).json(formatProduct(newProduct[0]));
  } catch (error) {
    next(error);
  }
};

// @desc    Perbarui detail produk
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res, next) => {
  try {
    const idOrCode = req.params.id;
    const { name, price, category, description, image, stock } = req.body;

    let findQuery = 'SELECT * FROM products WHERE id = ?';
    if (isNaN(idOrCode)) {
      findQuery = 'SELECT * FROM products WHERE product_code = ?';
    }

    const [products] = await db.query(findQuery, [idOrCode]);
    if (products.length === 0) {
      res.status(404);
      throw new Error('Produk tidak ditemukan');
    }

    const currentProduct = products[0];

    const updatedName = name !== undefined ? name.trim() : currentProduct.name;
    const updatedPrice = price !== undefined ? Number(price) : currentProduct.price;
    const updatedCategory = category !== undefined ? category.trim() : currentProduct.category;
    const updatedDesc = description !== undefined ? description.trim() : currentProduct.description;
    const updatedImage = image !== undefined ? image.trim() : currentProduct.image_url;
    const updatedStock = stock !== undefined ? Number(stock) : currentProduct.stock;

    await db.query(
      'UPDATE products SET name = ?, price = ?, category = ?, description = ?, image_url = ?, stock = ? WHERE id = ?',
      [updatedName, updatedPrice, updatedCategory, updatedDesc, updatedImage, updatedStock, currentProduct.id]
    );

    const [updatedProduct] = await db.query('SELECT * FROM products WHERE id = ?', [currentProduct.id]);
    res.json(formatProduct(updatedProduct[0]));
  } catch (error) {
    next(error);
  }
};

// @desc    Hapus produk
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res, next) => {
  try {
    const idOrCode = req.params.id;
    
    let findQuery = 'SELECT * FROM products WHERE id = ?';
    if (isNaN(idOrCode)) {
      findQuery = 'SELECT * FROM products WHERE product_code = ?';
    }

    const [products] = await db.query(findQuery, [idOrCode]);
    if (products.length === 0) {
      res.status(404);
      throw new Error('Produk tidak ditemukan');
    }

    const product = products[0];

    await db.query('DELETE FROM products WHERE id = ?', [product.id]);
    res.json({ success: true, message: `Produk '${product.name}' berhasil dihapus` });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
