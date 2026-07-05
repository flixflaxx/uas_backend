# Link Demo 
feuas-production-e3f1.up.railway.app

# FlixxMart E-Commerce Backend API (Tugas UAS)

Repositori ini berisi kode sumber backend lengkap untuk aplikasi Single Page Application (SPA) E-commerce **FlixxMart**. Dibangun menggunakan **Node.js (Express)**, database **MySQL**, dan terintegrasi dengan **WhatsApp Click-to-Chat** serta **WhatsApp Gateway (Fonnte)**.

Backend ini juga telah diintegrasikan secara penuh dengan frontend "utsweb" menggunakan sistem toggle `USE_BACKEND` pada berkas `script.js` frontend.

---

## 🚀 Fitur Utama
1. **API CRUD Produk**: Manajemen inventaris produk lengkap (ambil semua dengan filter pencarian & kategori, detail produk, tambah, perbarui, dan hapus) yang langsung disinkronkan ke MySQL.
2. **API Autentikasi JWT**: Registrasi akun dan login aman menggunakan enkripsi password `bcryptjs` dan otorisasi endpoint admin via `jsonwebtoken` (JWT).
3. **API Checkout & Transaksi DB**: Pengurangan stok otomatis dalam MySQL Connection Pool Transaction, serta pembuatan ringkasan order belanja yang aman.
4. **Notifikasi WhatsApp Ganda**:
   - **Click-to-Chat Link (`wa.me`)**: Mengalihkan pembeli secara otomatis ke WhatsApp owner/admin dengan teks pesanan terformat rapi.
   - **WhatsApp Gateway (Fonnte)**: Mengirimkan notifikasi server-side secara langsung di background ke nomor pemilik toko ketika pesanan dibuat (jika token diisi).
5. **Panel Admin & Metrik Terintegrasi**: Endpoint khusus untuk memasok data analitik (Chart.js) dan daftar pelanggan beserta metrik belanjanya.

---

## 🛠️ Prasyarat Sistem
Sebelum memulai, pastikan perangkat Anda sudah terinstal:
* **Node.js** (Rekomendasi versi terbaru/LTS, telah diuji pada `v24.11.0`)
* **MySQL Server** (XAMPP / Laragon / MySQL Installer lokal)

---

## 📁 Struktur Folder Backend
```text
uasbe/
├── config/
│   └── db.js                 # Konfigurasi MySQL Connection Pool
├── controllers/
│   ├── authController.js     # Logika Register & Login User
│   ├── productController.js  # Logika CRUD Produk & Filters
│   └── orderController.js    # Logika Checkout & Laporan Admin
├── middleware/
│   ├── authMiddleware.js     # Proteksi JWT & Hak Akses Admin
│   └── errorMiddleware.js    # Penanganan Error 404 & 500 (JSON response)
├── routes/
│   ├── authRoutes.js         # Endpoint Autentikasi
│   ├── productRoutes.js      # Endpoint Manajemen Produk
│   └── orderRoutes.js        # Endpoint Checkout & Laporan
├── utils/
│   └── waNotification.js     # Formatter & Integrasi WhatsApp Gateway (Fonnte)
├── .env                      # File konfigurasi sensitif (aktif)
├── .env.example              # Template konfigurasi environment
├── database.sql              # Skema DDL & seed data produk awal
├── package.json              # Daftar dependensi & script Node
├── postman_collection.json   # Koleksi Postman untuk pengujian API
├── README.md                 # Dokumentasi panduan ini
└── server.js                 # Entry point utama aplikasi Express
```

---

## ⚙️ Petunjuk Instalasi & Setup

### 1. Instalasi Dependensi NPM
Buka terminal/command prompt pada direktori `uasbe`, lalu jalankan perintah berikut untuk menginstal semua package yang diperlukan:
```bash
npm install
```

### 2. Setup Database MySQL
1. Pastikan server MySQL Anda aktif (misalnya melalui XAMPP Control Panel).
2. Buka alat pengelola database Anda (phpMyAdmin, DBeaver, HeidiSQL, atau MySQL CLI).
3. Buat database baru bernama `uas_flixxmart` (opsional, sql script akan otomatis membuatnya jika belum ada).
4. Impor berkas [database.sql](database.sql) ke dalam database MySQL Anda untuk membuat tabel dan memasukkan 8 data produk bawaan beserta 4 akun demo default.

