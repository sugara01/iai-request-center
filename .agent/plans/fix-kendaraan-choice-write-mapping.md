# Perbaikan Penulisan Tujuan dan Departemen Kendaraan

## Tujuan
- Memastikan pilihan `Merak - Jakarta (HO)`, `Jakarta - Merak`, dan seluruh Departemen tersimpan pada kolom Choice SharePoint `Tujuan` dan `Departemen`, bukan hanya tampil pada form aplikasi.
- Memastikan item yang baru dibuat langsung menampilkan nilai yang sama pada SharePoint, dashboard requester, dan Admin Kendaraan.

## Temuan saat ini
- Form sudah membawa key Tujuan dan Departemen sampai ke proses submit.
- Proses create saat ini mengirim label teks ke field Choice, sedangkan schema konektor SharePoint juga menyediakan field ID Choice (`Tujuan#Id` dan `Departemen#Id`); ketidaksesuaian jalur tulis ini menyebabkan item dapat dibuat tetapi kedua kolom kosong.
- Metadata lokal Tujuan masih memuat label lama `Merak - Jakarta`, sementara aplikasi memakai `Merak - Jakarta (HO)`; daftar Departemen lokal juga belum sepenuhnya sinkron dengan pilihan aktual SharePoint, termasuk HR.

## Perubahan
- Sinkronkan schema list `RequestKendaraan` dengan konfigurasi Choice SharePoint terbaru agar ID dan label Tujuan serta Departemen menjadi sumber mapping yang benar.
- Gunakan mapping teknis yang stabil dari key aplikasi ke ID Choice SharePoint untuk payload create; label bilingual hanya digunakan untuk tampilan dan tidak boleh mengubah nilai yang ditulis.
- Tetapkan mapping Tujuan untuk `Jakarta - Merak`, `Merak - Jakarta (HO)`, dan `Lainnya`, serta mapping seluruh pilihan Departemen yang tersedia di SharePoint.
- Hentikan submit dengan pesan yang jelas apabila sebuah pilihan belum memiliki ID Choice yang valid, sehingga aplikasi tidak lagi membuat record dengan Tujuan atau Departemen kosong.
- Setelah create berhasil, periksa respons item dan muat ulang data agar nilai yang benar langsung terlihat di dashboard requester dan Admin Kendaraan.
- Pertahankan data form, detail tujuan lainnya, nomor request, workflow approval, status, pencarian, sortir, ekspor, dan navigasi yang ada.

## Data
- RequestKendaraan

## Verifikasi
- Submit request uji dengan `Merak - Jakarta (HO)` dan satu Departemen, lalu periksa item baru langsung pada SharePoint: kedua kolom wajib terisi.
- Submit request uji kedua dengan `Jakarta - Merak` dan Departemen berbeda, lalu pastikan kedua kolom terisi.
- Uji `Lainnya` beserta Detail Tujuan lainnya untuk memastikan jalur pilihan ketiga tetap bekerja.
- Pastikan item uji tampil dengan Tujuan dan Departemen yang sama pada dashboard requester dan `/admin-kendaraan`, tanpa `-` atau nilai kosong.
- Uji pergantian Bahasa Indonesia/English dan pastikan nilai teknis yang dikirim tetap sama.
- Jalankan validasi proyek dan pemeriksaan SDK hingga lulus tanpa error.
