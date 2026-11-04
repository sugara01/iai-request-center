# Lengkapi Semua Kolom Export CSV Admin

## Tujuan
- Pastikan export CSV pada Admin Kendaraan dan Admin Extra Meal menyertakan seluruh kolom bisnis dari SharePoint yang digunakan aplikasi.
- Pertahankan filter periode, status, pencarian, dan urutan data aktif sehingga isi export tetap sesuai view admin, bukan hanya halaman pagination yang sedang dibuka.

## Admin Kendaraan
- Lengkapi export dengan semua data request kendaraan: SharePoint ID, Title/Request ID, identitas pemohon, departemen, jadwal, tujuan dan detail tujuan lain, keperluan, catatan requester, jumlah penumpang, titik jemput, status dan keputusan approval, seluruh catatan approval, serta tanggal dibuat dan diperbarui.
- Pastikan nilai choice ditampilkan sebagai label yang mudah dibaca dan nilai kosong tetap menghasilkan kolom CSV yang konsisten.

## Admin Extra Meal
- Lengkapi setiap baris record harian dengan semua data ExtraMealReq: SharePoint ID, Title, Request ID, Record ID, tanggal layanan, identitas requester, departemen, tujuan acara, tanggal mulai dan selesai, durasi jam, kategori meal, jumlah, permintaan tambahan, status, pemicu approval, dan waktu request dibuat.
- Pertahankan satu baris CSV untuk setiap record harian agar request multi-hari tetap dapat diaudit per tanggal.

## Format dan bahasa
- Gunakan header CSV sesuai bahasa aktif aplikasi, sementara ID, email, isi yang dimasukkan pengguna, dan nilai sumber tetap tidak diubah.
- Terapkan escaping CSV untuk koma, tanda kutip, dan baris baru pada seluruh kolom.
- Pertahankan nama file terpisah untuk export kendaraan dan Extra Meal serta notifikasi jumlah record yang berhasil diekspor.
- Kolom teknis internal konektor SharePoint yang tidak digunakan aplikasi, seperti token trigger, path internal, dan metadata attachment, tidak dimasukkan.

## Verifikasi
- Bandingkan header dan nilai export dengan seluruh kolom bisnis pada schema `RequestKendaraanApps` dan `ExtraMealReq`.
- Uji record dengan nilai kosong, teks berkoma/tanda kutip/baris baru, tujuan lainnya, catatan requester, durasi Extra Meal, dan request multi-hari.
- Uji export dalam Bahasa Indonesia dan English serta pastikan filter aktif diterapkan ke semua record hasil export.
- Jalankan validasi proyek penuh dan pastikan tidak ada error TypeScript, lint, build, atau SDK.

## Data dan integrasi
- Tidak ada perubahan SharePoint list, koneksi, atau data model.
- Perubahan hanya pada pembentukan file CSV dan label presentasi di halaman Admin Kendaraan serta Admin Extra Meal.
