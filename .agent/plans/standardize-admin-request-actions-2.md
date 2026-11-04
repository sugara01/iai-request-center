# Standardisasi aksi Admin Kendaraan dan Extra Meal

## Koreksi analisis
- `RequestKendaraanApps.CurrentStatus` adalah kolom teks (`string`), bukan SharePoint Choice.
- Status `Cancelled` dapat ditulis langsung seperti pada `ExtraMealReq.CurrentStatus`; tidak diperlukan perubahan skema SharePoint atau data model.
- Pembatasan status kendaraan saat ini hanya berasal dari tipe dan pemetaan status di kode aplikasi.

## Tujuan
Menyamakan pola aksi Admin Kendaraan dan Admin Extra Meal serta menambahkan koreksi lengkap dan pembatalan aman untuk request kendaraan.

## Admin Kendaraan
- Pertahankan aksi lihat dengan ikon Eye dan hapus dengan ikon Trash2.
- Tambahkan aksi koreksi Pencil dan cancel XCircle dengan urutan Eye, Pencil, XCircle, Trash2.
- Sediakan dialog koreksi untuk nama dan email pemohon, departemen, tanggal, jam, tujuan, detail tujuan lainnya, keperluan, jumlah penumpang, titik jemput, catatan requester, catatan admin, keputusan admin, keputusan Plant Director, catatan Plant Director, dan CurrentStatus.
- Tampilkan nomor request sebagai read-only dan jangan sertakan Title/nomor request dalam payload update.
- Sediakan status Submitted, Pending Plant Director Approval, Approved, Rejected - Vehicle Not Available, dan Cancelled.
- Simpan status `Cancelled` langsung sebagai teks ke kolom `CurrentStatus` melalui mutation update kendaraan yang sudah tersedia.
- Tampilkan warning konfirmasi sebelum pembatalan dan nonaktifkan cancel untuk record yang sudah Cancelled.
- Perlakukan Cancelled sebagai status terminal/rejected pada filter dan ringkasan dashboard.
- Tampilkan Cancelled secara konsisten pada badge, detail, pencarian/filter, distribusi status, antrean perhatian, dan ekspor CSV.

## Admin Extra Meal
- Pertahankan detail, koreksi, hapus, dan pembaruan status yang sudah berfungsi.
- Ubah aksi cancel agar memilih record terlebih dahulu lalu menampilkan warning konfirmasi sebelum menulis `Cancelled`.
- Pertahankan pembatalan pada record harian yang dipilih saja.
- Nonaktifkan cancel ketika record sudah Cancelled.

## Konsistensi aksi
- Gunakan ikon dan urutan yang sama pada kedua halaman: Eye, Pencil, XCircle, Trash2.
- Tambahkan tooltip berlabel pada setiap ikon aksi, tanpa mengganti `aria-label` yang mendukung aksesibilitas.
- Pastikan klik setiap ikon menghentikan propagasi agar tidak membuka detail baris secara tidak sengaja.
- Gunakan notifikasi sukses/gagal dan status pending yang konsisten untuk update, cancel, dan delete.

## Data dan integrasi
- Perluas tipe/pemetaan status kendaraan di kode aplikasi agar mengenali `Cancelled` dari kolom teks.
- Gunakan `useUpdateVehicleRequest` untuk koreksi dan pembatalan, lalu invalidasi cache daftar kendaraan.
- Tidak mengubah skema SharePoint, data model, koneksi, atau generated connector model karena `CurrentStatus` sudah bertipe string.

## Batasan
- Tidak mengubah halaman requester, alur Power Automate, struktur SharePoint, atau perilaku hapus permanen.
- Tidak mengizinkan perubahan nomor request.

## Verifikasi
- Uji pemetaan baca/tulis `Cancelled` terhadap `RequestKendaraanApps.CurrentStatus` sebagai teks.
- Uji edit semua kolom yang diizinkan dan pastikan nomor request tidak berubah.
- Uji warning cancel pada kedua halaman, termasuk batal konfirmasi, konfirmasi, status pending, sukses, dan gagal.
- Uji tooltip, urutan ikon, penghentian propagasi, disabled state, filter, dashboard, detail, badge, dan ekspor.
- Jalankan validasi proyek hingga TypeScript, lint, dan pemeriksaan SDK lulus tanpa error.
