# Admin Extra Meal group actions

## Tujuan
- Menjadikan satu Request ID sebagai satu unit proses pada Admin Extra Meal, sehingga request multi-hari tidak perlu diproses per baris tanggal.
- Menyamakan pembatasan Cancel Request Extra Meal dengan Admin Kendaraan.

## Perubahan Admin Extra Meal
- Ubah keterangan halaman agar menjelaskan bahwa tindakan pada satu record berlaku untuk seluruh tanggal dengan Request ID yang sama.
- Pertahankan tampilan grup dan detail record harian untuk penelusuran, tetapi jalankan Koreksi & Approval Request serta Cancel Request pada seluruh record dalam grup Request ID.
- Saat status diubah menjadi Approved, Rejected, Submitted, atau Cancelled dari dialog koreksi, terapkan status tersebut ke semua record dengan Request ID yang sama.
- Saat kuantitas dikoreksi, terapkan nilai kuantitas yang disimpan ke semua record dengan Request ID yang sama sesuai pilihan pengguna bahwa seluruh aksi koreksi berlaku per grup.
- Ubah konfirmasi, status proses, dan notifikasi hasil agar menyebut Request ID serta jumlah record/tanggal yang terdampak, bukan hanya satu tanggal.
- Tangani kegagalan pembaruan massal dengan pesan yang jelas dan muat ulang data SharePoint agar pengguna melihat kondisi terbaru.

## Aturan Cancel Request
- Aktifkan Cancel Request hanya bila seluruh request masih dalam status proses `Submitted`.
- Nonaktifkan Cancel Request bila grup sudah memiliki status final `Approved`, `Rejected`, atau `Cancelled`.
- Tambahkan pemeriksaan ulang saat konfirmasi agar request final tidak dapat dibatalkan walaupun aksi dipicu di luar tombol normal.
- Saat valid, ubah seluruh record dengan Request ID yang sama menjadi `Cancelled`.

## Konsistensi data dan workflow
- Gunakan seluruh record SharePoint yang memiliki Request ID sama sebagai target pembaruan, bukan hanya record yang sedang terlihat akibat filter periode, status, pencarian, atau pagination.
- Pertahankan `ApprovalTrigger` hanya pada record pemicu yang sudah ada; aksi grup tidak membuat proses approval baru.
- Selaraskan panduan workflow dan overview aplikasi: satu approval dan seluruh aksi admin berlaku pada satu Request ID, sementara record harian tetap tersedia untuk audit dan detail layanan.
- Penghapusan permanen tidak diubah karena permintaan hanya mencakup approve, reject, koreksi, dan cancel.

## Verifikasi
- Uji request satu hari dan multi-hari untuk perubahan Approved, Rejected, Submitted, koreksi kuantitas, dan Cancelled.
- Pastikan semua record dengan Request ID sama berubah bersama, termasuk record yang tidak sedang tampil karena filter atau pagination.
- Pastikan Cancel Request nonaktif dan ditolak untuk grup Approved, Rejected, atau Cancelled.
- Pastikan dashboard requester dan ringkasan Admin Extra Meal tidak lagi menampilkan status campuran setelah aksi grup berhasil.
- Jalankan validasi proyek lengkap dan pastikan tidak ada error TypeScript, lint, maupun SDK.
