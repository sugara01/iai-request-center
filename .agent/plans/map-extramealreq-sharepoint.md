# Mapping Extra Meal ke SharePoint

## Tujuan
- Menjadikan SharePoint List `ExtraMealReq` sebagai sumber data utama untuk seluruh proses Request Extra Meal.
- Mengganti data contoh/lokal agar request tersimpan, dibaca, diperbarui, dibatalkan, dihapus, dan diekspor dari SharePoint.

## Data source
- Connector: SharePoint Online yang sudah digunakan aplikasi.
- Site: `https://ineosgroup.sharepoint.com/sites/Aromatics/IAI`.
- List: `ExtraMealReq`.
- Entitas: ExtraMealReq.

## Mapping data
- Petakan model aplikasi ke kolom `RequestID`, `RecordID`, `ServiceDate`, `RequesterName`, `RequesterEmail`, `Department`, `Purpose`, `StartDate`, `EndDate`, `DurationHours`, `MealCategory`, `Quantity`, `AdditionalRequest`, `CurrentStatus`, `ApprovalTrigger`, dan `RequestCreatedAt`.
- Gunakan satu item SharePoint untuk setiap tanggal layanan; request beberapa hari tetap memakai `RequestID` yang sama dan `RecordID` unik per tanggal.
- Pertahankan status harian `Submitted`, `Approved`, `Rejected`, dan `Cancelled` serta nilai pemicu approval hanya pada item tanggal pertama.

## Perubahan fitur
- Form Request Extra Meal: simpan seluruh record harian ke `ExtraMealReq` dan tampilkan hasil sukses hanya setelah semua item berhasil dibuat.
- Form Request Extra Meal: tampilkan pesan kegagalan yang jelas jika sebagian atau seluruh record gagal dibuat, tanpa mengklaim request sudah tersimpan.
- Dashboard requester: baca Extra Meal milik pengguna dari SharePoint berdasarkan email requester dan tampilkan data aktual bersama request kendaraan.
- Admin Extra Meal: baca seluruh item SharePoint, kelompokkan berdasarkan `RequestID`, dan pertahankan detail per tanggal.
- Admin Extra Meal: hubungkan koreksi quantity/status, pembatalan, penghapusan, refresh, pencarian, sortir, filter, pagination, dan detail ke data SharePoint aktual.
- Ekspor Extra Meal: ekspor seluruh item dari list `ExtraMealReq`, bukan hanya data yang sedang terlihat atau terfilter.
- Hapus seed data dan penyimpanan lokal Extra Meal dari alur operasional aplikasi.
- Pertahankan desain, navigasi, bilingual UI, role Admin Extra Meal, workflow kendaraan, dan struktur grup request yang ada.

## Dokumentasi
- Perbarui overview agar `ExtraMealReq` tercatat sebagai sumber data aktif, bukan placeholder lokal.
- Tegaskan bahwa aplikasi menangani CRUD request, sedangkan email dan approval tetap menjadi tanggung jawab Power Automate.

## Verifikasi
- Pastikan koneksi SharePoint yang ada diregistrasikan untuk site dan list `ExtraMealReq`, lalu regenerasi data layer.
- Uji request satu hari menghasilkan satu item SharePoint dengan seluruh kolom terisi benar.
- Uji request tiga hari menghasilkan tiga item dengan `RequestID` sama, `RecordID` dan `ServiceDate` berbeda, serta satu `ApprovalTrigger` bernilai benar.
- Pastikan request baru tampil di dashboard requester dan grup Admin Extra Meal setelah refresh.
- Uji perubahan quantity/status, pembatalan, dan penghapusan per record harian tersinkron ke SharePoint tanpa mengubah tanggal lain.
- Pastikan ekspor memuat seluruh record `ExtraMealReq`.
- Uji loading, empty state, serta error koneksi dalam Bahasa Indonesia dan English.
- Jalankan validasi proyek dan validasi penggunaan SDK hingga lulus tanpa error.
