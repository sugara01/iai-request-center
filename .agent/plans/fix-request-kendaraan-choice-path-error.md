# Perbaikan error submit Request Kendaraan

## Tujuan
- Menghilangkan error runtime `Cannot read properties of undefined (reading 'path')` pada `/request-kendaraan`.
- Memastikan Departemen, Tujuan, dan CurrentStatus tersimpan pada item SharePoint RequestKendaraan.

## Temuan saat ini
- Error berasal dari pemanggilan operasi referensi dinamis `GetDepartemen`, `GetTujuan`, dan `GetCurrentStatus` sebelum item dibuat.
- Operasi tersebut tidak memiliki metadata `path` yang dibutuhkan runtime konektor SharePoint.
- Model hasil generate sudah menyediakan field tulis resmi untuk Departemen, Tujuan, dan CurrentStatus, sehingga lookup referensi dinamis tidak perlu dijalankan dari form.

## Perubahan
- Hapus alur `getReferencedEntity` dan `resolveChoiceId` dari proses submit kendaraan.
- Susun payload create hanya menggunakan field tulis yang didukung schema konektor SharePoint terbaru untuk Departemen, Tujuan, dan CurrentStatus.
- Pertahankan mapping label aplikasi ke nilai Choice SharePoint, termasuk `CurrentStatus = Submitted`.
- Pertahankan seluruh perilaku form yang ada: format jam 24 jam, pop-up konfirmasi, nomor request, data requester, dan navigasi setelah submit.
- Perjelas pesan kegagalan submit agar menunjukkan kolom SharePoint yang bermasalah tanpa menutup pop-up pemeriksaan.

## Verifikasi
- Buka `/request-kendaraan` dan pastikan form tidak memanggil operasi referensi saat halaman dimuat.
- Submit request baru untuk memastikan tidak ada lagi error `reading 'path'`.
- Periksa item baru di SharePoint dan pastikan Departemen, Tujuan, serta CurrentStatus berisi nilai yang dipilih.
- Pastikan request baru muncul di dashboard dan halaman admin kendaraan.
- Jalankan validasi proyek dan pemeriksaan SDK sampai lulus tanpa error.
