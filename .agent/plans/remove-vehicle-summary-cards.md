# Samakan dashboard Admin Kendaraan

## Perubahan
- Hapus tiga kartu tambahan di atas dashboard Admin Kendaraan: “Record SharePoint dimuat”, “Dalam periode aktif”, dan “Sesuai seluruh filter”.
- Tampilkan `AdminAnalyticsDashboard` langsung setelah header atau pesan error, mengikuti susunan halaman Admin Extra Meal.
- Hapus ikon dan import yang hanya digunakan oleh tiga kartu tersebut.

## Tetap dipertahankan
- Ringkasan operasional, pemilih periode, kartu status, indikator, grafik, dan daftar “Perlu perhatian”.
- Pesan kegagalan pemuatan data beserta tombol coba lagi.
- Tabel request kendaraan, pencarian, filter status, pagination, detail, hapus, refresh, dan ekspor CSV.
- Logika periode dan filter dashboard yang sudah berjalan.

## Verifikasi
- Pastikan ketiga kartu tidak lagi tampil pada `/admin-kendaraan`.
- Pastikan urutan dashboard konsisten dengan Admin Extra Meal dan seluruh filter tetap berfungsi.
- Jalankan validasi proyek untuk memastikan tidak ada import atau error TypeScript tersisa.