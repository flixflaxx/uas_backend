const express = require('express');
const router = express.Router();
const {
  checkout,
  getOrders,
  updateOrderStatus,
  getCustomers,
  getCategorySalesReport
} = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Route Checkout (Proses order)
router.post('/checkout', checkout);

// Route Kelola Orders
router.route('/orders')
  .get(protect, getOrders);

router.route('/orders/:id/status')
  .put(protect, adminOnly, updateOrderStatus);

// Route Laporan Admin
router.route('/admin/customers')
  .get(protect, adminOnly, getCustomers);

router.route('/admin/reports/category-sales')
  .get(protect, adminOnly, getCategorySalesReport);

module.exports = router;
