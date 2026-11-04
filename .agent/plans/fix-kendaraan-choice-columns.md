# Perbaikan Kolom Choice Request Kendaraan

## Tujuan
- Menyesuaikan aplikasi dengan perubahan kolom SharePoint `Departemen`, `Tujuan`, dan `CurrentStatus` menjadi tipe Choice.
- Memastikan request kendaraan baru menyimpan ketiga nilai tersebut dan tetap tampil benar pada dashboard requester serta Admin Kendaraan.

## Perubahan
- Sinkronkan ulang schema data source SharePoint `RequestKendaraan` agar metadata lokal mengenali `Departemen`, `Tujuan`, dan `CurrentStatus` sebagai Choice terbaru.
- Regenerasi data layer agar model baca/tulis dan metadata runtime konsisten dengan schema SharePoint yang baru.
- Sesuaikan mapping submit untuk mengirim nilai Choice melalui field tulis resmi hasil regenerasi, dengan label yang persis sama dengan pilihan SharePoint.
- Pertahankan status awal `Submitted` dan validasi pilihan Departemen serta Tujuan sebelum item dibuat.
- Pertahankan normalisasi pembacaan nilai Choice berbentuk objek maupun teks agar record lama dan baru tetap tampil pada dashboard, detail, pencarian, filter, dan ekspor.
- Perbarui pesan kegagalan submit agar menyebut konfigurasi Choice terbaru, bukan lagi meminta kolom Single line of text.
- Pertahankan form, daftar pilihan bisnis, Detail Tujuan lainnya, nomor request, Power Automate, navigasi, dan tampilan Admin Kendaraan lainnya tanpa perubahan.

## Data
- RequestKendaraan

## Verifikasi
- Pastikan schema hasil sinkronisasi menandai `Departemen`, `Tujuan`, dan `CurrentStatus` sebagai Choice serta menyediakan kontrak baca/tulis yang sesuai.
- Submit request dengan rute standar dan pastikan ketiga kolom terisi pada item SharePoint baru.
- Submit request dengan `Lainnya` dan pastikan `Tujuan = Lainnya` serta `TujuanLainnyaDet` ikut tersimpan.
- Pastikan request baru tampil dengan Departemen, Tujuan, dan status `Submitted` pada dashboard requester dan `/admin-kendaraan`.
- Pastikan record lama tetap terbaca tanpa nilai kosong atau error normalisasi.
- Jalankan validasi proyek dan pemeriksaan SDK hingga lulus tanpa error.
