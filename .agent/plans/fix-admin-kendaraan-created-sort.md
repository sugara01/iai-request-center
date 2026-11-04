# Fix urutan terbaru Admin Kendaraan

## Temuan
- Tabel `/admin-kendaraan` memang mencoba mengurutkan data terbaru lebih dulu, tetapi menggunakan kolom kustom `CreatedDate`.
- Schema SharePoint mendefinisikan `CreatedDate` sebagai **DateOnly**, sehingga jam/menit/detik submit terpotong dan semua request pada tanggal yang sama dianggap memiliki waktu yang sama.
- Ketika waktunya sama, comparator saat ini memakai Request ID sebagai pembanding cadangan; akibatnya urutan tidak mencerminkan waktu pembuatan record sebenarnya.
- SharePoint sudah menyediakan kolom sistem `Created` bertipe datetime lengkap pada datasource, tetapi kolom tersebut belum dipetakan dan belum digunakan oleh hook kendaraan.

## Perubahan
- Jadikan kolom sistem SharePoint `Created` sebagai timestamp sumber kebenaran untuk urutan request kendaraan.
- Pertahankan `CreatedDate` hanya sebagai fallback kompatibilitas untuk record lama bila `Created` tidak tersedia.
- Ubah query kendaraan agar meminta urutan `Created desc`, bukan `CreatedDate desc`.
- Ubah pemetaan data kendaraan agar membawa timestamp `Created` lengkap ke model tampilan yang dipakai Dashboard Saya dan Admin Kendaraan.
- Pastikan urutan default tabel `/admin-kendaraan` selalu terbaru ke terlama dan tidak menggunakan Request ID sebagai kriteria urutan normal.
- Pertahankan sorting manual berdasarkan ID atau Pemohon hanya ketika admin secara eksplisit menekan header kolom tersebut.
- Pertahankan filter periode, pencarian, status, pagination, refresh 15 detik, dan seluruh alur approval tanpa perubahan.

## Verifikasi
- Buat dua request kendaraan pada tanggal yang sama dari komputer/user berbeda dan pastikan request dengan nilai SharePoint `Created` paling baru berada di baris teratas.
- Pastikan Dashboard Saya dan `/admin-kendaraan` menampilkan urutan yang sama setelah refresh otomatis maupun manual.
- Pastikan klik sorting ID/Pemohon tetap bekerja, sedangkan kondisi awal halaman kembali menggunakan `Created` terbaru.
- Jalankan validasi project dan SDK sampai tanpa error.
