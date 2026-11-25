import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { IGetAllOptions } from '@/generated/models/CommonModels';
import type { RequestKendaraan } from '@/generated/models/request-kendaraan-model';
import { apiRequest } from '@/lib/api';

type VehicleRequestCreateInput = Omit<RequestKendaraan, 'id' | 'title'>;
type VehicleRequestUpdateInput = Partial<Omit<RequestKendaraan, 'id'>>;
const queryKey = ['requestKendaraanApps-list'] as const;

export function useVehicleRequests(_options?: IGetAllOptions, enabled = true) {
  return useQuery({
    queryKey,
    enabled,
    queryFn: () => apiRequest<RequestKendaraan[]>('/vehicle-requests'),
    staleTime: 5 * 60 * 1000,
    refetchInterval: () => document.visibilityState === 'visible' ? 15_000 : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
    retry: 3,
    retryDelay: (attempt: number) => 500 * 2 ** attempt,
  });
}

export function useCreateVehicleRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: VehicleRequestCreateInput) => apiRequest<RequestKendaraan>('/vehicle-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey }),
  });
}

export function useUpdateVehicleRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changedFields }: { id: string; changedFields: VehicleRequestUpdateInput }) =>
      apiRequest<RequestKendaraan>(`/vehicle-requests/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(changedFields),
      }),
    onSuccess: (_data: RequestKendaraan, variables: { id: string; changedFields: VehicleRequestUpdateInput }) => {
      void queryClient.invalidateQueries({ queryKey });
      void queryClient.invalidateQueries({ queryKey: ['requestKendaraanApps', variables.id] });
    },
  });
}

export function useDeleteVehicleRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiRequest<void>(`/vehicle-requests/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey }),
  });
}
