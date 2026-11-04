# Wrap kolom tujuan kendaraan

## Ringkasan

Perbaiki tabel kendaraan pada **Dashboard Saya** (`/`) dan **Admin Kendaraan** (`/admin-kendaraan`) agar tujuan yang panjang tidak terus memperlebar halaman, tetap mudah dibaca, dan kolom lain dapat diakses melalui scroll horizontal.

## Perubahan

- Bungkus tabel **Request saya** dan **Request kendaraan** dalam area scroll horizontal saat total lebar kolom melebihi viewport.
- Tetapkan lebar minimum kedua tabel agar kolom penting tidak terkompresi terlalu sempit.
- Atur kolom **Tujuan / acara** pada Dashboard Saya dan kolom **Tujuan** pada Admin Kendaraan ke lebar minimum dan maksimum yang seimbang.
- Aktifkan word wrap/break untuk teks tujuan panjang, termasuk nilai **Tujuan lainnya**, sehingga teks turun ke beberapa baris di dalam kolom.
- Pertahankan isi, filter, pagination, ekspansi Extra Meal, panel detail, aksi admin, dan perilaku klik tabel yang sudah ada.
- Pastikan tampilan desktop dan layar sempit tetap dapat mengakses semua kolom tanpa memanjangkan keseluruhan halaman ke kanan.
- Halaman **Admin Extra Meal** (`/admin-meal`) tidak diubah karena tidak menampilkan kolom tujuan kendaraan.

## Verifikasi

- Uji tujuan pendek dan tujuan sangat panjang pada tabel Dashboard Saya dan Admin Kendaraan.
- Pastikan teks panjang membungkus dalam kolom dengan ukuran yang stabil.
- Pastikan scroll horizontal muncul pada masing-masing area tabel ketika diperlukan dan dapat digunakan untuk melihat kolom lainnya.
- Pastikan pagination, kontrol tabel, serta aksi admin tidak ikut terpotong atau berubah perilakunya.
- Jalankan validasi proyek setelah perubahan.