### 3. Konfigurasi Environment (`.env`)
Berkas `.env` telah disediakan dengan konfigurasi standar. Jika Anda menggunakan kredensial MySQL yang berbeda, silakan sesuaikan isinya:
```env
PORT=3000
NODE_ENV=development

# Konfigurasi Database MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=uas_flixxmart

# Kunci JWT (Dapat diganti dengan string acak apa saja)
JWT_SECRET=secret_key_flixxmart

# Nomor WhatsApp Owner Toko (Untuk tujuan pengiriman detail pesanan)
OWNER_WA_NUMBER=6289527204180

# (Opsional) Token WhatsApp Gateway Fonnte jika ingin menggunakan fitur API Gateway
# FONNTE_TOKEN=token_fonnte_anda
```

### 4. Menjalankan Server Backend
* **Mode Pengembangan (Hot Reload menggunakan nodemon):**
  ```bash
  npm run dev
  ```
* **Mode Produksi (Standard Node runner):**
  ```bash
  npm start
  ```

Setelah server berjalan, Anda dapat memverifikasinya dengan membuka alamat berikut di browser Anda: [http://localhost:3000/api/status](http://localhost:3000/api/status)

---

## 🔗 Integrasi dengan Frontend (utsweb)

Integrasi backend dengan frontend dikendalikan sepenuhnya melalui variabel toggle di bagian teratas file [script.js](file:///d:/tugas%20uts%20sem4/utsweb/script.js):

```javascript
// Bagian teratas utsweb/script.js
const USE_BACKEND = true; // Set ke true untuk menggunakan database MySQL, false untuk LocalStorage
const API_BASE_URL = 'http://localhost:3000/api';
```

* **Jika `USE_BACKEND = true`**: Seluruh data Katalog Produk, Login, Register, Transaksi Checkout, Riwayat Pesanan, dan Dashboard Laporan Grafik Admin akan diakses secara real-time dari server Express & database MySQL.
* **Jika `USE_BACKEND = false`**: Aplikasi akan berjalan offline menggunakan LocalStorage browser sebagai penyimpanan data (sangat berguna sebagai fallback offline).

---

## 📬 Daftar Endpoint API

### 1. Autentikasi (`/api/auth`)
* `POST /api/auth/register` - Pendaftaran akun baru (Public)
* `POST /api/auth/login` - Masuk & dapatkan JWT token (Public)

### 2. CRUD Produk (`/api/products`)
* `GET /api/products` - Ambil daftar produk. Mendukung query filter: `?q=kemeja&category=Pakaian&minPrice=100000&maxPrice=300000` (Public)
* `GET /api/products/:id` - Detail produk berdasarkan ID integer atau `product_code` (Public)
* `POST /api/products` - Tambah produk baru (Admin Only - JWT Required)
* `PUT /api/products/:id` - Edit produk berdasarkan ID (Admin Only - JWT Required)
* `DELETE /api/products/:id` - Hapus produk berdasarkan ID (Admin Only - JWT Required)

### 3. Checkout & Pemesanan (`/api`)
* `POST /api/checkout` - Checkout keranjang belanja (Public - Mengurangi stok database secara otomatis dan menghasilkan link WhatsApp Click-to-Chat)
* `GET /api/orders` - Riwayat pesanan. Admin melihat seluruh transaksi, Customer biasa hanya melihat transaksi miliknya (Auth JWT Required)
* `PUT /api/orders/:id/status` - Mengubah status transaksi pesanan (Admin Only - JWT Required)

### 4. Laporan & Metrik Admin (`/api/admin`)
* `GET /api/admin/customers` - Ambil daftar pelanggan beserta metrik statistik jumlah pesanan dan total belanjaan mereka (Admin Only - JWT Required)
* `GET /api/admin/reports/category-sales` - Ambil data total penjualan per kategori produk untuk Chart.js (Admin Only - JWT Required)

---

## 🧪 Pengujian API dengan Postman
1. Buka aplikasi Postman.
2. Klik tombol **Import** di kiri atas, lalu pilih berkas [postman_collection.json](postman_collection.json).
3. Setelah berhasil diimpor, gunakan koleksi request yang tersedia untuk menguji endpoint.
4. **Tips Otomatisasi**: Uji request **Login User / Admin** terlebih dahulu. Response test script akan secara otomatis menyimpan token JWT hasil login ke dalam variabel koleksi `{{jwt_token}}` untuk digunakan pada request admin lainnya secara langsung!

---

## 👥 Akun Demo Uji Coba (Telah Disediakan di `database.sql`)
1. **Administrator (Akses Admin Panel & CRUD Produk)**
   * **Email**: `admin@toko.com`
   * **Password**: `admin123`
2. **Pelanggan Biasa (Belanja & Riwayat Pesanan)**
   * **Email**: `budi@email.com` | `siti@email.com` | `andi@email.com`
   * **Password**: `budi123` | `siti123` | `andi123`
