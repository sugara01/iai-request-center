import { ArrowDown, BellOff, CheckCircle2, Database, Mail, ShieldCheck, Workflow } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/lib/localization';

type WorkflowStep = {
  title: string;
  owner: string;
  description: string;
  result: string;
};

type GuideCopy = {
  eyebrow: string;
  intro: string;
  responsibilities: { title: string; description: string; icon: typeof Workflow }[];
  vehicleTitle: string;
  mealTitle: string;
  vehicleSteps: WorkflowStep[];
  mealSteps: WorkflowStep[];
  controlsTitle: string;
  controls: string[];
  notificationTitle: string;
  notificationBody: string;
  boundaryTitle: string;
  boundaryBody: string;
};

const guideCopy: Record<'id' | 'en', GuideCopy> = {
  id: {
    eyebrow: 'Referensi Tim IT dan Admin',
    intro: 'Alur approval dan pembagian tanggung jawab aplikasi untuk request Kendaraan dan Extra Meal.',
    responsibilities: [
      { title: 'IAI Request Center', icon: Workflow, description: 'Membuat request, menjalankan review dan approval berbasis peran, serta menampilkan progres dan catatan.' },
      { title: 'PostgreSQL', icon: Database, description: 'Menyimpan request, status approval, akses admin, dan jejak perubahan.' },
      { title: 'Notifikasi aplikasi', icon: Mail, description: 'Menampilkan antrean request yang perlu diproses admin. Integrasi email tidak diaktifkan.' },
    ],
    vehicleTitle: 'Alur request kendaraan',
    mealTitle: 'Alur request Extra Meal',
    vehicleSteps: [
      { title: 'Requester mengirim request', owner: 'Aplikasi', description: 'Form divalidasi dan satu record kendaraan disimpan di PostgreSQL.', result: 'Submitted' },
      { title: 'Ketersediaan diperiksa', owner: 'Admin Kendaraan', description: 'Keputusan Plant Director tetap read-only sampai Admin Kendaraan menyimpan keputusan. Available mengunci tahap Admin dan membuka tahap Plant Director; Not Available langsung menjadi penolakan final.', result: 'Rejected - Vehicle not available atau Pending Plant Director Approval' },
      { title: 'Persetujuan Plant Director', owner: 'Admin Kendaraan', description: 'Semua pengguna dengan akses Admin Kendaraan dapat menjalankan tahap Plant Director setelah keputusan Available tersimpan. Keputusan Approved atau Rejected mengunci kedua tahap.', result: 'Approved atau Rejected - Plant Director' },
      { title: 'Status final disampaikan', owner: 'Aplikasi', description: 'Keputusan akhir dan catatan approval disimpan di PostgreSQL serta dapat dilihat requester pada Dashboard Saya.', result: 'Approved atau Rejected' },
      { title: 'Status dipantau', owner: 'Aplikasi', description: 'Dashboard Saya menampilkan status serta catatan Admin dan Plant Director. Cancel hanya tersedia selama status Submitted.', result: 'PostgreSQL menjadi sumber data' },
    ],
    mealSteps: [
      { title: 'Requester mengirim request', owner: 'Aplikasi', description: 'Satu record dibuat untuk setiap tanggal layanan. Semua record memakai Request ID yang sama; hanya record pertama memiliki ApprovalTrigger.', result: 'Grup berstatus Submitted' },
      { title: 'Satu grup diproses', owner: 'Admin / Approver', description: 'Satu aksi approve, reject, koreksi, atau cancel diterapkan ke seluruh baris yang memiliki Request ID sama.', result: 'Satu keputusan untuk semua tanggal' },
      { title: 'Status grup diperbarui', owner: 'Aplikasi', description: 'Seluruh record harian dalam grup menerima hasil yang sama. Cancel hanya tersedia ketika seluruh record masih Submitted.', result: 'Approved, Rejected, atau Cancelled' },
      { title: 'Status final disampaikan', owner: 'Aplikasi', description: 'Requester melihat status grup, koreksi, dan catatan approval langsung pada aplikasi. Email tidak dikirim.', result: 'Status terlihat di Dashboard Saya' },
      { title: 'Grup dipantau', owner: 'Aplikasi', description: 'Dashboard dan Admin Extra Meal mengelompokkan semua tanggal berdasarkan Request ID agar satu request mudah ditinjau dan diaudit.', result: 'Satu ringkasan per Request ID' },
    ],
    controlsTitle: 'Kontrol operasional aplikasi',
    controls: [
      'Gunakan Request ID dan record ID database untuk menelusuri request.',
      'Perubahan status dan kuantitas dicatat pada audit log PostgreSQL.',
      'Untuk Extra Meal, satu pemicu approval mewakili seluruh tanggal dalam grup Request ID.',
      'Update outcome Extra Meal harus diterapkan ke seluruh record dengan Request ID yang sama.',
      'Approval dan notifikasi admin berjalan di dalam aplikasi; email belum dikonfigurasi.',
      'Akses demo hanya untuk pengembangan lokal dan harus diganti dengan autentikasi perusahaan sebelum deployment.',
    ],
    notificationTitle: 'Kebijakan notifikasi requester',
    notificationBody: 'Email tidak diaktifkan pada konfigurasi ini. Submitted, Pending Plant Director Approval, Approved, Rejected, koreksi, dan Cancelled dapat dipantau di dalam aplikasi.',
    boundaryTitle: 'Batas tanggung jawab',
    boundaryBody: 'Aplikasi mengelola input, tampilan progres, review berbasis peran, koreksi, status grup, aturan Cancel, dan catatan approval. PostgreSQL menyimpan seluruh request, akses admin, dan audit. Autentikasi demo lokal bukan untuk production.',
  },
  en: {
    eyebrow: 'IT Team and Admin reference',
    intro: 'The in-app approval flow and responsibilities for Vehicle and Extra Meal requests.',
    responsibilities: [
      { title: 'IAI Request Center', icon: Workflow, description: 'Creates requests, runs role-based review and approvals, and displays progress and notes.' },
      { title: 'PostgreSQL', icon: Database, description: 'Stores requests, approval statuses, admin access, and change history.' },
      { title: 'In-app notifications', icon: Mail, description: 'Shows admins the request queue. Email integration is not enabled.' },
    ],
    vehicleTitle: 'Vehicle request flow',
    mealTitle: 'Extra Meal request flow',
    vehicleSteps: [
      { title: 'Requester submits a request', owner: 'Application', description: 'The form is validated and one vehicle request is stored in PostgreSQL.', result: 'Submitted' },
      { title: 'Availability is reviewed', owner: 'Vehicle Admin', description: 'The Plant Director decision remains read-only until the Vehicle Admin saves a decision. Available locks the Admin stage and opens the Plant Director stage; Not Available is an immediate final rejection.', result: 'Rejected - Vehicle not available or Pending Plant Director Approval' },
      { title: 'Plant Director approval', owner: 'Vehicle Admin', description: 'Any user with Vehicle Admin access can perform the Plant Director stage after Available is saved. An Approved or Rejected decision locks both stages.', result: 'Approved or Rejected - Plant Director' },
      { title: 'Final status is communicated', owner: 'Application', description: 'The final decision and notes are stored in PostgreSQL and shown to the requester on My Dashboard.', result: 'Approved or Rejected' },
      { title: 'Status is tracked', owner: 'Application', description: 'My Dashboard shows the status and Admin and Plant Director notes. Cancel is available only while Submitted.', result: 'PostgreSQL is the data source' },
    ],
    mealSteps: [
      { title: 'Requester submits a request', owner: 'Application', description: 'One record is created per service date. All records share one Request ID; only the first record has ApprovalTrigger enabled.', result: 'Group status is Submitted' },
      { title: 'One group is processed', owner: 'Admin / Approver', description: 'One approve, reject, correction, or cancel action applies to every row sharing the same Request ID.', result: 'One decision for all dates' },
      { title: 'Group status is updated', owner: 'Application', description: 'Every daily record receives the same result. Cancel is available only while every record is Submitted.', result: 'Approved, Rejected, or Cancelled' },
      { title: 'Final status is communicated', owner: 'Application', description: 'Requesters can see the group status, corrections, and approval notes in the app. No email is sent.', result: 'Status shown on My Dashboard' },
      { title: 'Group is tracked', owner: 'Application', description: 'The dashboard and Extra Meal Admin group all dates by Request ID for efficient review and audit.', result: 'One summary per Request ID' },
    ],
    controlsTitle: 'Application operational controls',
    controls: [
      'Use the Request ID and database record ID to trace requests.',
      'Status and quantity changes are recorded in the PostgreSQL audit log.',
      'For Extra Meal, one approval trigger represents every service date in the Request ID group.',
      'Apply Extra Meal outcomes to every record sharing the same Request ID.',
      'Approvals and admin notifications run in the application; email is not configured.',
      'Local demo sign-in is for development only and must be replaced before deployment.',
    ],
    notificationTitle: 'Requester notification policy',
    notificationBody: 'Email is not enabled in this configuration. Submitted, Pending Plant Director Approval, Approved, Rejected, corrections, and Cancelled remain visible in the application.',
    boundaryTitle: 'Responsibility boundary',
    boundaryBody: 'The application owns input, progress display, role-based review, corrections, group status, Cancel rules, and approval notes. PostgreSQL stores requests, admin access, and audit data. Local demo authentication is not for production.',
  },
};

