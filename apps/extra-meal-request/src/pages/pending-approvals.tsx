import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/hooks/use-user';
import { useInboxApprovals, useResolveInboxApproval, type InboxApproval } from '@/hooks/use-inbox';
import { useLanguage } from '@/lib/localization';

type PendingDecision = { approval: InboxApproval; decision: 'approve' | 'reject'; note: string };

function formatRequestDate(value: string, locale: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function statusLabel(status: string, t: (key: string) => string) {
  if (status === 'Mixed') return t('Status campuran');
  return status === 'PendingPlantDirectorApproval' ? t('Pending Plant Director Approval') : status;
}

export default function PendingApprovalsPage() {
  const { t, locale } = useLanguage();
  const { data: user, isPending: isUserPending } = useUser();
  const canApproveVehicle = user?.isVehicleAdmin ?? false;
  const canApproveMeal = user?.isMealAdmin ?? false;
  const hasApprovalRights = canApproveVehicle || canApproveMeal;
  const { data: approvals = [], isPending, isError, error, refetch, isFetching } = useInboxApprovals(hasApprovalRights);
  const resolveApproval = useResolveInboxApproval();
  const [decision, setDecision] = useState<PendingDecision>();

  async function confirmDecision() {
    if (!decision) return;
    if (!decision.note.trim()) {
      toast.error(decision.approval.actionStage === 'plant_director'
        ? t('Catatan Plant Director wajib diisi.')
        : t('Catatan Admin Kendaraan wajib diisi.'));
      return;
    }
    try {
      await resolveApproval.mutateAsync(decision);
      toast.success(decision.decision === 'approve' ? t('Approval berhasil disimpan.') : t('Request berhasil ditolak.'));
      setDecision(undefined);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Tindakan approval gagal.'));
    }
  }

  if (isUserPending) return <div className="space-y-3 p-6 lg:p-8"><Skeleton className="h-8 w-64" /><Skeleton className="h-40 w-full" /></div>;

  if (!hasApprovalRights) {
    return <div className="p-6 lg:p-8"><h1 className="text-2xl font-bold">{t('Pending Approvals')}</h1><p className="mt-2 text-sm text-muted-foreground">{t('Akun Anda tidak memiliki izin untuk melihat antrean approval.')}</p><Button className="mt-4" variant="outline" asChild><Link to="/">{t('Kembali ke Dashboard')}</Link></Button></div>;
  }

  return (
    <div className="p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{t('Inbox')}</p>
          <h1 className="mt-1 text-2xl font-bold">{t('Pending Approvals')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('{{count}} request memerlukan tindakan Anda.', { count: approvals.length })}</p>
        </div>
        <Button variant="outline" onClick={() => void refetch()} disabled={isFetching}>
          <RefreshCw className={isFetching ? 'animate-spin' : ''} />{t('Refresh')}
        </Button>
      </header>

      <Card className="mt-6">
        <CardHeader><CardTitle>{t('Permintaan yang memerlukan tindakan')}</CardTitle></CardHeader>
        <CardContent>
          {isError ? (
            <div className="rounded-lg border border-destructive p-4 text-sm" role="alert">
              <p className="font-medium">{t('Antrean approval gagal dimuat.')}</p>
              <p className="mt-1 text-muted-foreground">{error instanceof Error ? error.message : t('Silakan coba lagi.')}</p>
            </div>
          ) : isPending ? (
            <div className="space-y-3" aria-hidden="true"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
          ) : approvals.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">{t('Tidak ada request yang memerlukan tindakan.')}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[900px]">
                <TableHeader><TableRow><TableHead>Request ID</TableHead><TableHead>{t('Jenis request')}</TableHead><TableHead>{t('Requester')}</TableHead><TableHead>{t('Tanggal request')}</TableHead><TableHead>{t('Status saat ini')}</TableHead><TableHead>{t('Tindakan yang diperlukan')}</TableHead><TableHead className="text-right">{t('Tindakan')}</TableHead></TableRow></TableHeader>
                <TableBody>
                  {approvals.map((approval: InboxApproval) => (
                    <TableRow key={approval.key}>
                      <TableCell className="font-medium">{approval.requestId}</TableCell>
                      <TableCell>{approval.type === 'vehicle' ? t('Kendaraan') : t('Extra Meal')}</TableCell>
                      <TableCell>{approval.requester}</TableCell>
                      <TableCell>{formatRequestDate(approval.requestDate, locale)}</TableCell>
                      <TableCell><Badge variant={approval.currentStatus === 'Mixed' ? 'outline' : 'secondary'}>{statusLabel(approval.currentStatus, t)}</Badge></TableCell>
                      <TableCell>{approval.actionStage === 'vehicle_availability' ? t('Tentukan ketersediaan kendaraan') : approval.actionStage === 'plant_director' ? t('Keputusan Plant Director') : t('Tinjau grup Extra Meal')}</TableCell>
                      <TableCell><div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" asChild><Link to={`${approval.type === 'vehicle' ? '/admin-kendaraan' : '/admin-meal'}?request=${encodeURIComponent(approval.requestId)}`}><ExternalLink />{t('Buka request')}</Link></Button>
                        <Button size="sm" disabled={resolveApproval.isPending} onClick={() => setDecision({ approval, decision: 'approve', note: '' })}>{t('Approve')}</Button>
                        <Button size="sm" variant="destructive" disabled={resolveApproval.isPending} onClick={() => setDecision({ approval, decision: 'reject', note: '' })}>{t('Reject')}</Button>
                      </div></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={Boolean(decision)} onOpenChange={(open: boolean) => !open && setDecision(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{decision?.decision === 'approve' ? t('Konfirmasi approval') : t('Konfirmasi penolakan')}</AlertDialogTitle>
            <AlertDialogDescription>
              {decision
                ? decision.approval.type === 'vehicle'
                  ? decision.approval.actionStage === 'vehicle_availability'
                    ? decision.decision === 'approve'
                      ? t('Vehicle Admin Decision: Available')
                      : t('Vehicle Admin Decision: Not Available')
                    : decision.decision === 'approve'
                      ? t('Plant Director Decision: Approved')
                      : t('Plant Director Decision: Rejected')
                  : t(
                      decision.decision === 'approve' ? 'Anda akan menyetujui request {{requestId}}.' : 'Anda akan menolak request {{requestId}}.',
                      { requestId: decision.approval.requestId },
                    )
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {decision?.approval.type === 'vehicle' && (
            <div className="space-y-2 px-6">
              <label className="text-sm font-medium">
                {decision.approval.actionStage === 'plant_director'
                  ? t('Plant Director Notes')
                  : t('Admin Notes')}
              </label>
              <Textarea
                value={decision.note}
                onChange={(event) => setDecision({ ...decision, note: event.target.value })}
                required
                maxLength={2000}
                placeholder={decision.approval.actionStage === 'plant_director'
                  ? t('Masukkan Catatan Plant Director')
                  : t('Masukkan Catatan Admin')}
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Batal')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={resolveApproval.isPending || Boolean(decision?.approval.type === 'vehicle' && !decision.note.trim())}
              onClick={(event) => { event.preventDefault(); void confirmDecision(); }}
            >
              {resolveApproval.isPending ? t('Menyimpan...') : t('Konfirmasi')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
