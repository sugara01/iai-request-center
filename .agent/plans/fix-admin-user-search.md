# Fix pencarian user admin

## Tujuan
- Memperbaiki pencarian pengguna Entra ID pada halaman **Kelola Admin** agar hasil nama dan email dapat dipilih dengan andal.

## Perubahan
- Ganti operasi Office 365 Users yang deprecated dengan **Search for users (V2)** dan sesuaikan pembacaan struktur responsnya.
- Pertahankan autocomplete pada kolom **Email user**, termasuk pencarian berdasarkan nama, email, dan UPN dengan batas hasil yang ringkas.
- Tampilkan pesan kegagalan yang informatif untuk membedakan koneksi Office 365 belum tersedia, izin ditolak, dan gangguan pencarian sementara.
- Pertahankan tombol **Coba lagi**, debounce pencarian, loading state, dan penyaringan pengguna yang memiliki email/UPN valid.
- Pastikan pengguna harus memilih hasil Entra ID yang valid sebelum assignment admin disimpan.

## Yang tetap sama
- Akses halaman **Kelola Admin** tetap khusus Riyan Sugara.
- Assignment tetap disimpan ke list SharePoint **AdminAcess**.
- Role **Admin Kendaraan** dan **Admin Extra Meal** serta daftar admin yang ada tidak berubah.

## Verifikasi
- Uji pencarian menggunakan sebagian nama dan email pada halaman `/kelola-admin`.
- Uji pemilihan hasil dan penyimpanan assignment ke SharePoint.
- Validasi TypeScript, build aplikasi, dan penggunaan SDK connector tanpa error.
