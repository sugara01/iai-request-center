# Remap Request Kendaraan Apps

## Scope
- Alihkan form **Request Kendaraan**, Dashboard Saya, dan dashboard **Admin Kendaraan** dari SharePoint List lama `RequestKendaraan` ke list baru `RequestKendaraanApps`.
- Pertahankan tampilan, alur submit, filter, detail, ekspor CSV, pagination, dan penghapusan yang sudah ada; hanya sumber data dan mapping kolom kendaraan yang berubah.
- Biarkan fitur Extra Meal dan akses admin tetap memakai sumber data saat ini.

## Prasyarat data
- Segarkan mapping Data untuk `RequestKendaraanApps` sampai seluruh kolom aktual terdeteksi; metadata saat ini baru menampilkan kolom wajib `New column`, sehingga belum cukup untuk create, read, update, dan delete.
- Gunakan nama internal dan tipe kolom aktual dari list baru sebagai sumber kebenaran, termasuk kolom wajib, tanggal, angka, teks panjang, Person, serta Choice single/multi.
- Regenerasi data layer setelah metadata list baru lengkap agar model, service, validator, dan hooks TypeScript tersedia untuk `RequestKendaraanApps`.

## Mapping dan operasi
- Buat pemetaan eksplisit dari nilai form kendaraan ke kolom list baru untuk nomor request, identitas pemohon, departemen, jadwal, penumpang, titik jemput, tujuan, detail tujuan lain, keperluan, catatan, status, keputusan admin/Plant Director, dan timestamp yang tersedia pada skema baru.
- Serialisasi setiap kolom sesuai kontrak generated connector aktual, khususnya Choice dan Person; jangan memakai asumsi struktur payload dari list lama.
- Arahkan operasi create, read bertahap seluruh halaman, update status/keputusan, dan delete ke service `RequestKendaraanApps`.
- Normalisasi nilai hasil baca ke model UI kendaraan agar halaman yang ada tetap konsisten walaupun nama dan tipe kolom SharePoint berubah.
- Gunakan kolom primary text wajib `New column` sesuai fungsi aktualnya; jika kolom tersebut adalah nomor request, isi dengan nomor request yang dibuat aplikasi.

## Halaman
- **Request Kendaraan (`/request-kendaraan`)** — submit data ke `RequestKendaraanApps`, tampilkan validasi dan pesan error berdasarkan kolom wajib skema baru.
- **Dashboard Saya (`/`)** — tampilkan request kendaraan milik pengguna dari list baru bersama request Extra Meal yang tetap tidak berubah.
- **Admin Kendaraan (`/admin-kendaraan`)** — baca seluruh record list baru untuk statistik, pencarian, filter, detail, ekspor CSV, refresh, pagination, dan penghapusan.

## Verifikasi
- Uji create satu request kendaraan dan cocokkan setiap nilai tersimpan pada kolom list baru, termasuk semua Choice/Person yang ada.
- Uji pembacaan request baru pada Dashboard Saya dan Admin Kendaraan, termasuk status, tujuan lainnya, tanggal, dan identitas requester.
- Uji update untuk setiap aksi kendaraan yang tersedia dan delete dari Admin Kendaraan.
- Pastikan pagination mengambil seluruh data SharePoint dan filter/statistik memakai data list baru.
- Jalankan validasi TypeScript, build proyek, dan SDK tanpa error.

## Batasan
- Implementasi belum boleh menebak kolom yang tidak muncul di metadata. Jika refresh Data masih hanya mendeteksi `New column`, mapping dihentikan sampai seluruh skema `RequestKendaraanApps` tersedia.
- Data historis dari `RequestKendaraan` tidak digabungkan kecuali dipindahkan ke list baru di luar scope ini.
