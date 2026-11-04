# Hapus tren request dashboard admin

## Perubahan
- Hapus kartu dan grafik **Tren request** dari dashboard bersama yang digunakan Admin Kendaraan dan Admin Extra Meal.
- Rapikan area analitik agar **Distribusi status** dan **Perlu perhatian** mengisi ruang yang tersedia secara seimbang.
- Hapus perhitungan data tren yang sudah tidak digunakan dari halaman Admin Kendaraan dan Admin Extra Meal.
- Pertahankan filter periode, kartu status, indikator operasional, distribusi status, daftar perlu perhatian, tabel, pencarian, ekspor, dan aksi admin yang ada.
- Perbarui ringkasan kapabilitas dashboard di `docs/overview.md` agar tidak lagi menyebut grafik tren.

## Halaman terdampak
- **Admin Kendaraan** (`/admin-kendaraan`) — tren request dihapus tanpa mengubah data dan kontrol lainnya.
- **Admin Extra Meal** (`/admin-meal`) — tren request dihapus tanpa mengubah pengelompokan dan pengelolaan request harian.

## Data
- Tidak ada perubahan sumber data, koneksi SharePoint, atau model data.

## Verifikasi
- Pastikan kedua dashboard tidak lagi menampilkan maupun menghitung tren request.
- Pastikan layout analitik tetap responsif dan seluruh filter serta kartu yang dipertahankan tetap berfungsi.
- Jalankan validasi proyek dan SDK hingga tidak ada error.
