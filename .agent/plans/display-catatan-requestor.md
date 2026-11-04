# Menampilkan Catatan Requester Kendaraan

## Tujuan
- Menampilkan isi kolom SharePoint `CatatanRequestor` pada detail request kendaraan di dashboard requester (`/`) dan detail Admin Kendaraan.
- Memastikan catatan requester tidak tertukar dengan `AdminNote` atau `PlantDirectorNote`.

## Perubahan
- Sinkronkan schema dan data layer list SharePoint `RequestKendaraan` agar kolom teks `CatatanRequestor` tersedia untuk dibaca aplikasi.
- Perbarui normalisasi data kendaraan agar `CatatanRequestor` dipetakan ke field catatan requester pada model aplikasi.
- Dashboard requester: tambahkan baris **Catatan requester** pada pop-up detail request kendaraan, dengan tanda `-` ketika nilainya kosong.
- Admin Kendaraan: tambahkan **Catatan requester** pada bagian detail perjalanan/request di panel detail, dengan tanda `-` ketika nilainya kosong.
- Pertahankan tampilan tabel, form request, catatan admin, catatan Plant Director, filter, sortir, ekspor, dan workflow yang sudah ada.
- Pastikan label baru mengikuti pilihan Bahasa Indonesia dan English.

## Data
- RequestKendaraan

## Verifikasi
- Uji record SharePoint yang memiliki `CatatanRequestor` dan pastikan teks yang sama tampil pada detail dashboard requester.
- Pastikan teks yang sama tampil pada detail Admin Kendaraan.
- Uji record dengan `CatatanRequestor` kosong dan pastikan UI menampilkan `-` tanpa error.
- Pastikan `Catatan admin` dan `Catatan Plant Director` tetap menampilkan sumber datanya masing-masing.
- Jalankan validasi proyek dan validasi SDK hingga lulus tanpa error.
