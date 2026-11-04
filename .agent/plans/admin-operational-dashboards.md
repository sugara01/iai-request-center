# Dashboard Operasional Admin Kendaraan dan Extra Meal

## Tujuan
- Mengubah bagian atas halaman Admin Kendaraan dan Admin Extra Meal menjadi dashboard operasional agar admin dapat memahami volume, status, tren, dan antrean prioritas sebelum bekerja di tabel.
- Mempertahankan halaman, route, sumber data SharePoint, hak akses, serta seluruh aksi admin yang sudah ada.

## Pengalaman bersama
- Tambahkan filter periode 7 hari, 30 hari, bulan berjalan, dan semua data pada kedua halaman admin.
- Terapkan periode terpilih secara konsisten pada kartu ringkasan, grafik, antrean perhatian, indikator, dan tabel operasional.
- Tambahkan kartu Total, Sedang Diproses, Approved, dan Rejected/Cancelled yang dapat dipilih untuk memfilter tabel.
- Tambahkan grafik tren jumlah request sepanjang periode dan grafik distribusi status.
- Tambahkan panel “Perlu perhatian” berisi request tertunda atau belum selesai paling lama, dengan akses langsung ke detail request.
- Tampilkan waktu pembaruan data dan pertahankan tombol Refresh serta Ekspor CSV.
- Gunakan empty state, loading state, dan pesan data tanggal tidak valid yang jelas tanpa mengganggu pekerjaan admin.

## Admin Kendaraan
- Ringkas metrik berdasarkan satu record request kendaraan.
- Tampilkan tren request kendaraan berdasarkan tanggal pembuatan dan distribusi status proses kendaraan.
- Tambahkan indikator operasional untuk request menunggu keputusan admin, menunggu Plant Director, ditolak karena kendaraan tidak tersedia, dan jadwal keberangkatan terdekat.
- Panel perhatian memprioritaskan request aktif paling lama dan perjalanan terdekat yang belum selesai.
- Pertahankan pencarian, filter status, sorting, pagination, detail panel, hapus, dan ekspor yang sudah tersedia.

## Admin Extra Meal
- Ringkas metrik utama berdasarkan Request ID unik agar satu request multi-hari tidak dihitung berulang.
- Tampilkan jumlah record harian sebagai metrik pendamping untuk memberi gambaran beban layanan aktual.
- Tampilkan tren Request ID baru dan distribusi status request, termasuk status campuran.
- Tambahkan indikator operasional untuk record Submitted, request dengan status campuran, tanggal layanan terdekat, dan total meal pada periode.
- Panel perhatian memprioritaskan request aktif paling lama, status campuran, dan tanggal layanan terdekat yang belum selesai.
- Pertahankan grouping per Request ID, detail harian, koreksi, pembatalan, penghapusan, pencarian, sorting, pagination, dan ekspor.

## Interaksi dan konsistensi
- Memilih kartu, bagian grafik, atau item antrean memperbarui atau mengarahkan fokus ke data tabel yang relevan.
- Perubahan periode atau filter mengembalikan pagination ke halaman pertama.
- Ekspor CSV mengikuti periode dan filter aktif agar hasil unduhan konsisten dengan view admin.
- Status dan warna menggunakan token tema yang sudah ada serta tetap terbaca di mode terang dan gelap.
- Tampilan desktop menggunakan susunan dashboard padat; tampilan sempit menyusun kartu, grafik, panel perhatian, dan tabel secara responsif.

## Data dan batasan
- Gunakan data SharePoint `RequestKendaraan` dan `ExtraMealReq` yang sudah terhubung; tidak menambah tabel atau konektor baru.
- Gunakan timestamp pembuatan untuk filter periode dan tren; gunakan jadwal layanan untuk indikator kebutuhan terdekat.
- Data Extra Meal tetap dibedakan antara Request ID unik dan record layanan harian pada seluruh label analitik.
- Definisi “perlu perhatian” hanya mencakup request yang belum berstatus final, lalu diurutkan berdasarkan usia dan kedekatan jadwal.

## Dokumentasi dan verifikasi
- Perbarui overview proyek untuk mencatat dashboard analitik operasional pada kedua role admin.
- Verifikasi perhitungan metrik, sinkronisasi filter dengan tabel/ekspor, navigasi ke detail, kondisi kosong/loading/error, responsivitas, aksesibilitas, dan build proyek.
