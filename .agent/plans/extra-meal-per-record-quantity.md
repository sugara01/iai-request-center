# Koreksi Qty Extra Meal per record

## Tujuan
- Memberi admin opsi untuk mengoreksi **Qty meal** hanya pada satu record/tanggal tanpa mengubah record lain dalam Request ID yang sama.
- Mempertahankan tindakan **Simpan untuk seluruh grup** yang mengubah Qty dan status approval seluruh grup seperti saat ini.

## Perubahan
- Pada dialog **Koreksi & Approval Request** di `/admin-meal`, tampilkan identitas record yang dipilih: Request ID, Record ID, dan tanggal layanan.
- Pertahankan input **Qty meal** dan **Status** untuk tindakan grup.
- Tambahkan tindakan **Simpan Qty record ini** untuk memperbarui Qty hanya pada record/tanggal yang dipilih.
- Tindakan per-record tidak mengubah status approval dan tidak mengubah Qty record lain dalam grup.
- Pertahankan tombol **Simpan untuk seluruh grup** dengan perilaku saat ini: menerapkan Qty dan status yang dipilih ke seluruh record dengan Request ID yang sama.
- Bedakan secara jelas cakupan kedua tindakan melalui keterangan di dialog dan label tombol.
- Validasi Qty minimal 1 untuk kedua tindakan dan nonaktifkan tombol selama proses penyimpanan.
- Setelah berhasil, tutup dialog, muat ulang data Extra Meal, dan tampilkan notifikasi yang menyebut tanggal record atau jumlah tanggal grup yang diperbarui.
- Jika record tidak memiliki SharePoint ID, cegah pembaruan per-record dan tampilkan pesan kesalahan yang jelas.
- Tambahkan teks Bahasa Indonesia dan Inggris untuk label, keterangan cakupan, tombol, serta notifikasi baru.

## Data dan integrasi
- Gunakan koneksi dan tabel SharePoint **ExtraMealReq** yang sudah aktif.
- Tambahkan operasi update per-record pada hook Extra Meal dengan hanya mengirim perubahan field `Quantity`.
- Tidak ada perubahan struktur data, kolom SharePoint, status approval, atau alur Power Automate.

## Yang tetap sama
- Navigasi, tabel monitoring, ekspansi grup, detail record, filter, dan dashboard analitik.
- Tindakan cancel, delete, serta koreksi dan approval seluruh grup.
- Status approval hanya berubah melalui tindakan grup.

## Verifikasi
- **Simpan Qty record ini** hanya mengubah Qty record/tanggal yang dipilih.
- Qty dan status record lain dalam Request ID yang sama tidak berubah.
- **Simpan untuk seluruh grup** tetap mengubah Qty dan status semua record dalam grup.
- Qty kurang dari 1 tidak dapat disimpan.
- Loading, notifikasi berhasil/gagal, refresh data, dan terjemahan Indonesia–Inggris bekerja konsisten.
- Validasi proyek dan SDK lulus tanpa error.
