# Perbaikan mapping Choice Request Kendaraan

## Tujuan
- Memastikan nilai form Request Kendaraan tersimpan ke kolom SharePoint bertipe Choice setelah perubahan skema list.
- Membatasi perubahan pada alur Request Kendaraan; form Extra Meal dan halaman lain tetap seperti sekarang.

## Perubahan
- Sinkronkan ulang metadata dan data layer SharePoint `RequestKendaraan` agar `Departemen`, `Tujuan`, dan `CurrentStatus` dikenali sebagai Choice.
- Audit seluruh kolom Choice pada `RequestKendaraan`, termasuk kolom keputusan yang digunakan oleh alur admin/approval, agar kontrak baca dan tulis sesuai skema SharePoint terbaru.
- Ubah payload create Request Kendaraan untuk mengirim nilai Choice melalui field ID/format yang disyaratkan connector, bukan sebagai teks pada field yang tidak dipetakan.
- Pertahankan label pilihan form saat ini dan petakan setiap pilihan ke nilai Choice SharePoint yang tepat, termasuk `Finance & Accounting`, `IT&S`, `PD (Logistic)`, tujuan perjalanan, dan status awal `Submitted`.
- Pertahankan dukungan baca untuk respons Choice berbentuk objek agar dashboard requester dan Admin Kendaraan tetap menampilkan label yang benar.
- Perbarui pesan kegagalan submit agar menjelaskan ketidakcocokan pilihan atau metadata tanpa lagi menyarankan tipe `Single line of text`.

## Verifikasi
- Pastikan submit Request Kendaraan membentuk payload Choice yang valid untuk `Departemen`, `Tujuan`, dan `CurrentStatus`.
- Pastikan nilai yang baru dibuat dapat dibaca kembali dan tampil benar pada dashboard requester serta Admin Kendaraan.
- Jalankan validasi proyek dan pemeriksaan penggunaan SDK sampai tanpa error.
