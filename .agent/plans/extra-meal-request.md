# Rencana Aplikasi Extra Meal Request

## Tujuan
- Membangun satu aplikasi terpadu untuk requester dan admin guna mengajukan, memantau, menyetujui secara eksternal, serta mengelola request extra meal berbasis SharePoint List existing.
- Menggunakan antarmuka berbahasa Indonesia dengan gaya utilitarian yang rapi, padat, mudah dipindai, dan responsif.

## Peran
- Requester: membuat request, melihat status request miliknya, dan mengirim reminder approval.
- Admin: mengelola konfigurasi, seluruh request, koreksi, pembatalan, dan ekspor laporan.
- Plant Manager: menerima satu approval Power Automate per Request ID di luar aplikasi.

## Navigasi dan halaman
- Navigasi utama: sidebar persisten karena aplikasi memiliki lima area utama, dengan menu admin hanya terlihat bagi admin.
- Dashboard Saya: ringkasan dan daftar request milik requester dengan status Submitted, Approved, Rejected, dan Cancelled.
- Request Baru: form lengkap, validasi, perhitungan durasi, preview baris harian, serta dialog konfirmasi sebelum submit.
- Detail Request: informasi grup request, rincian per tanggal, status approval, riwayat reminder, dan aksi reminder saat masih Submitted.
- Monitoring Admin: seluruh request dengan pencarian, filter, detail, koreksi, pembatalan, dan ekspor laporan.
- Pengaturan Admin: pengelolaan Plant Manager/approver, admin user, departemen, kategori meal, dan parameter reminder.

## Form request
- Tanggal Mulai Acara dan Tanggal Selesai memakai date picker; tanggal selesai tidak boleh sebelum tanggal mulai.
- Durasi dihitung otomatis dari rentang tanggal secara inklusif.
- Jika tanggal mulai dan selesai sama, tampilkan input tambahan durasi jam manual.
- Tujuan Acara berupa input teks.
- Nama Requester diambil dari konteks pengguna Microsoft Entra ID dan tidak diedit manual.
- Departemen berupa combobox: Commercial, Finance & Accounting, HR, IT&S, Lab, Maintenance, Operation, PD (Logistic), Procurement, dan SHE.
- Kategori Meal berupa combobox Lunch, Dinner, atau Other; pilihan Other menampilkan input kategori tambahan.
- Qty Meal berupa angka positif.
- Tambahan Meal/Minuman bersifat opsional.
- Sebelum submit, tampilkan ringkasan dan konfirmasi bahwa data sudah benar karena request akan masuk ke proses approval.

## Aturan pembuatan data
- Setiap submit menghasilkan satu Request ID unik yang sama untuk seluruh baris dalam satu request.
- Rentang tanggal dipecah menjadi satu baris SharePoint per tanggal secara inklusif; contoh 1–5 Januari menghasilkan lima baris dengan informasi request yang sama.
- Hanya baris utama grup yang menandai pemicu approval agar Power Automate mengirim satu approval per Request ID.
- Perubahan hasil approval memperbarui status seluruh baris dengan Request ID yang sama.
- Koreksi admin menjaga keterkaitan grup dan audit perubahan.
- Pembatalan menggunakan status Cancelled agar histori tetap tersedia.

## Approval dan reminder
- Power Automate memulai satu approval ke Plant Manager untuk setiap Request ID baru.
- Requester hanya dapat mengirim reminder untuk request berstatus Submitted.
- Aksi reminder menandai permintaan trigger flow, menyimpan waktu reminder terakhir, dan mencegah pengiriman berulang sesuai parameter jeda admin.
- Dashboard memperlihatkan status grup request, bukan menduplikasi setiap baris tanggal sebagai request terpisah.

## Data dan integrasi
- Sumber utama: SharePoint List existing yang detailnya akan dibagikan kemudian.
- Pemetaan awal memakai placeholder untuk site URL, nama list, nama internal kolom, dan tipe kolom hingga sumber dibagikan.
- Koneksi SharePoint standar bersifat tabular dan nantinya memerlukan site URL sebagai dataset serta nama list sebagai table name.
- Identitas requester memakai konteks pengguna aplikasi Microsoft Entra ID; konektor Office 365 Users hanya ditambahkan bila atribut organisasi tambahan diperlukan.
- Power Automate menangani approval dan reminder berdasarkan flag/status pada SharePoint, tanpa konektor Power Automate Management di aplikasi.
- Tidak membuat data model lokal baru karena SharePoint List existing menjadi sumber kebenaran.

## Entitas data
- Extra Meal Requests
- Departments
- Meal Categories
- Approver Settings
- Admin Users
- Reminder Settings
- Request Audit Log

## Rekomendasi struktur SharePoint
- Versi awal dapat memakai satu list request dengan satu baris per tanggal dan Request ID sebagai kunci grup.
- Konfigurasi admin sebaiknya disimpan dalam list master terpisah agar approver, hak admin, pilihan departemen/kategori, dan parameter reminder dapat diubah tanpa deploy ulang.
- Detail final daftar list dan pemetaan kolom ditetapkan setelah site URL, nama list, serta skema existing dibagikan.

## Keamanan dan akses
- Requester hanya melihat request yang terkait dengan identitasnya.
- Menu dan aksi admin ditentukan dari daftar Admin Users, bukan sekadar disembunyikan di UI.
- Koreksi, pembatalan, reminder, dan perubahan konfigurasi dicatat untuk audit.

## Ekspor dan pelaporan
- Admin dapat memfilter berdasarkan periode, requester, departemen, kategori, dan status sebelum ekspor.
- Ekspor menghasilkan laporan yang mempertahankan Request ID dan rincian per tanggal untuk kebutuhan operasional.

## Batasan versi awal
- Pembuatan flow Power Automate dilakukan sebagai pekerjaan konfigurasi terpisah; aplikasi menyiapkan field pemicu dan status yang dibutuhkan.
- Integrasi SharePoint final menunggu detail sumber yang akan dibagikan.
- Plant Manager tidak memerlukan halaman approval di dalam aplikasi karena approval dilakukan melalui Power Automate.

## Kriteria penerimaan
- Form menampilkan field kondisional durasi jam dan kategori Other secara tepat.
- Preview dan submit menghasilkan jumlah baris sesuai rentang tanggal inklusif.
- Seluruh baris satu pengajuan memiliki Request ID yang sama dan hanya memicu satu approval.
- Dashboard requester menampilkan request terkelompok beserta status dan aksi reminder yang valid.
- Admin dapat melakukan konfigurasi, monitoring, koreksi, pembatalan, dan ekspor.
- UI menyediakan loading, empty, success, dan error state yang jelas serta dapat digunakan di desktop dan mobile.
