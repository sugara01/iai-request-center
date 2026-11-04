import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CarFront, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const requestTypes = [
  { title: 'Request Kendaraan', description: 'Ajukan kendaraan untuk business trip dan perjalanan dinas.', icon: CarFront, to: '/request-kendaraan', detail: 'Jadwal, tujuan, titik jemput, dan penumpang' },
  { title: 'Request Extra Meal', description: 'Ajukan kebutuhan meal tambahan untuk kegiatan operasional.', icon: UtensilsCrossed, to: '/request-extra-meal', detail: 'Rentang acara, kategori meal, dan kuantitas' },
];

export default function RequestCenterPage() {
  return <div className="p-6 lg:p-8"><header><Button variant="outline" size="sm" className="mb-5" asChild><Link to="/" aria-label="Kembali ke dashboard"><ArrowLeft />Kembali ke dashboard</Link></Button><p className="text-sm text-muted-foreground">Layanan requester</p><h1 className="mt-1 text-2xl font-bold">Buat request</h1><p className="mt-1 text-sm text-muted-foreground">Pilih layanan yang dibutuhkan. Jenis request lain akan ditambahkan bertahap.</p></header><div className="mt-6 grid gap-5 lg:grid-cols-2">{requestTypes.map(({ title, description, icon: Icon, to, detail }: typeof requestTypes[number]) => <Card key={title} className="border-l-4 border-l-primary"><CardHeader><div className="flex items-start justify-between gap-4"><div className="grid size-12 place-items-center rounded-xl bg-accent text-accent-foreground"><Icon className="size-6" /></div><span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">Tersedia</span></div><CardTitle className="pt-3">{title}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{description}</p><p className="mt-4 text-sm font-medium">{detail}</p><Button className="mt-5 w-full" asChild><Link to={to}>Mulai request<ArrowRight /></Link></Button></CardContent></Card>)}</div></div>;
}
