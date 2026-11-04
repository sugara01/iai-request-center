# Fix pergeseran tanggal Extra Meal

## Temuan
- Form memilih tanggal sebagai nilai kalender lokal dan menampilkannya dengan benar.
- Sebelum dikirim, tanggal diubah menjadi string `yyyy-MM-dd` tanpa informasi zona waktu.
- Kolom SharePoint `ServiceDate`, `StartDate`, dan `EndDate` bertipe Date Only, tetapi konektor tetap melakukan serialisasi tanggal melalui nilai date-time/UTC; string tanpa zona waktu dapat ditafsirkan sebagai UTC lalu dikonversi ke zona waktu situs/pengguna sehingga bergeser satu hari ke belakang.
- Jalur penulisan saat ini meneruskan string tersebut langsung ke service SharePoint tanpa normalisasi khusus kolom Date Only.

## Perubahan
- Tambahkan utilitas tanggal kalender khusus SharePoint yang mempertahankan hari yang dipilih saat nilai melewati konversi UTC dan zona waktu.
- Gunakan normalisasi tersebut untuk ketiga kolom Extra Meal: tanggal layanan harian, tanggal mulai acara, dan tanggal selesai acara.
- Pertahankan representasi tanggal internal aplikasi sebagai `yyyy-MM-dd` agar perhitungan durasi, grouping, sorting, preview, dan tampilan yang sudah ada tidak berubah.
- Normalisasi juga nilai tanggal yang dibaca kembali dari SharePoint supaya tampilan aplikasi selalu menggunakan tanggal kalender yang tersimpan, bukan hasil parsing browser yang berpotensi bergeser.
- Jangan mengubah struktur list SharePoint, workflow approval, jumlah record harian, Request ID, atau fitur admin.

## Verifikasi
- Uji rentang 2–3 November 2026 dan pastikan SharePoint menyimpan StartDate 2 November, EndDate 3 November, serta ServiceDate masing-masing 2 dan 3 November.
- Uji request satu hari untuk memastikan tanggal dan durasi jam tetap akurat.
- Uji tanggal di batas akhir bulan/tahun untuk memastikan tidak ada pergeseran atau record tambahan/hilang.
- Pastikan preview sebelum submit, detail requester, dan tampilan admin menunjukkan tanggal yang sama dengan SharePoint.
- Jalankan validasi proyek setelah perubahan.