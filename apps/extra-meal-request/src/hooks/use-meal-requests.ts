import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type { MealRequest } from '@/lib/meal-store';

const queryKey = ['extraMealReq-list'] as const;
type MealRequestCreateInput = Omit<MealRequest, 'reminderAt' | 'sharePointId'>;

export function useMealRequests(enabled = true) {
  return useQuery({
    queryKey,
    enabled,
    queryFn: () => apiRequest<MealRequest[]>('/meal-requests'),
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
    mutationFn: (requests: MealRequestCreateInput[]) => apiRequest<MealRequest[]>('/meal-requests', {
      method: 'POST',
      body: JSON.stringify(requests),
    }),
    onSuccess: (created: MealRequest[]) => {
      client.setQueryData<MealRequest[]>(queryKey, (current: MealRequest[] | undefined) => [
        ...created,
        ...(current ?? []).filter((record: MealRequest) =>
          !created.some((newRecord: MealRequest) => newRecord.recordId === record.recordId),
        ),
      ]);
      void client.invalidateQueries({ queryKey });
    },
  });
}

export function useUpdateMealRequestGroup() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ records, status }: { records: MealRequest[]; status: MealRequest['status'] }) => {
      const requestId = records[0]?.id;
      if (!requestId || records.some((record: MealRequest) => record.id !== requestId)) {
        throw new Error('Pilih record dari satu grup request yang valid.');
      }
      return apiRequest<MealRequest[]>(`/meal-requests/${encodeURIComponent(requestId)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
    onSettled: () => void client.invalidateQueries({ queryKey }),
  });
}

export function useUpdateMealRequestQuantity() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ record, quantity }: { record: MealRequest; quantity: number }) => {
      if (!Number.isInteger(quantity) || quantity < 1) throw new Error('Qty meal minimal 1.');
      return apiRequest<MealRequest>(`/meal-requests/${encodeURIComponent(record.id)}/quantity`, {
        method: 'PATCH',
        body: JSON.stringify({ recordId: record.recordId, quantity }),
      });
    },
    onSettled: () => void client.invalidateQueries({ queryKey }),
  });
}

export function useCancelMealRequestGroup() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (records: MealRequest[]) => {
      const requestId = records[0]?.id;
      if (!requestId || records.length === 0 || records.some((record: MealRequest) => record.id !== requestId || record.status !== 'Submitted')) {
        throw new Error('Cancel hanya tersedia untuk grup yang seluruhnya berstatus Submitted.');
      }
      return apiRequest<MealRequest[]>(`/meal-requests/${encodeURIComponent(requestId)}/cancel`, {
        method: 'POST',
      });
    },
    onSettled: () => void client.invalidateQueries({ queryKey }),
  });
}

export function useDeleteMealRequest() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiRequest<void>(`/meal-records/${id}`, { method: 'DELETE' }),
    onSuccess: () => void client.invalidateQueries({ queryKey }),
  });
}
