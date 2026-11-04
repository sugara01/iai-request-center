# Wrap teks Tujuan Lainnya

## Perubahan
- Batasi lebar kolom **Tujuan** pada tabel halaman `/admin-kendaraan` agar detail tujuan yang panjang tidak memperlebar tabel secara berlebihan.
- Tampilkan teks **Tujuan Lainnya** dalam beberapa baris dengan pemenggalan kata yang aman di dalam sel.
- Pertahankan label tujuan utama sebagai baris pertama dan detail tujuan lainnya sebagai baris kedua.

## Tetap sama
- Struktur kolom lain, horizontal scroll tabel, pagination, filter, sorting, ekspor CSV, klik baris, dan panel detail tetap seperti saat ini.
- Komponen tabel global tidak diubah agar wrapping hanya berlaku pada kolom Tujuan di halaman Admin Kendaraan.
- Sumber dan model data SharePoint tidak berubah.

## Verifikasi
- Pastikan teks tujuan panjang turun ke baris berikutnya dan kolom lain lebih mudah terlihat tanpa scroll horizontal berlebihan.
- Pastikan teks pendek, status, aksi baris, pagination, dan panel detail tetap tampil dan berfungsi normal.
- Jalankan validasi proyek dan SDK hingga tidak ada error.
