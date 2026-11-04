# IAI Request Center

## Overview
IAI Request Center adalah pusat semua pengajuan di IAI berbasis SharePoint, dengan dashboard requester, reminder approval, dan kontrol admin. Aplikasi saat ini menyatukan request kendaraan untuk business trip dan request extra meal, sekaligus menjadi fondasi untuk layanan pengajuan berikutnya.

## Roles
- **Regular user** memilih jenis request, mengisi formulir, memantau status kendaraan dan extra meal, serta membuka panduan interaktif.
- Request kendaraan operasional tersimpan dan dibaca langsung dari SharePoint List `RequestKendaraanApps` melalui koneksi `shared_sharepointonline`; form request, Dashboard Saya, dan View Admin Kendaraan memakai sumber yang sama.
- **Admin owner meal** mengelola record harian Extra Meal dari SharePoint List `ExtraMealReq` dan memahami arsitektur workflow Power Automate terkait.
- **Super admin Riyan Sugara** menetapkan akses admin kendaraan dan extra meal per pengguna melalui data `AdminAcess`, dengan email pengguna disimpan pada kolom Title.
- **Approver** memproses approval melalui Power Automate dan hasilnya ditulis kembali ke SharePoint.

## Key scenarios
- Membuat request kendaraan sesuai skema terbaru: tanggal, jam, titik jemput, pilihan tujuan, detail tujuan lainnya, departemen, jumlah penumpang, keperluan, dan catatan.
- Membuat request extra meal berdasarkan periode kegiatan; setiap tanggal menjadi record audit dengan Request ID yang sama, sedangkan satu approval dan aksi admin berlaku ke seluruh grup Request ID.
- Menampilkan kedua jenis request dalam Dashboard Saya berdasarkan identitas pengguna.
- Menampilkan notifikasi hasil final Approved atau Rejected untuk request Kendaraan dan Extra Meal milik pengguna pada ikon bel; klik notifikasi membuka detail request terkait di Dashboard Saya.
- Mengatur visibilitas dan proteksi route administrasi berdasarkan role yang tersimpan terpusat.
- Memberikan Riyan menu khusus untuk assign Admin Kendaraan dan Admin Extra Meal.
- Menyediakan Workflow Request bilingual yang mencerminkan alur aktual Kendaraan dan Extra Meal, termasuk approval kendaraan dua tahap yang terkunci berurutan: Admin Kendaraan memutuskan ketersediaan lebih dulu, Available membuka tahap Plant Director untuk seluruh Admin Kendaraan, dan Not Available langsung final Rejected.
- Mengelompokkan record Extra Meal di menu admin menjadi satu ringkasan Request ID yang dapat dibuka; approve, reject, koreksi quantity/status, dan cancel diterapkan ke seluruh tanggal dalam grup, sementara penghapusan permanen tetap per record.
- Menyediakan dashboard operasional pada Admin Kendaraan dan Admin Extra Meal dengan filter periode, kartu status, distribusi status, indikator beban kerja, serta antrean request yang perlu perhatian.
- Menyediakan aksi konsisten berupa lihat, koreksi, batalkan, dan hapus pada kedua view admin; Cancel hanya tersedia saat request masih Submitted dan dinonaktifkan setelah Approved, Rejected, atau Cancelled.
- Memuat seluruh halaman data SharePoint pada Admin Kendaraan, dengan status kegagalan koneksi yang ditampilkan secara terpisah.

## Design direction
Antarmuka industrial-utilitarian dengan sidebar biru gelap, aksen amber, ikon request yang netral, tipografi sistem yang ringkas, dan tabel operasional. Bahasa utama adalah Bahasa Indonesia.

## Data sources
- **Akses admin:** `AdminAcess` dengan kolom `Title` sebagai email pengguna serta flag `VehicleAdmin` dan `MealAdmin`.
- **Kendaraan:** model SharePoint `RequestKendaraan`; kolom teks `CurrentStatus` mendukung Submitted, Approved, Rejected - Vehicle not available, Rejected - Plant Director, Pending Plant Director Approval, dan Cancelled.
- **Extra meal:** SharePoint List `ExtraMealReq`; satu item mewakili satu tanggal layanan, dengan `RequestID` bersama dan `RecordID` unik per tanggal. Kolom `ServiceDate`, `StartDate`, dan `EndDate` ditulis melalui SDK SharePoint native menggunakan nilai UTC tengah hari dan dinormalisasi kembali sebagai tanggal kalender agar tidak bergeser akibat konversi zona waktu.

## Workflow boundary
Aplikasi membuat request, menampilkan progres, menjalankan review dan koreksi berbasis peran, memperbarui status request atau grup, menerapkan aturan Cancel, dan menampilkan catatan approval. Untuk Extra Meal, satu ApprovalTrigger mewakili seluruh record dengan Request ID yang sama dan approve, reject, koreksi, serta cancel berlaku ke seluruh grup. Power Automate mengisi kolom `RequesterManager` di SharePoint, menjalankan integrasi approval bila diperlukan, menulis outcome approval, dan mengirim email kepada requester hanya saat hasil final **Approved** atau **Rejected**. Status antara, koreksi, dan Cancelled tetap terlihat di aplikasi tanpa email. SharePoint tetap menjadi sumber kebenaran untuk data, status, catatan, manager, dan audit.
