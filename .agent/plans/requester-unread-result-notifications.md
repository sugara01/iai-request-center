# Notifikasi hasil request yang belum dibaca

## Tujuan
- Tampilkan alert requester hanya setelah ada keputusan baru Approved atau Rejected dari Admin atau Plant Director.
- Hilangkan badge dan item notifikasi setelah dibuka, konsisten di semua perangkat.
- Jangan menampilkan hasil request lama sebelum fitur ini diaktifkan.
- Jika pengguna memiliki akses apa pun di `AdminAcess`, tampilkan hanya antrean approval admin dan sembunyikan seluruh notifikasi request pribadinya.

## Pengalaman pengguna
- Pengguna non-admin melihat satu notifikasi per Request ID untuk Kendaraan atau Extra Meal yang baru mencapai hasil final Approved atau Rejected.
- Badge bel menghitung hanya notifikasi pengguna yang belum dibaca.
- Klik item menandainya sudah dibaca lalu membuka Dashboard Saya dan detail Request ID terkait.
- Setelah berhasil ditandai dibaca, item dan angka badge hilang; statusnya tetap tersimpan lintas sesi dan perangkat.
- Pengguna admin tetap melihat badge menu dan antrean bel `Perlu diproses` seperti sekarang, tanpa bagian `Hasil request saya` meskipun ia juga requester.
- Loading, gagal menyimpan status baca, dan kondisi kosong ditampilkan dengan jelas; kegagalan menyimpan tidak boleh menghilangkan notifikasi secara semu.

## Data
- RequestKendaraanApps
- ExtraMealReq
- AdminAcess
- UserNotificationReadState

## Aturan notifikasi
- Requester ditentukan dari email request yang sama dengan email pengguna aktif.
- Kendaraan hanya menghasilkan notifikasi untuk hasil final Approved atau variasi Rejected.
- Extra Meal hanya menghasilkan satu notifikasi per Request ID ketika seluruh record grup sudah memiliki hasil final yang sama, Approved atau Rejected.
- Request Submitted, Pending Plant Director Approval, Cancelled, status campuran, dan koreksi tanpa keputusan final tidak menghasilkan notifikasi requester.
- Record baru di `UserNotificationReadState` dibuat saat keputusan final baru disimpan, sehingga status lama yang sudah ada sebelum aktivasi fitur tidak ikut menjadi alert.
- Identitas event menggabungkan pengguna, jenis request, Request ID, hasil final, dan waktu keputusan agar tidak terjadi duplikasi.
- Sumber request SharePoint tetap menjadi sumber kebenaran untuk detail dan kepemilikan; list baru hanya menyimpan event dan status sudah dibaca.

## Perubahan area aplikasi
- Header/notifikasi: pisahkan mode admin dan requester secara tegas berdasarkan `AdminAcess`.
- Admin Kendaraan: saat keputusan final berhasil disimpan, catat event notifikasi requester baru.
- Admin Extra Meal: saat keputusan final grup berhasil disimpan, catat satu event notifikasi requester untuk Request ID tersebut.
- Notifikasi requester: baca hanya event milik pengguna yang belum dibaca, terbaru lebih dulu.
- Dashboard Saya: pertahankan pembukaan detail dari Request ID dan validasi bahwa request memang milik pengguna aktif.
- Antrean admin: pertahankan badge menu, daftar request yang perlu diproses, dan deep link Koreksi & Approval yang sudah ada.

## SharePoint
- Gunakan koneksi SharePoint Online yang sudah aktif; tidak memerlukan konektor baru.
- Siapkan dan registrasikan list terpisah `UserNotificationReadState` pada site INEOS Aromatics.
- Terapkan akses list agar pengguna hanya dapat membaca dan memperbarui notifikasi miliknya, sementara proses admin dapat membuat event hasil keputusan.
- Jangan mengubah atau memakai kolom `requestermanager`.

## Batas aktivasi
- Aktivasi dimulai saat pencatatan event baru diterapkan; tidak dilakukan backfill dari request Approved/Rejected yang sudah ada.
- Jika keputusan final disimpan ulang tanpa perubahan hasil, jangan membuat event baru.

## Verifikasi
- Uji Approved dan Rejected baru untuk Kendaraan dan Extra Meal pada requester non-admin.
- Uji bahwa request final lama tidak muncul dan satu grup Extra Meal hanya menghasilkan satu item.
- Uji klik notifikasi menandai dibaca sebelum membuka detail dan badge tetap hilang setelah refresh, login ulang, serta perangkat lain.
- Uji pengguna di `AdminAcess` hanya melihat antrean approval admin dan tidak melihat hasil request pribadi.
- Uji kegagalan SharePoint saat menandai dibaca, duplikasi penyimpanan keputusan, keamanan Request ID, serta perilaku deep link tanpa loop render.
- Jalankan validasi proyek dan pemeriksaan SDK setelah implementasi.