# Deep link koreksi dan approval berdasarkan Request ID

## Tujuan
- Sediakan URL dari email Power Automate yang membawa admin atau Plant Director langsung ke dialog **Koreksi & Approval** untuk request yang dituju.
- Terapkan pola yang sama untuk Request Kendaraan dan Extra Meal tanpa melewati pemeriksaan akses yang sudah ada.

## Pola URL
- Kendaraan: `<APP_BASE_URL>/admin-kendaraan?requestId=<REQUEST_ID>&action=approval`
- Extra Meal: `<APP_BASE_URL>/admin-meal?requestId=<REQUEST_ID>&action=approval`
- Gunakan Request ID bisnis yang tampil di aplikasi, bukan SharePoint item ID; nilai Request ID harus di-encode saat dibentuk di Power Automate.
- `APP_BASE_URL` menggunakan URL aplikasi yang sudah dipublikasikan, bukan URL lokal atau URL preview.

## Perilaku aplikasi
- Setelah autentikasi dan pemeriksaan role selesai, halaman admin membaca `requestId` dan `action` dari URL.
- Halaman menunggu data SharePoint selesai dimuat, mencari Request ID secara exact, lalu otomatis membuka dialog Koreksi & Approval.
- Kendaraan membuka record tunggal yang cocok pada dialog koreksi/approval Admin Kendaraan.
- Extra Meal membuka dialog koreksi/approval grup untuk seluruh record dengan Request ID yang sama, mengikuti perilaku grup yang sudah ada.
- Setelah dialog ditutup, parameter deep link dibersihkan agar dialog tidak terbuka kembali saat refresh atau navigasi internal.
- Jika Request ID tidak ditemukan, tampilkan pesan yang jelas dan pertahankan halaman admin agar pengguna dapat mencari manual.
- Jika request sudah berstatus final, dialog tetap dapat menampilkan data tetapi aksi keputusan yang tidak valid dinonaktifkan sesuai aturan status aplikasi.

## Akses dan keamanan
- Pertahankan proteksi route melalui `AdminAcess`; URL bukan token otorisasi dan tidak memberi akses tambahan.
- Pengguna link kendaraan harus memiliki akses Admin Kendaraan di `AdminAcess`; pengguna link Extra Meal harus memiliki akses Admin Extra Meal.
- Plant Director yang memproses kendaraan harus termasuk pengguna dengan akses Admin Kendaraan yang sudah Anda tambahkan, kecuali nanti dibuat role Plant Director terpisah.
- Pengguna tanpa role yang sesuai tetap dialihkan ke Dashboard Saya dan tidak dapat membuka data approval hanya dengan mengetahui URL.

## Power Automate
- Tambahkan compose untuk membentuk URL dari URL aplikasi terpublikasi, jenis request, dan Request ID dinamis.
- Masukkan URL sebagai tombol atau hyperlink pada email Admin Kendaraan, Plant Director, dan Admin Extra Meal sesuai tahap workflow.
- Untuk Kendaraan, email Admin memakai link saat status Submitted dan email Plant Director memakai link saat status Pending Plant Director Approval.
- Untuk Extra Meal, bentuk satu link per Request ID dari record pemicu approval, bukan satu link untuk setiap record tanggal.
- Dokumentasikan contoh expression Power Automate dan pemetaan kolom Request ID pada menu Workflow Request.

## Perubahan halaman
- **Admin Kendaraan:** dukungan query deep link, pencarian Request ID, pembukaan otomatis dialog Koreksi & Approval, serta state tidak ditemukan/final.
- **Admin Extra Meal:** dukungan query deep link, pencarian grup Request ID, pembukaan otomatis dialog Koreksi & Approval grup, serta state tidak ditemukan/final.
- **Workflow Request:** panduan URL terpublikasi, format link, expression Power Automate, tahap pengiriman email, dan aturan akses.

## Data entities
- RequestKendaraanApps
- ExtraMealReq
- AdminAcess

## Yang tetap sama
- Struktur SharePoint dan Request ID tidak berubah.
- Keputusan approval tetap ditulis melalui aksi aplikasi yang sudah ada.
- Dashboard requester, route lain, dan aturan role yang ada tetap dipertahankan.
- Email tetap dikirim oleh Power Automate; aplikasi hanya menyediakan target deep link.

## Validasi
- Uji link Kendaraan untuk Request ID valid, tidak ditemukan, status aktif, dan status final.
- Uji link Extra Meal membuka grup lengkap untuk Request ID yang sama.
- Uji pengguna dengan role benar serta pengguna tanpa role.
- Uji URL dengan karakter yang memerlukan encoding dan pastikan dialog hanya terbuka satu kali.
- Jalankan validasi proyek hingga TypeScript, lint, dan SDK lulus tanpa error.
