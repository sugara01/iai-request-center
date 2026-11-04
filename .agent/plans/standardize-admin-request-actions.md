# Standardisasi aksi Admin Kendaraan dan Extra Meal

## Tujuan
Menyamakan pola aksi pada tabel Admin Kendaraan dan Admin Extra Meal, sekaligus menambahkan koreksi lengkap dan pembatalan aman untuk request kendaraan.

## Perubahan Admin Kendaraan
- Pertahankan aksi lihat detail dengan ikon mata dan aksi hapus yang sudah tersedia.
- Tambahkan aksi koreksi dengan ikon pencil pada setiap record.
- Sediakan dialog koreksi untuk data pemohon, departemen, tanggal, jam, tujuan, detail tujuan lainnya, keperluan, jumlah penumpang, titik jemput, catatan requester, catatan admin, keputusan approval, dan CurrentStatus.
- Tampilkan nomor request sebagai informasi read-only dan jangan izinkan perubahan pada nomor tersebut.
- Tambahkan `Cancelled` sebagai pilihan CurrentStatus kendaraan dan dukung pembacaan, penyimpanan, filter, badge, dashboard, detail, serta ekspor status tersebut.
- Tambahkan aksi cancel dengan ikon X-circle yang membuka warning konfirmasi sebelum menyimpan status `Cancelled`.
- Nonaktifkan aksi cancel untuk record yang sudah berstatus `Cancelled`.
- Pertahankan konfirmasi terpisah untuk penghapusan permanen.

## Perubahan Admin Extra Meal
- Ubah aksi cancel agar membuka warning konfirmasi sebelum status record harian diubah menjadi `Cancelled`.
- Pertahankan dialog koreksi, detail, dan konfirmasi hapus yang ada.
- Pertahankan aturan bahwa pembatalan berlaku hanya pada record harian yang dipilih.

## Konsistensi aksi
- Gunakan urutan dan ikon yang sama pada kedua halaman: Eye untuk lihat, Pencil untuk koreksi, XCircle untuk cancel, dan Trash2 untuk hapus.
- Tambahkan tooltip berlabel pada seluruh ikon aksi di kedua halaman.
- Pastikan klik ikon tidak memicu aksi klik pada baris tabel.
- Gunakan status visual dan notifikasi sukses/gagal yang konsisten untuk update, cancel, dan delete.

## Data dan integrasi
- Perbarui model pilihan CurrentStatus kendaraan agar mencakup `Cancelled` dan selaras dengan choice pada SharePoint List `RequestKendaraanApps`.
- Gunakan mutation update kendaraan yang sudah ada untuk koreksi dan pembatalan, lalu refresh cache daftar setelah berhasil.
- Pertahankan Request ID/Title kendaraan sebagai nilai yang tidak dapat diedit.

## Batasan
- Tidak mengubah halaman requester, alur Power Automate, ikon view, atau perilaku hapus yang sudah ada selain penambahan tooltip konsisten.
- Perubahan choice `Cancelled` harus tersedia pada kolom CurrentStatus di SharePoint agar penyimpanan dari aplikasi berhasil.

## Verifikasi
- Uji edit seluruh kolom yang diizinkan dan pastikan nomor request tidak berubah.
- Uji penyimpanan setiap pilihan status kendaraan termasuk `Cancelled`.
- Uji warning cancel pada Admin Kendaraan dan Admin Extra Meal, termasuk batal konfirmasi dan konfirmasi pembatalan.
- Uji tooltip, urutan ikon, penghentian propagasi klik baris, status disabled, notifikasi, filter, dashboard, detail, dan ekspor.
- Jalankan validasi proyek dan pemeriksaan TypeScript tanpa error.
