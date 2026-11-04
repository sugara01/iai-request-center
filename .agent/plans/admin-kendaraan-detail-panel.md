# Detail Lengkap Admin Kendaraan

## Tujuan
- Memungkinkan admin kendaraan membuka detail lengkap satu record SharePoint dari halaman `/admin-kendaraan` tanpa meninggalkan tabel monitoring.

## Perubahan
- Jadikan setiap baris tabel request kendaraan dapat diklik dan diakses dengan keyboard untuk membuka detail.
- Tambahkan ikon mata pada kolom aksi untuk membuka detail yang sama; aksi hapus tetap terpisah dan tidak ikut memicu panel detail.
- Tampilkan detail dalam panel samping yang dapat digulir agar tabel monitoring tetap berada di halaman.
- Kelompokkan informasi menjadi identitas request, requester, perjalanan, status dan keputusan approval, serta metadata record.
- Tampilkan semua kolom bisnis SharePoint yang tersedia pada model `RequestKendaraan`, termasuk ID request, nama dan email pemohon, departemen, tanggal, jam, tujuan, detail tujuan lain, keperluan, jumlah penumpang, titik jemput, status, keputusan dan catatan admin, keputusan dan catatan Plant Director, tanggal dibuat, dan pembaruan terakhir.
- Gunakan label Choice SharePoint yang mudah dibaca dan tampilkan tanda `-` untuk nilai yang kosong.
- Pertahankan pencarian, filter status, refresh, ekspor CSV, dan konfirmasi hapus yang sudah ada.

## Data
- RequestKendaraan

## Validasi
- Pastikan klik baris dan ikon mata membuka record yang benar.
- Pastikan ikon hapus hanya membuka konfirmasi hapus.
- Pastikan panel tetap aman untuk teks panjang, nilai kosong, dan layar kecil.
- Jalankan validasi proyek dan pemeriksaan SDK setelah implementasi.
