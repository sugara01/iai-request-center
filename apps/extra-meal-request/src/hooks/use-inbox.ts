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
  eventType: 'request_assigned' | 'request_submitted' | 'request_approved' | 'request_rejected' | 'password_changed' | 'password_reset';
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdAt: string;
  readAt?: string;
};

export type NotificationStatusFilter = 'all' | 'unread' | 'read';
export type NotificationTypeFilter = 'all' | 'vehicle' | 'meal' | 'system';
type NotificationsResponse = {
  items: UserNotification[];
  unreadCount: number;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
type NotificationsParams = {
  page?: number;
  pageSize?: number;
  status?: NotificationStatusFilter;
  type?: NotificationTypeFilter;
};

const approvalsKey = ['inbox-approvals'] as const;
const notificationsKey = ['user-notifications'] as const;

function getRequestTypeLabel(
  notification: UserNotification,
  t: (key: string, values?: Record<string, string | number>) => string,
) {
  return t(notification.relatedEntityType === 'vehicle_request' ? 'Request Kendaraan' : 'Request Extra Meal');
}

export function getNotificationTitle(
  notification: UserNotification,
  t: (key: string, values?: Record<string, string | number>) => string,
) {
  if (notification.eventType === 'request_assigned') {
    return t('{{requestType}} baru untuk ditinjau', { requestType: getRequestTypeLabel(notification, t) });
  }
  if (notification.eventType === 'request_submitted') return t('{{requestType}} dikirim', { requestType: getRequestTypeLabel(notification, t) });
  if (notification.eventType === 'request_approved') return t('{{requestType}} disetujui', { requestType: getRequestTypeLabel(notification, t) });
  if (notification.eventType === 'request_rejected') return t('{{requestType}} ditolak', { requestType: getRequestTypeLabel(notification, t) });
  if (notification.eventType === 'password_changed') return t('Password Diubah');
  return t('Password Direset');
}

export function getNotificationText(
  notification: UserNotification,
  t: (key: string, values?: Record<string, string | number>) => string,
) {
  if (notification.eventType === 'password_changed') return t('Password akun Anda berhasil diubah.');
  if (notification.eventType === 'password_reset') return t('Password akun Anda telah direset. Silakan masuk dan ubah password.');

  const values = {
    requestId: notification.relatedEntityId ?? '',
    requestType: getRequestTypeLabel(notification, t),
  };
  if (notification.eventType === 'request_assigned') return t('{{requestType}} {{requestId}} menunggu peninjauan.', values);
  if (notification.eventType === 'request_submitted') return t('{{requestType}} {{requestId}} berhasil dikirim.', values);
  if (notification.eventType === 'request_approved') return t('{{requestType}} {{requestId}} telah disetujui.', values);
  return t('{{requestType}} {{requestId}} telah ditolak.', values);
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

export function useUserNotifications(params: NotificationsParams = {}) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const status = params.status ?? 'all';
  const type = params.type ?? 'all';
  const queryParams = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    status,
    type,
  });
  return useQuery({
    queryKey: [...notificationsKey, page, pageSize, status, type],
    queryFn: () => apiRequest<NotificationsResponse>(`/notifications?${queryParams.toString()}`),
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
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notificationsKey });
      const previousQueries = queryClient.getQueriesData<NotificationsResponse>({ queryKey: notificationsKey });
      queryClient.setQueriesData<NotificationsResponse>({ queryKey: notificationsKey }, (previousData) => {
        if (!previousData) return previousData;
        const notification = previousData.items.find((item) => item.id === id);
        if (!notification || notification.readAt) return previousData;
        return {
          ...previousData,
          items: previousData.items.map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item),
          unreadCount: Math.max(0, previousData.unreadCount - 1),
        };
      });
      return { previousQueries };
    },
    onError: (_error, _id, context) => {
      context?.previousQueries.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: notificationsKey }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest('/notifications/read-all', { method: 'POST' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: notificationsKey }),
  });
}

export function useMarkSelectedNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => apiRequest('/notifications/read-selected', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: notificationsKey }),
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiRequest(`/notifications/${id}`, { method: 'DELETE' }),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: notificationsKey }),
  });
}

export function useDeleteSelectedNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => apiRequest('/notifications/delete-selected', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: notificationsKey }),
  });
}
