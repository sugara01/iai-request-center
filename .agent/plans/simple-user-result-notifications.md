# Notifikasi hasil request pengguna

## Tujuan
- Menambahkan notifikasi sederhana untuk pengguna biasa ketika request miliknya berstatus Approved atau Rejected.
- Mengabaikan `requestermanager` sepenuhnya dan tidak mengubah schema SharePoint.

## Perubahan
- Gunakan email pengguna yang sedang login untuk mencocokkan request Kendaraan dan Extra Meal miliknya.
- Bentuk notifikasi langsung dari status akhir pada list SharePoint yang sudah ada, tanpa tabel atau list status baca baru.
- Tampilkan notifikasi hanya untuk status Approved dan Rejected, dengan Request ID, jenis request, status, dan waktu pembaruan.
- Gabungkan notifikasi Kendaraan dan Extra Meal di ikon bel yang sama dan urutkan berdasarkan waktu pembaruan terbaru.
- Klik notifikasi membuka Dashboard pengguna dan menampilkan detail request terkait.
- Pertahankan antrean approval pada ikon bel untuk admin; pengguna yang juga admin dapat melihat notifikasi hasil request pribadinya dan antrean admin secara jelas terpisah.
- Karena tidak ada penyimpanan status baca, badge menunjukkan jumlah hasil Approved/Rejected yang tersedia saat ini dan akan tetap muncul selama data tersebut masih termasuk dalam cakupan notifikasi.

## Data
- RequestKendaraanApps
- ExtraMealReq

## Halaman terdampak
- Layout/header: ikon bel, badge, dan daftar notifikasi pengguna.
- Dashboard: membuka atau menyorot detail Request ID dari notifikasi.
- Admin Kendaraan: perilaku antrean approval yang sudah ada tetap dipertahankan.
- Admin Extra Meal: perilaku antrean approval yang sudah ada tetap dipertahankan.

## Batasan
- Tidak memakai `requestermanager`.
- Tidak menambah atau mengubah entitas data.
- Tidak menyediakan status sudah dibaca lintas perangkat pada tahap ini.
