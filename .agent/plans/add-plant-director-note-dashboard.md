# Tambahkan catatan Plant Director di Dashboard Saya

## Perubahan
- Tambahkan **Catatan Plant Director** pada informasi detail request kendaraan di halaman **Dashboard Saya** (`/`).
- Ambil isi dari field SharePoint kendaraan yang sudah tersedia sebagai `plantDirectorNote`.
- Tampilkan tanda `-` jika Plant Director belum memberikan catatan, konsisten dengan Catatan Requester dan Catatan Admin.
- Tambahkan label bilingual Bahasa Indonesia/English agar mengikuti pilihan bahasa aplikasi.

## Tetap sama
- Tampilan tabel, filter, pagination, dan alur membuka panel detail tidak berubah.
- Detail Extra Meal tidak berubah.
- Tidak ada perubahan pada skema SharePoint, proses approval, maupun hak akses.

## Verifikasi
- Pastikan detail kendaraan menampilkan Catatan Requester, Catatan Admin, dan Catatan Plant Director dengan nilai yang benar.
- Pastikan catatan kosong ditampilkan sebagai `-` dan teks panjang tetap terbaca di panel detail.
- Pastikan label mengikuti bahasa aktif dan validasi proyek berhasil tanpa error.
