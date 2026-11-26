import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Language = 'id' | 'en';
type Variables = Record<string, string | number>;
type LanguageContextValue = { language: Language; locale: string; setLanguage: (language: Language) => void; t: (text: string, variables?: Variables) => string };

const STORAGE_KEY = 'iai-request-center-language';

const english: Record<string, string> = {
  'Dashboard Saya': 'My Dashboard', 'Buat Request': 'Create Request', 'Panduan Requester': 'Requester Guide',
  'Admin Kendaraan': 'Vehicle Admin', 'Admin Extra Meal': 'Extra Meal Admin', 'Workflow Request': 'Request Workflow', 'Kelola Admin': 'Manage Admins',
  'Requester': 'Requester', 'Administration': 'Administration', 'Memuat akses administrasi': 'Loading administration access',
  'Data sources': 'Data sources', 'Kendaraan: SharePoint aktif': 'Vehicles: SharePoint active', 'Akses admin: SharePoint aktif': 'Admin access: SharePoint active',
  'Bahasa': 'Language', 'Bahasa Indonesia': 'Bahasa Indonesia', 'English': 'English',
  'Refresh': 'Refresh', 'Ekspor CSV': 'Export CSV', 'Cari request': 'Search requests', 'Cari request atau tanggal': 'Search request or date',
  'Semua status': 'All statuses', 'Semua status harian': 'All daily statuses', 'Sebelumnya': 'Previous', 'Berikutnya': 'Next',
  'Pemohon': 'Requester', 'Tujuan': 'Destination', 'Jadwal': 'Schedule', 'Penumpang': 'Passengers', 'Status': 'Status', 'Aksi': 'Actions',
  'Monitoring kendaraan': 'Vehicle monitoring', 'Admin owner kendaraan': 'Vehicle owner admin',
  'Kelola data operasional dan status approval Request kendaraan': 'Manage operational data and approval status for Vehicle Requests',
  'Detail request kendaraan': 'Vehicle request details', 'Informasi request kendaraan': 'Vehicle request information',
  'Identitas request': 'Request identity', 'ID request': 'Request ID', 'ID record SharePoint': 'SharePoint record ID',
  'Nama pemohon': 'Requester name', 'Email pemohon': 'Requester email', 'Departemen': 'Department', 'Perjalanan': 'Trip',
  'Tanggal keberangkatan': 'Pickup date', 'Jam keberangkatan': 'Pickup time', 'Tanggal Jemput': 'Pickup date', 'Jam Jemput': 'Pickup time',
  'Detail Tujuan lainnya': 'Other destination details', 'Keperluan': 'Purpose', 'Jumlah penumpang': 'Passenger count', 'Titik jemput': 'Pickup point',
  'Status dan keputusan': 'Status and decisions', 'Status saat ini': 'Current status', 'Keputusan admin': 'Admin decision', 'Catatan requester': 'Requester notes', 'Catatan admin': 'Admin notes',
  'Keputusan Plant Director': 'Plant Director decision', 'Catatan Plant Director': 'Plant Director notes', 'Metadata record': 'Record metadata',
  'Dibuat': 'Created', 'Pembaruan terakhir': 'Last updated', 'Hapus request kendaraan?': 'Delete vehicle request?',
  'Batal': 'Cancel', 'Hapus permanen': 'Delete permanently', 'Menghapus...': 'Deleting...', 'Baris per halaman': 'Rows per page',
  'Monitoring extra meal': 'Extra meal monitoring', 'Admin owner extra meal': 'Extra meal owner admin', 'Request extra meal': 'Extra meal requests',
  'Kelola data operasional dan status approval Request Extra Meal': 'Manage operational data and approval status for Extra Meal Requests',
  'Acara': 'Event', 'Periode': 'Period', 'Record': 'Records', 'tanggal': 'dates', 'Status campuran': 'Mixed statuses',
  'Pemicu approval': 'Approval trigger', 'Detail harian': 'Daily detail', 'Detail record harian': 'Daily record details',
  'Identitas record': 'Record identity', 'Tanggal layanan': 'Service date', 'Nama': 'Name', 'Kebutuhan meal': 'Meal requirements',
  'Tujuan acara': 'Event purpose', 'Kategori': 'Category', 'Jumlah': 'Quantity', 'Status harian': 'Daily status',
  'Hapus record tanggal ini?': 'Delete this date record?', 'Koreksi record harian': 'Edit daily record', 'Koreksi & Approval Request': 'Correct & Approve Request', 'Koreksi & Approval Request Kendaraan': 'Correct & Approve Vehicle Request', 'Qty meal': 'Meal quantity', 'Simpan': 'Save',
  'grup': 'groups', 'record harian': 'daily records', 'Request ID': 'Request ID', 'Record ID': 'Record ID',
  'Tanggal Layanan': 'Service Date', 'Email': 'Email', 'Tanggal Mulai': 'Start Date', 'Tanggal Selesai': 'End Date',
  'Tambahan': 'Additional Request', 'Catatan atau Tambahan dari requester': 'Requester notes or additional information', 'Pemicu Approval': 'Approval Trigger', 'Ya': 'Yes', 'Tidak': 'No',
  'Dashboard': 'Dashboard', 'Request saya': 'My requests', 'Request Saya': 'My requests', 'Semua Request': 'All requests',
  'User: {{name}}': 'User: {{name}}', 'Lingkup request': 'Request scope',
  'Ganti pengguna demo': 'Switch demo user', 'Pilih pengguna demo': 'Choose demo user', 'Memuat pengguna': 'Loading user',
  'Tampilkan/sembunyikan menu navigasi': 'Toggle navigation menu',
  'Menampilkan {{visible}} dari {{total}} pengajuan milik {{name}} ({{email}}).': 'Showing {{visible}} of {{total}} requests for {{name}} ({{email}}).',
  'Menampilkan {{visible}} dari {{total}} pengajuan milik semua requester.': 'Showing {{visible}} of {{total}} requests for all requesters.',
  'Request terbaru': 'Recent requests', 'Lihat detail': 'View details',
  'Buat request baru': 'Create new request', 'Request Kendaraan': 'Vehicle Request', 'Request Extra Meal': 'Extra Meal Request',
  'Pilih jenis request': 'Choose request type', 'Kembali': 'Back', 'Lanjut': 'Continue', 'Kirim request': 'Submit request',
  'Periksa detail request kendaraan': 'Review vehicle request details', 'Tanggal jemput': 'Pickup date', 'Jam jemput': 'Pickup time',
  'Detail tujuan lainnya': 'Other destination details', 'Catatan': 'Notes', 'Wajib diisi': 'Required',
  'Contoh: Meeting dengan Customer': 'Example: Meeting with Customer', 'Tanggal mulai': 'Start date', 'Tanggal selesai': 'End date',
  'Kategori meal': 'Meal category', 'Jumlah meal': 'Meal quantity', 'Permintaan tambahan': 'Additional request',
  'Panduan request kendaraan': 'Vehicle request guide', 'Panduan request extra meal': 'Extra meal request guide', 'Pertanyaan umum': 'Frequently asked questions',
  'Halaman tidak ditemukan': 'Page not found', 'Kembali ke dashboard': 'Back to dashboard', 'Coba lagi': 'Try again',
  'Submitted': 'Submitted', 'Approved': 'Approved', 'Rejected': 'Rejected', 'Cancelled': 'Cancelled', 'Pending': 'Pending',
  'Merak - Jakarta (HO)': 'Merak - Jakarta (HO)', 'Jakarta - Merak': 'Jakarta - Merak', 'Lainnya': 'Other',
  'Lunch': 'Lunch', 'Dinner': 'Dinner', 'Other': 'Other',
  'Request baru': 'New request', 'Form extra meal': 'Extra meal form', 'Satu Request ID akan digunakan untuk semua tanggal acara.': 'One Request ID will be used for all event dates.',
  'Informasi acara': 'Event information', 'Tanggal mulai acara': 'Event start date', 'Durasi otomatis': 'Automatic duration', 'Pilih rentang tanggal': 'Select a date range', 'Durasi acara (jam)': 'Event duration (hours)',
  'Nama requester': 'Requester name', 'Pilih departemen': 'Select department', 'Pilih kategori': 'Select category', 'Kategori lainnya': 'Other category', 'Masukkan kategori meal': 'Enter meal category',
  'Qty meal per hari': 'Meal quantity per day',
  'Tinjau & submit': 'Review & submit', 'Preview baris': 'Row preview', 'baris SharePoint akan dibuat': 'SharePoint rows will be created', 'Detail': 'Detail', 'Satu approval': 'One approval',
  'Hanya baris pertama yang menandai pemicu Power Automate. Semua baris memakai Request ID yang sama.': 'Only the first row triggers Power Automate. All rows use the same Request ID.',
  'Periksa detail request extra meal': 'Review extra meal request details', 'Email requester': 'Requester email', 'Durasi': 'Duration', 'Jumlah per hari': 'Quantity per day', 'Tidak ada': 'None', 'Periksa lagi': 'Review again', 'Ya, submit request': 'Yes, submit request', 'Pilih tanggal': 'Select date',
  'Pastikan seluruh informasi sudah benar.': 'Make sure all information is correct.', 'baris tanggal akan dibuat dengan satu proses approval.': 'date rows will be created with one approval process.',
  'Rentang tanggal mencakup weekend': 'The date range includes a weekend', 'tanggal Sabtu–Minggu ditemukan:': 'Saturday–Sunday dates found:',
  'Keluarkan Sabtu–Minggu': 'Exclude Saturday–Sunday', 'Hanya tanggal Senin–Jumat yang akan dibuat.': 'Only Monday–Friday dates will be created.',
  'Sertakan Sabtu–Minggu': 'Include Saturday–Sunday', 'Semua tanggal dalam rentang akan dibuat.': 'All dates in the range will be created.',
  'Tidak ada tanggal layanan yang tersisa': 'No service dates remain', 'Sertakan weekend atau ubah rentang tanggal sebelum mengirim request.': 'Include the weekend or change the date range before submitting the request.',
  'Tidak ada tanggal layanan yang tersisa. Sertakan weekend atau ubah rentang tanggal.': 'No service dates remain. Include the weekend or change the date range.',
  'Tanggal layanan terpilih': 'Selected service dates', 'tanggal layanan': 'service dates', 'Menyimpan...': 'Saving...',
  'record harian tersimpan di SharePoint. Power Automate akan menangani email dan approval.': 'daily records were saved to SharePoint. Power Automate will handle email and approval.',
  'Request belum tersimpan sepenuhnya. Periksa koneksi ExtraMealReq. Detail:': 'The request was not fully saved. Check the ExtraMealReq connection. Details:',
  'Request kendaraan': 'Vehicle request', 'Aplikasi menyimpan request ke SharePoint; Power Automate menangani proses setelah submit.': 'The app saves requests to SharePoint; Power Automate handles the process after submission.', 'Detail perjalanan': 'Trip details',
  'Jam Jemput (24 jam)': 'Pickup time (24-hour)', 'Menit jemput': 'Pickup minute', 'Pilih tujuan': 'Select destination', 'Tuliskan detail tujuan lengkap': 'Enter the full destination details', 'Batas tanggung jawab': 'Responsibility boundary',
  'Proses approval terintegrasi dalam sistem ini. Power Automate hanya mengirimkan email notifikasi.': 'The approval process is integrated into this system. Power Automate only sends email notifications.',
  'Pastikan seluruh informasi sudah benar sebelum request disimpan ke SharePoint.': 'Make sure all information is correct before the request is saved to SharePoint.', 'orang': 'people', 'Ya, simpan request': 'Yes, save request',
  'Layanan requester': 'Requester services', 'Pilih layanan yang dibutuhkan. Jenis request lain akan ditambahkan bertahap.': 'Choose the service you need. Other request types will be added gradually.', 'Tersedia': 'Available', 'Mulai request': 'Start request',
  'Ajukan kendaraan untuk business trip dan perjalanan dinas.': 'Request a vehicle for business trips and official travel.', 'Jadwal, tujuan, titik jemput, dan penumpang': 'Schedule, destination, pickup point, and passengers', 'Ajukan kebutuhan meal tambahan untuk kegiatan operasional.': 'Request additional meals for operational activities.', 'Rentang acara, kategori meal, dan kuantitas': 'Event period, meal category, and quantity',
  'Dashboard requester': 'Requester dashboard', 'Selamat Datang, {{name}}': 'Welcome, {{name}}', 'Pantau seluruh request kendaraan dan extra meal dalam satu tempat.': 'Track all vehicle and extra meal requests in one place.', 'Total request': 'Total requests', 'Sedang diproses': 'In progress',
  'dari': 'of', 'pengajuan': 'submissions', 'Cari ID, jenis, tujuan, status': 'Search ID, type, destination, status', 'Request tidak ditemukan': 'No requests found', 'Ubah kata pencarian atau pilih kategori status lain.': 'Change the search term or choose another status category.', 'Jenis': 'Type', 'Tujuan / acara': 'Destination / event', 'Ringkasan request': 'Request summary', 'Informasi detail': 'Detailed information', 'Dibuat pada': 'Created at',
  'Kendaraan': 'Vehicle', 'Pusat bantuan requester': 'Requester help center', 'Panduan membuat request': 'How to create a request', 'Pilih langkah': 'Choose a step', 'Langkah berikutnya': 'Next step', 'Panduan selesai': 'Guide complete', 'Yang perlu Anda isi': 'What you need to fill in', 'Tips:': 'Tips:',
  '4 langkah pengisian': '4 steps', 'Pantau status': 'Track status', 'Melalui Dashboard Saya': 'Through My Dashboard', 'Buka form kendaraan': 'Open vehicle form', 'Buka form extra meal': 'Open extra meal form', 'Buka Dashboard Saya': 'Open My Dashboard',
  'Trigger reminder dicatat untuk {{name}}.': 'Reminder trigger recorded for {{name}}.', 'Reminder terkirim': 'Reminder sent', 'Reminder Plant Manager': 'Remind Plant Manager', 'Status approval': 'Approval status', 'Request submitted': 'Request submitted', 'Menunggu keputusan Plant Manager melalui Power Automate.': 'Waiting for the Plant Manager decision through Power Automate.', 'Reminder dicatat': 'Reminder recorded', 'Approver': 'Approver', 'Lihat proses approval': 'View approval process',
  'Khusus Riyan Sugara': 'Riyan Sugara only', 'Kelola akses admin': 'Manage admin access', 'Atur akses kendaraan dan extra meal melalui data AdminAcess.': 'Manage vehicle and extra meal access through AdminAcess data.', 'Assign admin': 'Assign admin', 'Email user': 'User email', 'Masukkan alamat email kantor secara manual.': 'Enter the corporate email address manually.', 'Simpan akses': 'Save access', 'Daftar admin': 'Admin list', 'Cari email': 'Search email',
  'Masukkan alamat email yang valid': 'Enter a valid email address', 'Akses admin diperbarui': 'Admin access updated', 'Admin berhasil ditambahkan': 'Admin added successfully', 'Akses admin gagal disimpan': 'Failed to save admin access', 'Role admin diperbarui': 'Admin role updated', 'Role gagal diperbarui': 'Failed to update role',
  'Cabut akses admin': 'Revoke admin access', 'Cabut akses admin?': 'Revoke admin access?', 'Akses admin berhasil dicabut': 'Admin access revoked', 'Akses admin gagal dicabut': 'Failed to revoke admin access', 'Mencabut...': 'Revoking...', 'Ya, cabut akses': 'Yes, revoke access',
  'Sortir Request ID Z ke A': 'Sort Request ID Z to A', 'Sortir Request ID A ke Z': 'Sort Request ID A to Z', 'Sortir Requester Z ke A': 'Sort Requester Z to A', 'Sortir Requester A ke Z': 'Sort Requester A to Z', 'Menampilkan': 'Showing', 'hasil': 'results', 'Halaman': 'Page', 'baris': 'rows',
  'Memuat akses': 'Loading access', 'Page Not Found': 'Page Not Found', 'Go Back Home': 'Go Back Home',
  'SharePoint List Db: Online': 'SharePoint List DB: Online', 'Developer By: Riyan Sugara': 'Developed by: Riyan Sugara', 'Online': 'Online',
  'Filter status request': 'Request status filter', 'Jumlah tanggal': 'Date count', 'jam': 'hours', 'hari': 'days', 'hari kalender': 'calendar days', 'Tutup grup': 'Collapse group', 'Buka grup': 'Expand group', 'Rejected / Cancelled': 'Rejected / Cancelled',
  'Lengkapi seluruh kolom wajib.': 'Complete all required fields.', 'Kesalahan koneksi tidak diketahui.': 'Unknown connection error.', 'Request kendaraan sedang diproses melalui Power Automate.': 'The vehicle request is being processed through Power Automate.', 'Kembali ke Dashboard Saya': 'Back to My Dashboard',
  'Request berhasil disimpan': 'Request saved successfully', 'Detail sedang disinkronkan dari SharePoint. Request dapat dilihat di Dashboard Saya.': 'Details are being synchronized from SharePoint. You can view the request in My Dashboard.', 'Lihat Dashboard Saya': 'View My Dashboard', 'Memuat request...': 'Loading request...', 'Rincian record harian': 'Daily record details', 'Qty per hari': 'Quantity per day',
  'Buat request': 'Create request', 'Ikuti panduan langkah demi langkah berikut. Pilih jenis request, pelajari setiap kolom, lalu buka form saat Anda siap.': 'Follow this step-by-step guide. Choose a request type, review each field, then open the form when ready.', 'FAQ': 'FAQ',
  'Tidak ada request kendaraan': 'No vehicle requests', 'SharePoint belum memiliki record kendaraan.': 'SharePoint does not have any vehicle records yet.', 'Ubah periode, status, atau kata pencarian untuk melihat data lain.': 'Change the period, status, or search term to view other data.', 'Data kendaraan gagal dimuat': 'Failed to load vehicle data', 'Koneksi SharePoint tidak tersedia. Coba muat ulang data.': 'The SharePoint connection is unavailable. Try reloading the data.', 'Memuat...': 'Loading...',
  'Menunggu keputusan admin': 'Waiting for admin decision', 'Menunggu Plant Director': 'Waiting for Plant Director', 'Kendaraan tidak tersedia': 'Vehicle unavailable', 'Keberangkatan terdekat': 'Nearest departure', 'Jadwal belum tersedia': 'Schedule unavailable',
  'Record Submitted': 'Submitted records', 'Layanan terdekat': 'Nearest service', 'Total meal': 'Total meals', 'Memuat data ExtraMealReq...': 'Loading ExtraMealReq data...', 'Tutup': 'Collapse', 'Buka': 'Expand', 'Ubah': 'Edit', 'Batalkan': 'Cancel', 'Hapus': 'Delete',
  'Referensi Tim IT dan Admin': 'IT Team and Admin reference', 'Workflow Kendaraan': 'Vehicle Workflow', 'Workflow Extra Meal': 'Extra Meal Workflow', 'Alur request kendaraan': 'Vehicle request flow', 'Alur request Extra Meal': 'Extra Meal request flow', 'Kontrol operasional flow': 'Flow operational controls', 'Batas perubahan': 'Change boundaries',
  'Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan.': 'Sorry, the page you are looking for does not exist or has been moved.', 'Kembali ke beranda': 'Back to home',
  'Tentukan jadwal penjemputan': 'Set the pickup schedule', 'Isi rute perjalanan': 'Enter the trip route', 'Lengkapi kebutuhan perjalanan': 'Complete trip requirements', 'Periksa dan kirim': 'Review and submit', 'Pilih periode acara': 'Select the event period', 'Jelaskan acara': 'Describe the event', 'Isi kebutuhan meal': 'Enter meal requirements',
  'Kolom mana yang wajib diisi?': 'Which fields are required?', 'Apa yang terjadi setelah request dikirim?': 'What happens after the request is submitted?', 'Mengapa request saya tidak terlihat?': 'Why is my request not visible?', 'Apakah request beberapa hari perlu dibuat berulang?': 'Do multi-day requests need to be created repeatedly?', 'Bagaimana jika data di ringkasan salah?': 'What if the summary data is incorrect?',
  'SharePoint ID': 'SharePoint ID', 'Title': 'Title', 'Nama Pemohon': 'Requester Name', 'Email Pemohon': 'Requester Email',
  'Tanggal': 'Date', 'Jam': 'Time', 'Detail Tujuan Lainnya': 'Other Destination Details', 'Jumlah Penumpang': 'Passenger Count', 'Titik Jemput': 'Pickup Point',
  'Status Saat Ini': 'Current Status', 'Keputusan Admin': 'Admin Decision', 'Catatan Admin': 'Admin Notes', 'Created Date': 'Created Date', 'Last Update': 'Last Update',
  'Nama Requester': 'Requester Name', 'Email Requester': 'Requester Email', 'Tujuan Acara': 'Event Purpose', 'Durasi Jam': 'Duration Hours', 'Kategori Meal': 'Meal Category',
  'Permintaan Tambahan': 'Additional Request', 'Waktu Request Dibuat': 'Request Created At',
  'Dashboard analitik operasional': 'Operational analytics dashboard', 'Ringkasan operasional': 'Operational summary', 'Diperbarui': 'Updated', 'Periode analitik': 'Analytics period',
  '7 hari terakhir': 'Last 7 days', '30 hari terakhir': 'Last 30 days', 'Bulan berjalan': 'Current month', 'Semua data': 'All data',
  'Distribusi status': 'Status distribution', 'Perlu perhatian': 'Needs attention', 'Tidak ada request aktif yang perlu perhatian.': 'No active requests need attention.',
  '{{count}} data kendaraan sesuai view berhasil diekspor.': '{{count}} vehicle records from the current view exported successfully.',
  '{{count}} record harian berhasil diekspor.': '{{count}} daily records exported successfully.',
};

