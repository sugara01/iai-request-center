# Perbaikan Mapping Catatan Requester Kendaraan

## Tujuan
- Memastikan nilai field **Catatan** pada form Request Kendaraan tersimpan ke kolom SharePoint `CatatanRequester` di list `RequestKendaraanApps`.
- Memastikan nilai dari `CatatanRequester` dibaca kembali sebagai catatan requester di aplikasi.

## Perubahan
- Sinkronkan metadata/data layer `RequestKendaraanApps` agar kolom `CatatanRequester` tersedia pada kontrak baca dan tulis generated.
- Petakan field aplikasi `catatan` ke `CatatanRequester` pada payload pembuatan request kendaraan.
- Petakan `CatatanRequester` ke field aplikasi `catatan` saat data kendaraan dibaca dari SharePoint.
- Sertakan mapping yang sama pada payload update kendaraan agar nilai catatan tidak hilang ketika request dikoreksi atau disimpan ulang.
- Pertahankan field form, label, tampilan Dashboard Saya, detail Admin Kendaraan, ekspor CSV, status approval, dan seluruh fitur Extra Meal tanpa perubahan.

## Data
- RequestKendaraanApps

## Verifikasi
- Buat request kendaraan baru dengan Catatan terisi dan pastikan nilai yang sama tersimpan pada kolom SharePoint `CatatanRequester`.
- Pastikan catatan tampil kembali pada detail Dashboard Saya, detail Admin Kendaraan, dan ekspor CSV.
- Koreksi request yang memiliki catatan dan pastikan nilainya tetap tersimpan setelah update.
- Uji catatan kosong agar request tetap dapat dibuat tanpa error.
- Jalankan validasi proyek dan pemeriksaan SDK hingga lulus tanpa error.
