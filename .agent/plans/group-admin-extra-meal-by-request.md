# Group Admin Extra Meal by Request

## Perubahan utama
- Ubah data Extra Meal multi-hari menjadi record harian terpisah yang memakai Request ID yang sama dan memiliki identitas record unik.
- Pertahankan satu proses approval untuk satu Request ID; hanya record hari pertama menjadi pemicu approval.
- Tampilkan satu baris ringkasan per Request ID pada tabel Admin Extra Meal.
- Tambahkan kontrol buka/tutup pada baris ringkasan untuk menampilkan seluruh record harian di bawahnya.
- Tampilkan tanggal layanan, kuantitas, status, dan aksi pada setiap record harian.
- Terapkan koreksi status, pembatalan, dan penghapusan secara independen per record harian.
- Pertahankan detail umum requester, departemen, tujuan acara, kategori meal, pencarian, filter status, pagination, dan ekspor CSV yang sudah ada.
- Sesuaikan ekspor CSV lokal agar setiap record harian diekspor sebagai satu baris dengan Request ID bersama dan tanggal layanan masing-masing.

## Tampilan Admin Extra Meal
- Baris ringkasan: Request ID, requester, acara, rentang dan jumlah hari, total kebutuhan, ringkasan status, serta tombol buka/tutup.
- Baris detail harian: tanggal layanan, qty hari tersebut, status hari tersebut, penanda pemicu approval, dan aksi lihat/edit/batalkan/hapus.
- Panel detail: informasi umum request serta daftar record harian dan status masing-masing.
- Konfirmasi hapus: menegaskan bahwa hanya record pada tanggal terpilih yang dihapus, bukan seluruh Request ID.

## Perilaku data
- Request satu hari menghasilkan satu record harian.
- Request beberapa hari menghasilkan satu record untuk setiap tanggal kalender dalam rentang inklusif.
- Semua record harian berbagi Request ID tetapi memiliki ID record internal yang berbeda.
- Perubahan atau penghapusan record dilakukan berdasarkan ID record internal agar record lain dengan Request ID sama tidak ikut berubah.
- Status ringkasan menunjukkan status campuran apabila status antarhari berbeda.

## Validasi
- Verifikasi request tiga hari muncul sebagai satu grup dengan tiga record harian setelah dibuka.
- Verifikasi edit, pembatalan, dan penghapusan hanya memengaruhi tanggal yang dipilih.
- Verifikasi pencarian, filter, pagination, panel detail, dan ekspor tetap bekerja pada struktur data baru.
- Jalankan validasi proyek penuh setelah implementasi.