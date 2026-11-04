# Penyesuaian Mapping Text Tujuan dan Departemen Kendaraan

## Tujuan
- Menyesuaikan aplikasi setelah kolom SharePoint `Departemen` dan `Tujuan` pada list `RequestKendaraan` diubah dari Choice menjadi Single line of text.
- Memastikan request kendaraan baru tersimpan tanpa error dan kedua nilai tampil konsisten pada requester maupun admin.

## Perubahan
- Sinkronkan kembali schema `RequestKendaraan` dari SharePoint agar `Departemen` dan `Tujuan` dikenali sebagai field teks, bukan Choice atau referensi ID.
- Regenerasi data layer aplikasi berdasarkan schema terbaru tanpa mengubah tipe kolom Choice lain seperti `CurrentStatus`.
- Ubah proses submit kendaraan agar menulis label teks langsung ke `Departemen` dan `Tujuan`, tanpa lookup Choice, `#Id`, atau operasi referenced entity.
- Pertahankan pilihan form Departemen yang ada serta pilihan Tujuan `Merak - Jakarta (HO)`, `Jakarta - Merak`, dan `Lainnya`.
- Pertahankan `TujuanLainnyaDet` hanya untuk pilihan `Lainnya` dan kosongkan nilainya untuk dua rute standar.
- Sesuaikan pembacaan record agar menerima nilai teks langsung, sekaligus mempertahankan normalisasi variasi data lama agar dashboard requester, Admin Kendaraan, detail, pencarian, dan ekspor tidak menampilkan nilai kosong.
- Perbarui pesan kegagalan submit agar merujuk pada konfigurasi field teks terbaru dan tetap menampilkan detail koneksi yang relevan.
- Pertahankan workflow Power Automate, status awal `Submitted`, halaman, navigasi, bahasa, dan fitur lain tanpa perubahan.

## Data
- RequestKendaraan

## Verifikasi
- Submit request dengan tujuan `Merak - Jakarta (HO)` dan pastikan `Departemen` serta `Tujuan` terisi sebagai teks pada item SharePoint baru.
- Submit request dengan tujuan `Jakarta - Merak` dan departemen berbeda, lalu pastikan kedua field tidak kosong.
- Submit pilihan `Lainnya`, pastikan `Tujuan = Lainnya` dan `TujuanLainnyaDet` berisi detail yang dimasukkan.
- Pastikan record baru dan lama tampil benar pada dashboard requester dan Admin Kendaraan, termasuk detail, pencarian, dan ekspor CSV.
- Jalankan validasi proyek dan validasi penggunaan SDK hingga lulus tanpa error.
