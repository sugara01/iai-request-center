import { CircleCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/lib/localization';

type ApprovalStatusCardProps = {
  description: string;
};

export function ApprovalStatusCard({ description }: ApprovalStatusCardProps) {
  const { t } = useLanguage();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('Status approval')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
            <CircleCheck className="size-5" />
          </div>
          <div>
            <p className="font-medium">{t('Request submitted')}</p>
            <p className="text-sm leading-6 text-muted-foreground">{t(description)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
