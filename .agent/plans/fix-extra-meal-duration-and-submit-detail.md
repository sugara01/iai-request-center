# Perbaikan Durasi dan Submit Extra Meal

## Tujuan
- Menampilkan durasi request Extra Meal satu hari secara konsisten pada detail Dashboard Saya dan detail Admin Extra Meal.
- Menghilangkan kondisi “Request tidak ditemukan” setelah request berhasil disimpan.

## Perubahan
- Form `/request-extra-meal`: pertahankan input Durasi acara (jam) untuk request satu hari dan pastikan nilainya dikirim ke kolom SharePoint `DurationHours`.
- Dashboard Saya: tampilkan Durasi pada detail record harian; gunakan nilai jam untuk request satu hari dan jumlah hari kalender untuk request beberapa hari.
- Admin Extra Meal: tampilkan Durasi pada panel detail record harian dengan aturan tampilan yang sama seperti Dashboard Saya.
- Alur submit: setelah seluruh record SharePoint berhasil dibuat, sinkronkan data Extra Meal pada cache aplikasi sebelum membuka detail request.
- Halaman detail request: tangani waktu tunggu pembacaan data SharePoint agar request yang baru dibuat tidak langsung dianggap tidak ditemukan; tampilkan status memuat sampai data tersedia atau arahkan ke Dashboard Saya dengan notifikasi sukses jika detail belum dapat dimuat.
- Pertahankan Request ID, pembuatan satu record per tanggal, `ApprovalTrigger`, workflow Power Automate, dan fitur admin lainnya tanpa perubahan.

## Data
- ExtraMealReq

## Verifikasi
- Buat request satu hari dengan durasi jam, lalu pastikan `DurationHours` tersimpan di SharePoint.
- Pastikan durasi jam tampil di detail Dashboard Saya dan Admin Extra Meal.
- Buat request beberapa hari dan pastikan durasi tampil sebagai jumlah hari kalender.
- Klik Tinjau & Submit, konfirmasi penyimpanan, dan pastikan tidak muncul halaman “Request tidak ditemukan”.
- Pastikan request baru langsung tersedia pada Dashboard Saya dan detailnya dapat dibuka.
- Jalankan validasi proyek dan pemeriksaan SDK hingga lulus tanpa error.
