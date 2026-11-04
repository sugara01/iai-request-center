# Remap Request Kendaraan ke RequestKendaraanApps

## Scope
- Pindahkan seluruh fitur kendaraan dari SharePoint List `RequestKendaraan` ke `RequestKendaraanApps`.
- Pertahankan fitur Extra Meal, akses admin, navigasi, tampilan, bahasa, dan batas workflow Power Automate tanpa perubahan.
- Data historis dari list lama tidak digabungkan; halaman kendaraan hanya menggunakan data yang tersedia di list baru.

## Data source
- Daftarkan `RequestKendaraanApps` dari site SharePoint IAI sebagai pengganti data source kendaraan lama.
- Sinkronkan metadata koneksi dan regenerasi data layer agar model serta service mengikuti tipe kolom aktual pada list baru.
- Gunakan nama internal dan tipe data dari schema generated sebagai sumber kebenaran; nama kolom tampilan yang sama tidak dianggap memiliki kontrak payload yang sama.
- Lepaskan pemakaian service `RequestKendaraan` lama setelah seluruh operasi kendaraan berhasil diarahkan ke list baru.

## Mapping kendaraan
- Petakan nomor request, identitas pemohon, departemen, tanggal dan jam, tujuan, detail tujuan lainnya, keperluan, jumlah penumpang, titik jemput, catatan, status, keputusan admin, keputusan Plant Director, catatan approval, manager requester, serta timestamp ke kolom bernama sama pada list baru.
- Sesuaikan serialisasi create dan update berdasarkan tipe aktual setiap kolom baru, termasuk Text, Number, Date/Time, Choice, Person, dan nilai opsional.
- Sesuaikan normalisasi hasil baca agar model UI kendaraan tetap konsisten untuk pencarian, status, statistik, detail, dan ekspor.
- Pertahankan status awal `Submitted` dan nomor request yang dibuat aplikasi.

## Halaman
- **Request Kendaraan (`/request-kendaraan`)** — simpan pengajuan baru ke `RequestKendaraanApps` dengan validasi sesuai kolom wajib dan tipe data baru.
- **Dashboard Saya (`/`)** — baca dan tampilkan request kendaraan milik pengguna dari `RequestKendaraanApps`, berdampingan dengan Extra Meal yang tetap memakai sumber saat ini.
- **View Admin Kendaraan (`/admin-kendaraan`)** — gunakan list baru untuk statistik, filter periode/status, pencarian, detail, refresh, pagination, ekspor CSV, dan penghapusan.

## Perilaku yang dipertahankan
- Form, opsi departemen dan tujuan, detail tujuan `Lainnya`, pesan konfirmasi, dan alur submit tetap sama kecuali penyesuaian validasi tipe.
- Dashboard requester tetap memfilter kendaraan berdasarkan email pengguna aktif.
- Admin Kendaraan tetap memuat seluruh halaman data SharePoint dan menampilkan status kegagalan koneksi secara terpisah.
- Power Automate tetap menangani approval, email, reminder, dan pembaruan status setelah aplikasi membuat item berstatus awal `Submitted`.

## Verifikasi
- Cocokkan schema generated `RequestKendaraanApps` dengan setiap kolom yang dipakai aplikasi sebelum menyelesaikan mapping.
- Uji create untuk rute standar dan tujuan `Lainnya`, lalu pastikan setiap nilai tersimpan dengan tipe yang benar di SharePoint.
- Pastikan request baru tampil pada Dashboard Saya sesuai email pemohon dan pada View Admin Kendaraan.
- Uji statistik, filter, pencarian, detail, ekspor CSV, pagination seluruh data, refresh, dan delete terhadap list baru.
- Uji pembacaan serta penulisan field status/keputusan yang dipakai workflow tanpa mengubah label bisnisnya.
- Jalankan validasi TypeScript, build proyek, dan pemeriksaan SDK hingga tanpa error.

## Prasyarat
- Metadata `RequestKendaraanApps` harus menampilkan seluruh kolom aktual. Jika schema koneksi belum lengkap atau list belum terdaftar di `power.config.json`, refresh/registrasi koneksi dilakukan terlebih dahulu dan mapping tidak boleh ditebak dari schema list lama.
