# Sederhanakan dialog Koreksi & Approval

## Perubahan Admin Kendaraan
- Ubah judul dialog dari **Koreksi request kendaraan** menjadi **Koreksi & Approval Request Kendaraan**.
- Tampilkan Request ID, nama pemohon, email pemohon, dan departemen sebagai informasi teks read-only yang ringkas, bukan input atau pilihan form.
- Hilangkan kolom **Catatan requester** dari form koreksi; catatan tetap tersedia pada panel detail request dan tidak dihapus dari data.
- Pertahankan kolom operasional lain yang dapat dikoreksi, keputusan Admin, keputusan Plant Director, catatan approval, status otomatis, serta tombol batal dan simpan.
- Susun ulang konten agar area keputusan dan tombol simpan lebih cepat dijangkau dengan kebutuhan scroll yang lebih sedikit.

## Perubahan Admin Extra Meal
- Ubah judul dialog koreksi menjadi **Koreksi & Approval Request**.
- Pertahankan field, aksi simpan, dan perilaku koreksi Extra Meal yang ada.

## Bahasa
- Tambahkan atau perbarui label Bahasa Indonesia dan English untuk kedua judul dialog.

## Tetap sama
- Label tooltip ikon pencil tetap **Koreksi & Approval Request**.
- Tidak ada perubahan pada data SharePoint, workflow approval, hak akses, tabel, filter, pagination, atau panel detail.

## Verifikasi
- Pastikan informasi identitas kendaraan tampil sebagai label teks dan tidak dapat diedit.
- Pastikan Catatan requester tidak muncul pada form koreksi kendaraan tetapi tetap muncul pada detail request.
- Pastikan judul dialog baru tampil pada kedua view admin dan mengikuti bahasa aktif.
- Pastikan penyimpanan koreksi kendaraan dan Extra Meal tetap berjalan serta validasi proyek lulus tanpa error.
