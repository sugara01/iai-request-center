# Grup Extra Meal di Dashboard Requester

## Tujuan
- Menyamakan tampilan request Extra Meal pada Dashboard Saya dengan pola grup yang digunakan di Admin Extra Meal.
- Menampilkan satu baris ringkasan untuk setiap Request ID meskipun request memiliki beberapa record harian.

## Perubahan
- Dashboard requester: kelompokkan record Extra Meal berdasarkan Request ID setelah data dibatasi untuk pengguna yang sedang login.
- Dashboard requester: tampilkan satu baris ringkasan per Request ID dengan tombol panah buka/tutup di sisi kiri.
- Baris ringkasan: tampilkan tujuan acara, periode mulai–selesai, jumlah tanggal, dan status gabungan request.
- Detail grup: ketika dibuka, tampilkan seluruh record harian berdasarkan tanggal layanan, termasuk Record ID, kategori meal, jumlah, dan status masing-masing.
- Detail pop-up: pertahankan akses detail record harian dari baris yang dibuka agar informasi setiap tanggal tetap dapat diperiksa.
- Pencarian dan filter status: tetap bekerja pada grup Extra Meal dan record hariannya tanpa mengubah perilaku data Kendaraan.
- Urutan data: pertahankan request terbaru di posisi paling atas.
- Bahasa: sediakan label grup, jumlah tanggal, status campuran, dan detail harian dalam Bahasa Indonesia dan English.
- Pertahankan tampilan request Kendaraan, integrasi SharePoint ExtraMealReq, workflow approval, dan halaman Admin Extra Meal tanpa perubahan.

## Data
- ExtraMealReq

## Verifikasi
- Pastikan request Extra Meal tiga hari hanya tampil sebagai satu baris pada Dashboard Saya.
- Pastikan tombol panah membuka tiga record harian dengan tanggal dan status masing-masing.
- Pastikan beberapa request dengan Request ID berbeda tetap tampil sebagai grup terpisah.
- Pastikan pencarian, filter status, detail pop-up, urutan terbaru, dan pergantian bahasa tetap berfungsi.
- Jalankan validasi proyek hingga lulus tanpa error.
