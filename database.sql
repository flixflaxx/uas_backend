-- --------------------------------------------------------
-- Database: uas_flixxmart
-- --------------------------------------------------------

CREATE DATABASE IF NOT EXISTS uas_flixxmart;
USE uas_flixxmart;

-- --------------------------------------------------------
-- Table Structure: users
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table Structure: products
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(255) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table Structure: orders
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_address TEXT NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table Structure: order_items
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Seed Data: products (prod_001 to prod_008)
-- --------------------------------------------------------
INSERT INTO products (product_code, name, price, category, description, image_url, stock) VALUES
('prod_001', 'Kemeja Batik Pria', 150000.00, 'Pakaian', 'Kemeja batik modern dengan motif klasik, cocok untuk acara formal maupun kasual.', 'images/products/prod_001.jpg', 20),
('prod_002', 'Dress Casual Wanita', 200000.00, 'Pakaian', 'Dress casual elegan dengan bahan nyaman untuk aktivitas sehari-hari.', 'images/products/prod_002.jpg', 15),
('prod_003', 'Laptop Stand Aluminium', 350000.00, 'Elektronik', 'Stand laptop ergonomis dari aluminium premium, mendukung berbagai ukuran laptop.', 'images/products/prod_003.jpg', 10),
('prod_004', 'Wireless Mouse', 120000.00, 'Elektronik', 'Mouse wireless 2.4GHz dengan baterai tahan lama dan desain ergonomis.', 'images/products/prod_004.jpg', 25),
('prod_005', 'Sepatu Sneakers Pria', 450000.00, 'Sepatu', 'Sneakers pria stylish dengan sol karet anti-slip, nyaman untuk aktivitas harian.', 'images/products/prod_005.jpg', 8),
('prod_006', 'Sandal Wanita Casual', 95000.00, 'Sepatu', 'Sandal wanita ringan dan nyaman dengan desain modern.', 'images/products/prod_006.jpg', 12),
('prod_007', 'Tas Ransel Laptop', 280000.00, 'Tas', 'Tas ransel multifungsi dengan kompartemen laptop 15 inch dan bahan waterproof.', 'images/products/prod_007.jpg', 10),
('prod_008', 'Dompet Kulit Pria', 175000.00, 'Tas', 'Dompet kulit asli dengan banyak slot kartu dan desain slim.', 'images/products/prod_008.jpg', 30)
ON DUPLICATE KEY UPDATE 
    name=VALUES(name), price=VALUES(price), category=VALUES(category), 
    description=VALUES(description), image_url=VALUES(image_url), stock=VALUES(stock);

-- --------------------------------------------------------
-- Seed Data: users (Admin & Customers)
-- Passwords are encrypted using bcrypt (salt rounds: 10)
-- 'admin123' -> $2a$10$.LTJDRBOXTE8nJuMbB6gH.NpoFIkPGFxW.9PBn0j9PNnDD838gGKW
-- 'budi123'  -> $2a$10$WhMek/uxdHi2xjrgtfkFNeEIofa0M0kYZ19WYtqk2B07kcIjaJ76y
-- 'siti123'  -> $2a$10$aoa2RJMr1OXgkp1d3Sft4uwP7g4EHA/Ij152.7X.YvekH3ni9SMzu
-- 'andi123'  -> $2a$10$2sOYpwe5KPu6X2KLhaE0yOMu1ZsOBPM2/33YFXLrANVMl6XMVI96e
-- --------------------------------------------------------
INSERT INTO users (name, email, password, role) VALUES
('Admin', 'admin@toko.com', '$2a$10$.LTJDRBOXTE8nJuMbB6gH.NpoFIkPGFxW.9PBn0j9PNnDD838gGKW', 'admin'),
('Budi Santoso', 'budi@email.com', '$2a$10$WhMek/uxdHi2xjrgtfkFNeEIofa0M0kYZ19WYtqk2B07kcIjaJ76y', 'user'),
('Siti Rahayu', 'siti@email.com', '$2a$10$aoa2RJMr1OXgkp1d3Sft4uwP7g4EHA/Ij152.7X.YvekH3ni9SMzu', 'user'),
('Andi Wijaya', 'andi@email.com', '$2a$10$2sOYpwe5KPu6X2KLhaE0yOMu1ZsOBPM2/33YFXLrANVMl6XMVI96e', 'user')
ON DUPLICATE KEY UPDATE 
    name=VALUES(name), password=VALUES(password), role=VALUES(role);