function WorkflowTimeline({ steps }: { steps: WorkflowStep[] }) {
  return (
    <div className="space-y-0">
      {steps.map((step: WorkflowStep, index: number) => (
        <div key={step.title}>
          <div className="grid gap-4 rounded-lg border bg-card p-4 text-card-foreground md:grid-cols-[44px_1fr_auto] md:items-start">
            <div className="grid size-10 place-items-center rounded-full bg-primary font-semibold text-primary-foreground">{index + 1}</div>
            <div>
              <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{step.title}</h3><Badge variant="secondary">{step.owner}</Badge></div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
            </div>
            <div className="rounded-md bg-muted px-3 py-2 text-sm font-medium text-muted-foreground md:max-w-72">{step.result}</div>
          </div>
          {index < steps.length - 1 && <div className="flex h-8 items-center pl-5"><ArrowDown className="size-4 text-foreground" aria-hidden="true" /></div>}
        </div>
      ))}
    </div>
  );
}

export default function PowerAutomateGuidePage() {
  const { language } = useLanguage();
  const copy = guideCopy[language];

  return (
    <div className="p-6 lg:p-8">
      <header className="max-w-4xl">
        <p className="text-sm text-muted-foreground">{copy.eyebrow}</p>
        <h1 className="mt-1 text-2xl font-bold">{language === 'id' ? 'Workflow Request' : 'Request Workflow'}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.intro}</p>
      </header>

      <Card className="mt-6 border-l-4 border-l-primary">
        <CardContent className="grid gap-4 p-5 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center">
          {copy.responsibilities.map(({ title, icon: Icon, description }, index: number) => (
            <div className="contents" key={title}>
              <div className="flex gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground"><Icon className="size-5" /></div>
                <div><p className="font-semibold">{title}</p><p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p></div>
              </div>
              {index < copy.responsibilities.length - 1 && <ArrowDown className="hidden size-5 -rotate-90 text-foreground lg:block" aria-hidden="true" />}
            </div>
          ))}
        </CardContent>
      </Card>

      <Tabs defaultValue="kendaraan" className="mt-6">
        <TabsList className="grid w-full max-w-lg grid-cols-2">
          <TabsTrigger value="kendaraan">{language === 'id' ? 'Workflow Kendaraan' : 'Vehicle Workflow'}</TabsTrigger>
          <TabsTrigger value="extra-meal">{language === 'id' ? 'Workflow Extra Meal' : 'Extra Meal Workflow'}</TabsTrigger>
        </TabsList>
        <TabsContent value="kendaraan" className="mt-5"><Card><CardHeader><CardTitle>{copy.vehicleTitle}</CardTitle></CardHeader><CardContent><WorkflowTimeline steps={copy.vehicleSteps} /></CardContent></Card></TabsContent>
        <TabsContent value="extra-meal" className="mt-5"><Card><CardHeader><CardTitle>{copy.mealTitle}</CardTitle></CardHeader><CardContent><WorkflowTimeline steps={copy.mealSteps} /></CardContent></Card></TabsContent>
      </Tabs>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{copy.controlsTitle}</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            {copy.controls.map((item: string) => <div key={item} className="flex items-start gap-3 rounded-lg bg-muted p-3 text-sm text-muted-foreground"><CheckCircle2 className="mt-0.5 size-5 shrink-0" /><span>{item}</span></div>)}
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card className="border-l-4 border-l-accent-foreground"><CardContent className="flex gap-4 p-5"><div className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground"><BellOff className="size-5" /></div><div><p className="font-semibold">{copy.notificationTitle}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{copy.notificationBody}</p></div></CardContent></Card>
          <Card><CardContent className="flex gap-4 p-5"><div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"><ShieldCheck className="size-5" /></div><div><p className="font-semibold">{copy.boundaryTitle}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{copy.boundaryBody}</p></div></CardContent></Card>
        </div>
      </div>
    </div>
  );
}
