# Perbaikan Mapping Departemen SharePoint

## Tujuan
- Memastikan Departemen yang dipilih pada form Request Kendaraan tersimpan ke kolom `Departemen` di SharePoint dan tampil kembali pada dashboard requester serta Admin Kendaraan.
- Mencegah nilai kosong ketika label atau key Departemen dari SharePoint berbeda format dengan key aplikasi.

## Temuan saat ini
- Form sudah mengirim pilihan Departemen ke proses pembuatan request.
- Integrasi saat ini mengubah key aplikasi menjadi label lalu menulisnya ke field SharePoint `Departemen`.
- Saat membaca data, aplikasi hanya menerima nilai yang persis cocok dengan daftar pilihan hasil generate; nilai yang tidak cocok akan menjadi kosong di aplikasi.
- Daftar aplikasi saat ini belum memuat `HR`, sedangkan daftar Departemen yang digunakan aplikasi sebelumnya mencakup HR; ketidaksesuaian pilihan aplikasi dan SharePoint dapat menyebabkan mapping gagal.

## Perubahan
- Sinkronkan pilihan Departemen Request Kendaraan dengan nilai aktual kolom `Departemen` pada list SharePoint `RequestKendaraan`, termasuk HR dan seluruh departemen yang digunakan bisnis.
- Tambahkan resolver Departemen terpusat yang menerima key aplikasi, label SharePoint, serta variasi label lama tanpa mengosongkan record yang sudah ada.
- Pastikan submit Request Kendaraan menulis nilai Departemen dalam format yang sesuai dengan tipe kolom SharePoint yang terdaftar.
- Pastikan pembacaan record menggunakan resolver yang sama untuk dashboard requester, detail request, Admin Kendaraan, pencarian, dan ekspor CSV.
- Tambahkan pesan error yang spesifik jika nilai Departemen tidak tersedia pada pilihan SharePoint agar masalah konfigurasi tidak tersamarkan.
- Pertahankan form, workflow approval, Tujuan, status, data kendaraan lain, dan navigasi tanpa perubahan.

## Data
- RequestKendaraan

## Verifikasi
- Uji submit satu request untuk setiap pilihan Departemen yang tersedia.
- Pastikan nilai Departemen tersimpan pada item SharePoint baru, bukan kosong.
- Pastikan record baru dan record lama menampilkan Departemen pada dashboard requester dan detail Admin Kendaraan.
- Pastikan pencarian dan ekspor Admin Kendaraan menggunakan label Departemen yang benar.
- Pastikan perubahan bahasa tidak mengubah nilai teknis yang dikirim ke SharePoint.
- Jalankan validasi proyek hingga lulus tanpa error.
