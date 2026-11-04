# Ubah simpan grup Extra Meal menjadi status-only

## Tujuan
- Memastikan tombol **Simpan untuk seluruh grup** hanya memperbarui status semua record dalam Request ID yang sama.
- Mempertahankan koreksi Qty sebagai tindakan terpisah yang hanya berlaku pada record harian terpilih.

## Perubahan
- Ubah proses pembaruan grup agar hanya mengirim `CurrentStatus` untuk setiap record grup dan tidak pernah mengirim atau menimpa `Quantity`.
- Ubah pemanggilan aksi grup di `/admin-meal` agar hanya membawa daftar record dan status pilihan.
- Pertahankan tombol **Simpan Qty record ini** untuk memperbarui Qty satu record tanpa mengubah status.
- Hapus ketergantungan validasi Qty dari tombol simpan grup agar perubahan status tetap dapat dilakukan terlepas dari nilai Qty yang sedang tertulis pada form.
- Perjelas teks bantuan bahwa Qty disimpan per-record, sedangkan status diterapkan ke seluruh grup.
- Perjelas label tombol grup menjadi **Simpan status seluruh grup** agar cakupannya tidak ambigu.
- Tampilkan notifikasi sukses yang menyatakan hanya status grup yang diperbarui.

## Yang tetap sama
- Pilihan status tetap: Submitted, Approved, Rejected, dan Cancelled.
- Semua record dengan Request ID yang sama tetap menerima status pilihan.
- Identitas record, input Qty, tombol simpan Qty per-record, dialog koreksi, tabel, filter, dan alur pembatalan tetap dipertahankan.
- SharePoint tetap menjadi sumber data dan data akan dimuat ulang setelah pembaruan.

## Verifikasi
- Simpan Qty satu record dan pastikan Qty record lain dalam grup tidak berubah.
- Ubah Qty pada form tanpa menyimpannya, lalu simpan status grup dan pastikan seluruh Qty tetap seperti sebelumnya.
- Simpan masing-masing status yang tersedia dan pastikan hanya `CurrentStatus` seluruh record grup yang berubah.
- Pastikan tombol status grup tidak bergantung pada validitas Qty.
- Jalankan validasi proyek dan pemeriksaan SDK hingga lulus tanpa error.
