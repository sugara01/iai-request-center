# Perbaikan penyimpanan Choice Request Kendaraan

## Tujuan
- Memastikan form `/request-kendaraan` menyimpan `Departemen`, `Tujuan`, dan `CurrentStatus` ke kolom Choice SharePoint `RequestKendaraan`.
- Menetapkan status awal setiap request baru sebagai `Submitted`.

## Perubahan
- Selaraskan kembali kontrak tulis `RequestKendaraan` dengan metadata Choice SharePoint yang menyediakan field ID untuk `Departemen`, `Tujuan`, dan `CurrentStatus`.
- Petakan setiap pilihan Departemen dan Tujuan pada form ke ID Choice SharePoint yang sesuai sebelum item dibuat.
- Petakan status awal `Submitted` ke ID Choice yang benar; pertahankan tiga status lanjutan untuk pembacaan dan pembaruan oleh workflow: `Approved`, `Rejected - Vehicle Not Available`, dan `Pending Plant Director Approval`.
- Hentikan submit dengan pesan yang jelas jika pilihan form belum memiliki mapping ID valid, agar tidak ada lagi item yang berhasil dibuat dengan kolom Choice kosong.
- Pertahankan normalisasi nilai Choice saat membaca record agar dashboard requester dan Admin Kendaraan tetap menampilkan label yang benar.
- Pertahankan tampilan form, field lain, nomor request, navigasi, serta tanggung jawab Power Automate tanpa perubahan.

## Data
- RequestKendaraan

## Verifikasi
- Submit request dari `/request-kendaraan` untuk setiap pilihan Tujuan dan beberapa Departemen, lalu pastikan nilai SharePoint tidak kosong.
- Pastikan item baru selalu memiliki `CurrentStatus = Submitted`.
- Pastikan keempat nilai CurrentStatus dikenali secara tepat saat record dibaca kembali.
- Pastikan request baru tampil konsisten pada dashboard requester dan `/admin-kendaraan`.
- Jalankan validasi proyek dan pemeriksaan SDK hingga lulus tanpa error.
