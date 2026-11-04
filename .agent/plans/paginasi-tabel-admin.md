# Paginasi tabel admin

## Tujuan
Mengubah tabel Admin Kendaraan dan Admin Extra Meal dari daftar panjang menjadi tabel berpaginasi agar data lebih mudah dipindai tanpa terus menggulir ke bawah.

## Perubahan
- Admin Kendaraan: tampilkan hanya data pada halaman aktif setelah filter status dan pencarian diterapkan.
- Admin Extra Meal: tampilkan hanya data pada halaman aktif setelah filter status dan pencarian diterapkan.
- Tambahkan pilihan jumlah baris per halaman: 10, 50, 100, dan 500 pada kedua tabel.
- Tambahkan informasi rentang data yang sedang ditampilkan, total hasil, nomor halaman, serta kontrol halaman sebelumnya dan berikutnya.
- Reset ke halaman pertama ketika pencarian, filter status, atau jumlah baris per halaman berubah.
- Batasi nomor halaman aktif ketika jumlah hasil berubah, misalnya setelah penghapusan atau pembaruan data.
- Pertahankan fungsi yang sudah ada: pencarian, filter status, detail request, koreksi/pembatalan, penghapusan, refresh, serta ekspor CSV seluruh hasil filter (bukan hanya halaman aktif).
- Pertahankan layout, hak akses admin, sumber data SharePoint, dan workflow Power Automate yang sudah ada.

## Halaman terdampak
- `/admin-kendaraan` — tabel Request Kendaraan dengan paginasi dan pilihan ukuran halaman.
- `/admin-meal` — tabel Extra Meal dengan paginasi dan pilihan ukuran halaman.

## Data
- Tidak ada perubahan entitas atau sumber data.
