# Nonaktifkan Cancel untuk Status Final Kendaraan

## Perubahan
- Pada halaman **Admin Kendaraan**, izinkan aksi **Batalkan request** hanya ketika request masih dalam proses approval.
- Nonaktifkan ikon Cancel ketika status request sudah **Approved**, berstatus **Rejected** dari Admin atau Plant Director, atau sudah **Cancelled**.
- Pertahankan aksi lihat detail, koreksi/approval, dan hapus request tanpa perubahan.
- Pertahankan dialog konfirmasi dan proses perubahan status menjadi **Cancelled** untuk request yang masih diproses.
- Tambahkan pengamanan pada proses pembatalan agar request berstatus final tidak dapat dibatalkan meskipun aksi dipicu di luar kondisi tombol normal.

## Cakupan
- Route: `/admin-kendaraan`
- Tidak mengubah alur Admin Extra Meal.
- Tidak mengubah data model, keputusan approval, catatan, filter, atau tampilan dashboard lainnya.

## Verifikasi
- Ikon Cancel aktif untuk request yang masih Submitted atau menunggu keputusan approval.
- Ikon Cancel nonaktif untuk Approved, seluruh status Rejected, dan Cancelled.
- Request yang masih diproses tetap dapat dibatalkan dan berubah menjadi Cancelled setelah konfirmasi.
- Proyek lolos validasi tanpa error.