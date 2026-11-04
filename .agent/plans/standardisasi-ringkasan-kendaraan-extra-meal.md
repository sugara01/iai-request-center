# Standardisasi ringkasan request kendaraan

## Tujuan
- Menyamakan halaman ringkasan setelah submit Request Kendaraan dengan template ringkasan Request Extra Meal.
- Tetap menampilkan informasi khusus kendaraan dan status proses dari SharePoint/Power Automate.

## Perubahan
- Ganti card sukses sederhana pada halaman Request Kendaraan dengan struktur halaman detail dua kolom seperti ringkasan Extra Meal.
- Tampilkan header berisi nomor request, badge status `Submitted`, waktu pembuatan, dan nama requester.
- Tambahkan card **Ringkasan request** dengan informasi tujuan, departemen, tanggal dan jam jemput, titik jemput, jumlah penumpang, keperluan, serta catatan.
- Gunakan card **Status approval** yang sama di panel samping dengan pesan proses kendaraan melalui Power Automate.
- Pertahankan aksi kembali ke Dashboard Saya tanpa menambahkan informasi approver atau tombol reminder.
- Pastikan layout responsif mengikuti ukuran dan jarak template Extra Meal.

## Yang tetap sama
- Form, validasi, dialog konfirmasi, dan proses penyimpanan Request Kendaraan ke SharePoint `RequestKendaraanApps`.
- Nomor request dan data form yang sudah berhasil dikirim.
- Dashboard Saya, Admin Kendaraan, dan halaman ringkasan Extra Meal.

## Verifikasi
- Submit kendaraan berhasil mengganti form dengan halaman ringkasan lengkap.
- Seluruh nilai yang baru disubmit tampil benar pada card ringkasan.
- Template visual, susunan dua kolom, badge status, dan card Status approval konsisten dengan Extra Meal.
- Tampilan tetap rapi pada desktop dan layar kecil.
- Validasi proyek dan penggunaan SDK selesai tanpa error.
