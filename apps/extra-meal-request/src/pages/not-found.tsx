import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/localization';

export default function NotFoundPage() {
  const { t } = useLanguage();
  return (
    <div className="flex items-center justify-center p-8">
      <div className="max-w-md text-center">
        <p className="text-6xl font-bold text-muted-foreground">404</p>
        <h1 className="mt-4 text-2xl font-semibold">{t('Halaman tidak ditemukan')}</h1>
        <p className="mt-2 text-muted-foreground">{t('Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan.')}</p>
        <Button className="mt-8" asChild><Link to="/">{t('Kembali ke beranda')}</Link></Button>
      </div>
    </div>
  );
}
