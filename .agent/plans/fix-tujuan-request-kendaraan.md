# Perbaikan Tujuan Request Kendaraan

## Tujuan
- Memastikan kolom Tujuan wajib dipilih dan selalu tampil konsisten pada form requester, dashboard requester, detail requester, tabel Admin Kendaraan, detail admin, pencarian, dan ekspor.
- Menyamakan pilihan Tujuan menjadi `Merak - Jakarta (HO)`, `Jakarta - Merak`, dan `Lainnya`.

## Perubahan
- Form `/request-kendaraan`: mulai dari kondisi belum dipilih, tampilkan tiga pilihan tujuan yang ditetapkan, dan wajibkan pilihan sebelum submit.
- Form `/request-kendaraan`: tampilkan serta wajibkan kolom `Detail Tujuan lainnya` hanya ketika `Lainnya` dipilih; bersihkan detail tersebut ketika pilihan berpindah ke rute standar.
- Ringkasan sebelum submit: tampilkan pilihan Tujuan dan, khusus `Lainnya`, tampilkan Detail Tujuan lainnya sebagai informasi terpisah.
- Integrasi SharePoint RequestKendaraan: simpan label Tujuan yang tepat dan pertahankan `TujuanLainnyaDet` hanya untuk pilihan `Lainnya`.
- Normalisasi data kendaraan: gunakan satu resolver tujuan yang dapat membaca key aplikasi, label SharePoint terbaru, dan label lama agar record yang sudah ada tidak menjadi kosong.
- Dashboard requester: tampilkan rute standar pada kolom Tujuan/acara; untuk `Lainnya`, tampilkan detail tujuan dan sertakan Tujuan serta Detail Tujuan lainnya pada panel detail.
- Admin Kendaraan: tampilkan Tujuan pada tabel dan panel detail, tampilkan Detail Tujuan lainnya hanya ketika relevan, serta sertakan nilai yang benar dalam pencarian dan ekspor CSV.
- Pertahankan struktur halaman, workflow approval, status, data kendaraan lainnya, dan menu yang ada tanpa perubahan.

## Data
- RequestKendaraan

## Verifikasi
- Uji submit untuk masing-masing dari tiga pilihan tujuan.
- Pastikan dua rute standar tampil pada requester dan admin tanpa nilai kosong.
- Pastikan `Lainnya` mewajibkan dan menampilkan Detail Tujuan lainnya.
- Pastikan record lama dengan key atau label tujuan lama tetap memiliki tampilan tujuan yang dapat dibaca.
- Jalankan validasi proyek hingga lulus tanpa error.
