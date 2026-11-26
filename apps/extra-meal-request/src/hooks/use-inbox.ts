import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

export type InboxApproval = {
  key: string;
  requestId: string;
  type: 'vehicle' | 'meal';
  requester: string;
  requestDate: string;
  currentStatus: string;
  actionStage: 'vehicle_availability' | 'plant_director' | 'meal_review';
  vehicleId?: number;
};

export type UserNotification = {
  id: number;
  eventType: 'request_assigned' | 'request_approved' | 'request_rejected' | 'password_reset';
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdAt: string;
  readAt?: string;
};

type NotificationsResponse = { items: UserNotification[]; unreadCount: number };

const approvalsKey = ['inbox-approvals'] as const;
const notificationsKey = ['user-notifications'] as const;

export function getNotificationText(
  notification: UserNotification,
  t: (key: string, values?: Record<string, string | number>) => string,
) {
  const values = { requestId: notification.relatedEntityId ?? '' };
  if (notification.eventType === 'request_assigned') return t('Request {{requestId}} baru ditugaskan untuk ditinjau.', values);
  if (notification.eventType === 'request_approved') return t('Request {{requestId}} telah disetujui.', values);
  if (notification.eventType === 'request_rejected') return t('Request {{requestId}} telah ditolak.', values);
  return t('Password akun Anda telah direset. Silakan masuk dan ubah password.');
}

export function useInboxApprovals(enabled = true) {
  return useQuery({
    queryKey: approvalsKey,
    enabled,
    queryFn: () => apiRequest<InboxApproval[]>('/inbox/approvals'),
    staleTime: 15_000,
    refetchInterval: () => document.visibilityState === 'visible' ? 30_000 : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
  });
}

export function useUserNotifications() {
  return useQuery({
    queryKey: notificationsKey,
    queryFn: () => apiRequest<NotificationsResponse>('/notifications'),
    staleTime: 15_000,
    refetchInterval: () => document.visibilityState === 'visible' ? 30_000 : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
  });
}

export function useResolveInboxApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ approval, decision }: { approval: InboxApproval; decision: 'approve' | 'reject' }) => {
      if (approval.type === 'vehicle') {
        if (!approval.vehicleId) throw new Error('Vehicle request ID is missing.');
        const changedFields = approval.actionStage === 'vehicle_availability'
          ? { adminDecisionKey: decision === 'approve' ? 'Available' : 'NotAvailable' }
          : { plantDirectorDecisionKey: decision === 'approve' ? 'Approved' : 'Rejected' };
        return apiRequest(`/vehicle-requests/${approval.vehicleId}`, {
          method: 'PATCH',
          body: JSON.stringify(changedFields),
        });
      }

      return apiRequest(`/meal-requests/${encodeURIComponent(approval.requestId)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: decision === 'approve' ? 'Approved' : 'Rejected', requirePending: true }),
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: approvalsKey });
      void queryClient.invalidateQueries({ queryKey: notificationsKey });
      void queryClient.invalidateQueries({ queryKey: ['requestKendaraanApps-list'] });
      void queryClient.invalidateQueries({ queryKey: ['extraMealReq-list'] });
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: notificationsKey }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest('/notifications/read-all', { method: 'POST' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: notificationsKey }),
  });
}
