# Fix registrasi runtime Office 365 Users

## Tujuan
- Memulihkan pencarian pengguna Entra ID di halaman **Kelola Admin** dengan mendaftarkan koneksi Office 365 Users yang benar ke runtime aplikasi.

## Penyebab teridentifikasi
- Kode halaman dan service sudah memakai data source `office365users` secara konsisten.
- Entri Office 365 Users di `power.config.json` bukan registrasi koneksi runtime yang lengkap, sehingga build dapat lolos tetapi runtime tidak dapat menemukan data source.
- Tersedia dua koneksi Office 365 Users milik pengguna yang dapat diverifikasi dan diregistrasikan secara resmi.

## Perubahan
- Verifikasi koneksi `shared_office365users` yang masih aktif dan terotorisasi.
- Ganti referensi koneksi manual/tidak lengkap dengan registrasi koneksi resmi untuk aplikasi `apps/extra-meal-request`.
- Pertahankan nama data source `office365users` agar sesuai dengan service dan hook pencarian yang sudah ada.
- Regenerasi data layer konektor setelah registrasi agar konfigurasi runtime, schema, dan generated service sinkron.
- Pertahankan UI, validasi pemilihan pengguna, serta penyimpanan role admin yang sudah ada.

## Verifikasi
- Pastikan konfigurasi aplikasi memuat connection reference Office 365 Users yang aktif.
- Validasi build dan penggunaan SDK konektor tanpa error.
- Uji halaman `/kelola-admin`: ketik minimal dua karakter, hasil Entra ID muncul, pilih pengguna, lalu simpan assignment admin.