function interpolate(value: string, variables?: Variables) {
  if (!variables) return value;
  return Object.entries(variables).reduce((result: string, [key, replacement]: [string, string | number]) => result.replaceAll(`{{${key}}}`, String(replacement)), value);
}

function translateText(value: string, language: Language) {
  if (language === 'id') return value;
  const leading = value.match(/^\s*/)?.[0] ?? '';
  const trailing = value.match(/\s*$/)?.[0] ?? '';
  const core = value.trim();
  return core ? `${leading}${english[core] ?? core}${trailing}` : value;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'id');
  const setLanguage = useCallback((next: Language) => { localStorage.setItem(STORAGE_KEY, next); setLanguageState(next); }, []);
  const t = useCallback((text: string, variables?: Variables) => interpolate(language === 'en' ? english[text] ?? text : text, variables), [language]);

  useEffect(() => {
    document.documentElement.lang = language;
    const translateNode = (root: Node) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        const parent = node.parentElement;
        if (parent && !parent.closest('[data-i18n-ignore]') && !['SCRIPT', 'STYLE', 'TEXTAREA'].includes(parent.tagName)) {
          const original = node.textContent ?? '';
          const stored = parent.dataset.i18nOriginal;
          if (language === 'en' && english[original.trim()]) { parent.dataset.i18nOriginal = original; node.textContent = translateText(original, language); }
          else if (language === 'id' && stored && parent.childNodes.length === 1) { node.textContent = stored; delete parent.dataset.i18nOriginal; }
        }
        node = walker.nextNode();
      }
      if (root instanceof Element || root instanceof Document) {
        root.querySelectorAll<HTMLElement>('[placeholder],[aria-label],[title]').forEach((element: HTMLElement) => {
          if (element.closest('[data-i18n-ignore]')) return;
          ['placeholder', 'aria-label', 'title'].forEach((attribute: string) => {
            const current = element.getAttribute(attribute);
            const key = `i18n${attribute.replace('-', '')}`;
            const original = element.dataset[key];
            if (language === 'en' && current && english[current]) { element.dataset[key] = current; element.setAttribute(attribute, english[current]); }
            else if (language === 'id' && original) { element.setAttribute(attribute, original); delete element.dataset[key]; }
          });
        });
      }
    };
    translateNode(document.body);
    const observer = new MutationObserver((mutations: MutationRecord[]) => mutations.forEach((mutation: MutationRecord) => mutation.addedNodes.forEach((node: Node) => translateNode(node))));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => ({ language, locale: language === 'id' ? 'id-ID' : 'en-US', setLanguage, t }), [language, setLanguage, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
}
