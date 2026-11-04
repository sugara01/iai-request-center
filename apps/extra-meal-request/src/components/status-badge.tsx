import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/lib/localization';

export function StatusBadge({ status }: { status: string }) {
  const { t } = useLanguage();
  const isRejected = status.includes('Rejected') || status === 'Cancelled';
  const variant = isRejected ? 'destructive' : status === 'Approved' ? 'default' : 'secondary';
  return <Badge variant={variant}>{t(status)}</Badge>;
}
