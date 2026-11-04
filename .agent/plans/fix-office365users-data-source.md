# Fix data source Office 365 Users

## Tujuan
- Memulihkan pencarian pengguna Entra ID pada halaman **Kelola Admin** dengan memastikan konektor Office 365 Users terdaftar dan tersedia saat runtime.

## Perubahan
- Daftarkan salah satu koneksi **Office 365 Users** yang sudah tersedia ke aplikasi untuk data source `office365users`.
- Regenerasi data layer connector agar konfigurasi runtime, skema, dan service pencarian konsisten dengan connection reference aktif.
- Pertahankan autocomplete nama/email, pemilihan user valid, loading state, tombol coba lagi, dan penyimpanan role admin ke SharePoint.
- Ubah pesan error agar kegagalan koneksi/data source dapat dibedakan dari hasil pencarian kosong.

## Yang tetap sama
- Halaman **Kelola Admin** tetap khusus Riyan Sugara.
- Assignment tetap disimpan ke list SharePoint **AdminAcess**.
- Role **Admin Kendaraan** dan **Admin Extra Meal** serta daftar admin tidak berubah.

## Verifikasi
- Pastikan `office365users` memiliki connection reference aktif pada konfigurasi aplikasi.
- Uji pencarian sebagian nama dan email pada `/kelola-admin`, lalu pilih hasil Entra ID.
- Uji penyimpanan assignment admin ke SharePoint.
- Validasi build aplikasi dan penggunaan SDK connector tanpa error.
