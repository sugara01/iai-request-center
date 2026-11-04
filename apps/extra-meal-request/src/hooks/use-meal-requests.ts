import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { initialize } from '@microsoft/power-apps/app';
import type { ExtraMealReqRead, ExtraMealReqWrite } from '@/generated/models/ExtraMealReqModel';
import { ExtraMealReqService } from '@/generated/services/ExtraMealReqService';
import { compareNewestSharePointDate, fromSharePointDateOnly, toSharePointDateOnly } from '@/lib/sharepoint-date';
import type { MealRequest } from '@/lib/meal-store';

const queryKey = ['extraMealReq-list'] as const;

type MealRequestCreateInput = Omit<MealRequest, 'reminderAt'>;

function mapRecord(record: ExtraMealReqRead): MealRequest {
  return {
    sharePointId: record.ID,
    id: record.RequestID ?? record.Title ?? '',
    recordId: record.RecordID ?? String(record.ID ?? ''),
    serviceDate: fromSharePointDateOnly(record.ServiceDate) ?? '',
    requester: record.RequesterName ?? '',
    requesterEmail: record.RequesterEmail ?? '',
    department: record.Department ?? '',
    purpose: record.Purpose ?? '',
    startDate: fromSharePointDateOnly(record.StartDate) ?? '',
    endDate: fromSharePointDateOnly(record.EndDate) ?? '',
    durationHours: record.DurationHours,
    mealCategory: record.MealCategory ?? '',
    quantity: record.Quantity ?? 0,
    additional: record.AdditionalRequest ?? '',
    status: record.CurrentStatus === 'Approved' || record.CurrentStatus === 'Rejected' || record.CurrentStatus === 'Cancelled' ? record.CurrentStatus : 'Submitted',
    createdAt: record.RequestCreatedAt ?? '',
    approvalTrigger: Boolean(record.ApprovalTrigger),
  };
}

function toRecord(request: MealRequestCreateInput): Omit<ExtraMealReqWrite, 'ID'> {
  return {
    Title: request.id,
    RequestID: request.id,
    RecordID: request.recordId,
    ServiceDate: toSharePointDateOnly(request.serviceDate),
    RequesterName: request.requester,
    RequesterEmail: request.requesterEmail,
    Department: request.department,
    Purpose: request.purpose,
    StartDate: toSharePointDateOnly(request.startDate),
    EndDate: toSharePointDateOnly(request.endDate),
    DurationHours: request.durationHours,
    MealCategory: request.mealCategory,
    Quantity: request.quantity,
    AdditionalRequest: request.additional,
    CurrentStatus: request.status,
    ApprovalTrigger: request.approvalTrigger,
    RequestCreatedAt: request.createdAt,
  };
}

export function useMealRequests(enabled = true) {
  return useQuery({
    queryKey,
    enabled,
    queryFn: async () => {
      await initialize();
      const result = await ExtraMealReqService.getAll({ orderBy: ['RequestCreatedAt desc'] });
      if (!result.success) throw result.error;
      return result.data
        .map((record: ExtraMealReqRead) => mapRecord(record))
        .sort((a: MealRequest, b: MealRequest) =>
          compareNewestSharePointDate(a.createdAt, b.createdAt, a.sharePointId ?? a.recordId, b.sharePointId ?? b.recordId),
        );
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: () => document.visibilityState === 'visible' ? 15_000 : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
    retry: 3,
    retryDelay: (attempt: number) => 500 * 2 ** attempt,
  });
}

export function useCreateMealRequests() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (requests: MealRequestCreateInput[]) => {
      await initialize();
      const created: ExtraMealReqRead[] = [];
      for (const request of requests) {
        const result = await ExtraMealReqService.create(toRecord(request));
        if (!result.success) throw result.error;
        created.push(result.data);
      }
      return created.map((record: ExtraMealReqRead) => mapRecord(record));
    },
    onSuccess: (created: MealRequest[]) => {
      client.setQueryData<MealRequest[]>(queryKey, (current: MealRequest[] | undefined) => {
        const createdRecordIds = new Set(created.map((record: MealRequest) => record.recordId));
        return [...created, ...(current ?? []).filter((record: MealRequest) => !createdRecordIds.has(record.recordId))].sort(
          (a: MealRequest, b: MealRequest) => compareNewestSharePointDate(
            a.createdAt,
            b.createdAt,
            a.sharePointId ?? a.recordId,
            b.sharePointId ?? b.recordId,
          ),
        );
      });
      void client.invalidateQueries({ queryKey });
    },
  });
}

export function useUpdateMealRequestGroup() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ records, status }: { records: MealRequest[]; status: MealRequest['status'] }) => {
      await initialize();
      const targets = records.filter((record: MealRequest) => record.sharePointId !== undefined);
      if (targets.length !== records.length || targets.length === 0) throw new Error('Grup request tidak memiliki SharePoint ID yang lengkap.');
      return Promise.all(targets.map(async (record: MealRequest) => {
        const result = await ExtraMealReqService.update(String(record.sharePointId), { CurrentStatus: status });
        if (!result.success) throw result.error;
        return result.data;
      }));
    },
    onSettled: () => void client.invalidateQueries({ queryKey }),
  });
}

export function useUpdateMealRequestQuantity() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ record, quantity }: { record: MealRequest; quantity: number }) => {
      if (quantity < 1) throw new Error('Qty meal minimal 1.');
      if (record.sharePointId === undefined) throw new Error('Record tidak memiliki SharePoint ID dan tidak dapat diperbarui.');
      await initialize();
      const result = await ExtraMealReqService.update(String(record.sharePointId), { Quantity: quantity });
      if (!result.success) throw result.error;
      return result.data;
    },
    onSettled: () => void client.invalidateQueries({ queryKey }),
  });
}

export function useCancelMealRequestGroup() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (records: MealRequest[]) => {
      if (records.length === 0 || records.some((record: MealRequest) => record.status !== 'Submitted')) {
        throw new Error('Cancel hanya tersedia saat seluruh request masih diproses.');
      }
      await initialize();
      const targets = records.filter((record: MealRequest) => record.sharePointId !== undefined);
      if (targets.length !== records.length) throw new Error('Grup request tidak memiliki SharePoint ID yang lengkap.');
      return Promise.all(targets.map(async (record: MealRequest) => {
        const result = await ExtraMealReqService.update(String(record.sharePointId), { CurrentStatus: 'Cancelled' });
        if (!result.success) throw result.error;
        return result.data;
      }));
    },
    onSettled: () => void client.invalidateQueries({ queryKey }),
  });
}

export function useDeleteMealRequest() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await initialize();
      await ExtraMealReqService.delete(String(id));
    },
    onSuccess: () => void client.invalidateQueries({ queryKey }),
  });
}
