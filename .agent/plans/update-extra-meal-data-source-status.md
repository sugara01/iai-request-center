# Update Extra Meal data source status

## Tujuan
- Menampilkan informasi sumber data secara akurat dan konsisten setelah integrasi SharePoint `ExtraMealReq` aktif.

## Perubahan
- Perbarui bagian **Data sources** pada sidebar global agar menampilkan `Extra Meal: SharePoint aktif` tanpa typo.
- Pastikan status Extra Meal menggunakan sistem terjemahan yang sama dengan status Kendaraan dan Akses admin.
- Tampilkan `Extra Meal: SharePoint active` ketika aplikasi menggunakan English.
- Pertahankan struktur halaman `/buat-request`, navigasi, dan informasi data source lainnya tanpa perubahan.

## Verifikasi
- Buka `/buat-request` dalam Bahasa Indonesia dan pastikan ketiga sumber data berstatus SharePoint aktif.
- Ganti ke English dan pastikan seluruh baris Data sources ikut diterjemahkan, termasuk Extra Meal.
- Jalankan validasi proyek hingga lulus tanpa error.
