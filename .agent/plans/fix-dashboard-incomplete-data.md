# Fix dashboard data tidak tampil semua

## Temuan saat ini
- Dashboard `/` hanya menampilkan data yang email requester-nya sama persis dengan email pengguna aktif.
- Saat identitas pengguna belum tersedia, dashboard memakai email contoh `ayu.lestari@example.com`; kondisi sementara ini dapat membuat hasil terlihat kosong atau tidak lengkap.
- Pengambilan data kendaraan dan Extra Meal memakai satu kali `retrieveMultipleRecordsAsync`; konektor SharePoint dapat membatasi hasil per respons sehingga daftar besar berisiko hanya memuat halaman pertama.
- Dashboard belum menampilkan kegagalan sumber data secara terpisah, sehingga kegagalan salah satu list terlihat seperti data memang tidak ada.

## Perubahan
- Pastikan query Dashboard Saya menunggu identitas pengguna sebelum memfilter data dan hapus fallback email contoh.
- Normalisasi email requester dan email pengguna sebelum pencocokan agar spasi atau perbedaan huruf besar-kecil tidak menyembunyikan record yang valid.
- Ubah pembacaan SharePoint untuk mengambil seluruh halaman data kendaraan dan Extra Meal, bukan hanya respons pertama, sambil menjaga urutan terbaru lebih dahulu.
- Tambahkan status error per sumber data dan aksi coba lagi agar pengguna dapat membedakan data kosong dari kegagalan koneksi.
- Pertahankan pengelompokan Extra Meal berdasarkan Request ID, filter status, pencarian, panel detail, dan pembatasan Dashboard Saya hanya pada data milik pengguna aktif.

## Verifikasi
- Bandingkan jumlah record mentah dari kedua SharePoint List dengan jumlah yang diterima hook setelah seluruh halaman dimuat.
- Uji pengguna dengan variasi kapitalisasi/spasi email dan pastikan semua request miliknya tampil.
- Uji kondisi identitas masih dimuat, salah satu sumber gagal, data kosong, refresh, pencarian, dan filter status.
- Jalankan validasi proyek dan pemeriksaan SDK setelah perubahan.