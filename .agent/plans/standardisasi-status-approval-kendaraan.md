# Standardisasi status approval kendaraan

## Perubahan
- Setelah request kendaraan berhasil disimpan, tampilkan ringkasan hasil submit sebelum pengguna kembali ke Dashboard Saya.
- Tambahkan card **Status approval** dengan template visual yang sama seperti Extra Meal: ikon konfirmasi, status **Request submitted**, dan keterangan bahwa request sedang diproses melalui Power Automate.
- Gunakan konteks kendaraan pada keterangan proses tanpa menampilkan informasi approver atau tombol reminder.
- Sediakan tombol untuk kembali ke Dashboard Saya setelah pengguna membaca status pengajuan.

## Tetap sama
- Form, validasi, dialog tinjauan, dan penyimpanan ke SharePoint `RequestKendaraanApps` tidak berubah.
- Alur approval dan pembaruan status oleh Power Automate tidak berubah.
- Dashboard requester dan halaman admin kendaraan tidak berubah.

## Verifikasi
- Pastikan card hanya muncul setelah penyimpanan kendaraan berhasil.
- Pastikan kegagalan penyimpanan tetap mempertahankan form dan menampilkan pesan error.
- Pastikan tampilan responsif serta konsisten dengan card Status approval Extra Meal.
- Jalankan validasi proyek penuh tanpa error.