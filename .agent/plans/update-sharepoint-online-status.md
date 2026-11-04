# Update SharePoint online status

## Tujuan
- Menyederhanakan informasi data source di sidebar menjadi satu status SharePoint List Db yang mudah dipahami.
- Menambahkan kredit pengembang berukuran kecil tanpa mengubah fungsi halaman request Extra Meal.

## Perubahan
- Ganti tiga baris status Kendaraan, Akses Admin, dan Extra Meal pada panel sidebar dengan judul `Data sources:` dan satu baris `SharePoint List Db: Online`.
- Tambahkan ikon indikator bulat hijau di samping status Online dengan label aksesibilitas yang jelas.
- Tambahkan teks kecil `Dev by: Riyan Sugara` di bawah informasi status.
- Terapkan perubahan pada layout sidebar bersama sehingga tampil konsisten di `/request-extra-meal` dan halaman lain yang menggunakan layout yang sama.
- Pertahankan form Extra Meal, navigasi, pilihan bahasa, koneksi SharePoint, dan seluruh fungsi aplikasi tanpa perubahan.

## Verifikasi
- Pastikan panel sidebar hanya menampilkan status SharePoint List Db yang baru dan tidak lagi menampilkan tiga status lama.
- Pastikan indikator online dan kredit pengembang terbaca dengan baik pada tampilan sidebar.
- Pastikan `/request-extra-meal` dan halaman lain tetap dapat digunakan tanpa perubahan perilaku.
- Jalankan validasi proyek hingga lulus tanpa error.
