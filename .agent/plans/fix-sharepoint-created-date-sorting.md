# Perbaikan sortir berdasarkan kolom tanggal SharePoint

## Tujuan
- Pastikan Dashboard Saya, Admin Kendaraan, dan Admin Extra Meal selalu menampilkan request terbaru berdasarkan kolom sumber SharePoint yang benar.

## Temuan
- Kendaraan sudah memetakan `RequestKendaraanApps.CreatedDate` ke data aplikasi, tetapi pengambilan data belum meminta urutan `CreatedDate` dari SharePoint dan nilai tanggal kosong/tidak valid menjadi sama saat dibandingkan.
- Extra Meal sudah memetakan `ExtraMealReq.RequestCreatedAt`, tetapi urutan perlu dinormalisasi kembali setelah data diterima dan setelah record digabungkan menjadi satu grup Request ID.
- Tanggal jemput, tanggal layanan, dan periode acara masih diperlukan untuk tampilan serta urutan detail harian, tetapi tidak boleh menentukan urutan grup/request utama.

## Perubahan
- Data Kendaraan: minta SharePoint mengurutkan `CreatedDate` menurun dan normalisasi nilai `CreatedDate` saat dipetakan agar perbandingan tanggal konsisten.
- Data Extra Meal: tetap minta SharePoint mengurutkan `RequestCreatedAt` menurun, lalu terapkan urutan menurun yang konsisten pada hasil aplikasi berdasarkan nilai tersebut.
- Dashboard Saya: urutkan gabungan request Kendaraan dan grup Extra Meal memakai timestamp dari `CreatedDate` dan `RequestCreatedAt`; gunakan SharePoint ID/Request ID sebagai urutan cadangan yang stabil jika tanggal sama atau kosong.
- Admin Kendaraan: gunakan `CreatedDate` terbaru sebagai urutan bawaan tabel dan pertahankan sortir manual Request ID/Requester.
- Admin Extra Meal: tentukan tanggal grup dari `RequestCreatedAt` milik record dalam grup, lalu tampilkan grup terbaru lebih dahulu; record harian di dalam grup tetap kronologis berdasarkan `ServiceDate`.
- Perlakukan nilai tanggal kosong atau tidak valid secara eksplisit agar ditempatkan setelah record yang memiliki tanggal valid, bukan mencampur urutan utama.

## Yang tetap sama
- Filter periode/status, pencarian, pagination, ekspor CSV, status approval, koreksi, pembatalan, penghapusan, serta pengelompokan Extra Meal tidak berubah.
- Kolom Jadwal/Periode tetap menampilkan tanggal jemput atau tanggal acara sebagai informasi.
- Skema dan isi SharePoint tidak diubah.

## Verifikasi
- Bandingkan beberapa item langsung dengan `CreatedDate` di `RequestKendaraanApps`; nilai paling baru harus berada di baris teratas Dashboard Saya dan Admin Kendaraan.
- Bandingkan beberapa grup langsung dengan `RequestCreatedAt` di `ExtraMealReq`; grup paling baru harus berada di baris teratas Dashboard Saya dan Admin Extra Meal.
- Pastikan tanggal jemput atau layanan yang lebih jauh tidak mengalahkan request yang dibuat lebih baru.
- Pastikan record dengan tanggal kosong/tidak valid berada setelah record bertanggal valid dan urutannya tetap stabil.
- Pastikan sortir manual, filter, pencarian, pagination, ekspor, dan detail grup tetap bekerja.
- Jalankan validasi proyek sampai lulus tanpa error.
