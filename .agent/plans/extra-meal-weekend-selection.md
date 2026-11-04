# Pilihan weekend pada request Extra Meal

## Tujuan
- Mencegah pembuatan kebutuhan Extra Meal pada Sabtu–Minggu secara tidak sengaja ketika rentang acara melewati weekend.
- Tetap mendukung kegiatan yang memang membutuhkan meal pada weekend melalui pilihan eksplisit saat submit.

## Perubahan
- Pertahankan pemilihan tanggal mulai dan selesai pada form `/request-extra-meal` seperti saat ini.
- Deteksi apakah rentang tanggal yang dipilih mencakup satu atau lebih hari Sabtu atau Minggu.
- Jika tidak ada weekend, buka dialog tinjauan dan lanjutkan alur submit tanpa kontrol tambahan.
- Jika ada weekend, tampilkan peringatan pada dialog tinjauan beserta jumlah dan daftar tanggal weekend yang ditemukan.
- Berikan dua pilihan: **Keluarkan Sabtu–Minggu** dan **Sertakan Sabtu–Minggu**.
- Tetapkan **Keluarkan Sabtu–Minggu** sebagai pilihan default.
- Perbarui preview jumlah baris pada dialog sesuai pilihan pengguna sebelum request dikirim.
- Saat weekend dikeluarkan, buat record SharePoint hanya untuk Senin–Jumat dalam rentang tersebut.
- Saat weekend disertakan, buat record untuk seluruh tanggal dalam rentang seperti perilaku saat ini.
- Jika pengecualian weekend menyebabkan tidak ada tanggal layanan tersisa, cegah submit dan tampilkan penjelasan yang jelas.
- Pastikan tanggal pertama yang benar-benar disertakan menjadi record pemicu approval.
- Pertahankan Request ID tunggal, data form, penyimpanan ke field yang ada, serta alur Power Automate saat ini.
- Tambahkan teks Bahasa Indonesia dan Inggris untuk peringatan, pilihan weekend, ringkasan tanggal, dan pesan validasi.

## Dampak tampilan
- **Form Extra Meal:** tidak menambah kontrol permanen agar form tetap ringkas.
- **Dialog tinjauan:** menampilkan bagian pilihan weekend hanya ketika rentang mencakup Sabtu atau Minggu.
- **Preview:** jumlah baris dan daftar tanggal mengikuti pilihan weekend aktif.

## Verifikasi
- Rentang hari kerja saja tidak menampilkan pilihan weekend dan tetap menghasilkan seluruh tanggal.
- Rentang yang melewati weekend menampilkan pilihan dengan default mengecualikan weekend.
- Mengubah pilihan ke sertakan weekend langsung memperbarui jumlah dan daftar tanggal di dialog.
- Submit dengan weekend dikecualikan tidak membuat record Sabtu–Minggu.
- Submit dengan weekend disertakan membuat semua record tanggal.
- Rentang yang hanya terdiri dari weekend tidak dapat dikirim ketika opsi pengecualian aktif.
- Record pertama yang disertakan tetap menjadi satu-satunya pemicu approval.
- Tampilan dan pesan bekerja konsisten dalam Bahasa Indonesia dan Inggris.
