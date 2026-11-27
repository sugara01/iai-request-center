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
  eventType: 'request_assigned' | 'request_submitted' | 'request_approved' | 'request_rejected' | 'vehicle_available' | 'vehicle_not_available' | 'password_changed' | 'password_reset';
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata?: Record<string, unknown>;
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
  if (notification.eventType === 'vehicle_available') return t('Kendaraan tersedia');
  if (notification.eventType === 'vehicle_not_available') return t('Kendaraan tidak tersedia');
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

  const metadata = notification.metadata ?? {};
  const values = {
    requestId: notification.relatedEntityId ?? '',
    requestType: getRequestTypeLabel(notification, t),
  };
  if (notification.eventType === 'request_submitted') {
    return t('Request: {{requestId}}\nStatus: {{status}}', {
      requestId: notification.relatedEntityId ?? '',
      status: String(metadata.status ?? 'Submitted'),
    });
  }
  if (notification.eventType === 'vehicle_available') {
    return t('Request: {{requestId}}\nStatus: Pending Plant Director Approval\nKeputusan Admin: Available\nCatatan Admin: {{note}}', {
      requestId: notification.relatedEntityId ?? '',
      note: String(metadata.adminNote ?? '-'),
    });
  }
  if (notification.eventType === 'vehicle_not_available') {
    return t('Request: {{requestId}}\nStatus: Rejected - Vehicle Not Available\nKeputusan Admin: Not Available\nCatatan Admin: {{note}}', {
      requestId: notification.relatedEntityId ?? '',
      note: String(metadata.adminNote ?? '-'),
    });
  }
  if (notification.eventType === 'request_approved' && notification.relatedEntityType === 'vehicle_request') {
    return t('Request: {{requestId}}\nStatus: Approved\nCatatan Plant Director: {{note}}', {
      requestId: notification.relatedEntityId ?? '',
      note: String(metadata.plantDirectorNote ?? '-'),
    });
  }
  if (notification.eventType === 'request_rejected' && notification.relatedEntityType === 'vehicle_request') {
    return t('Request: {{requestId}}\nStatus: RejectedPlantDirector\nCatatan Plant Director: {{note}}', {
      requestId: notification.relatedEntityId ?? '',
      note: String(metadata.plantDirectorNote ?? '-'),
    });
  }
  if (notification.eventType === 'request_assigned') return t('{{requestType}} {{requestId}} menunggu peninjauan.', values);
  if (notification.eventType === 'request_approved') return t('{{requestType}} {{requestId}} telah disetujui.', values);
  return t('{{requestType}} {{requestId}} telah ditolak.', values);
}

export function getBellNotificationSummary(
  notification: UserNotification,
  t: (key: string, values?: Record<string, string | number>) => string,
) {
  const metadata = notification.metadata ?? {};
  const requestId = notification.relatedEntityId ?? '-';
  let status = String(metadata.status ?? '');

  if (notification.eventType === 'vehicle_available') status = 'Pending Plant Director Approval';
  if (notification.eventType === 'vehicle_not_available') status = 'Rejected - Vehicle Not Available';
  if (notification.eventType === 'request_approved') status = 'Approved';
  if (notification.eventType === 'request_rejected') status = 'RejectedPlantDirector';
  if (notification.eventType === 'request_submitted') status = status || 'Submitted';
  if (notification.eventType === 'request_assigned') status = status || 'Submitted';

  return {
    title: getNotificationTitle(notification, t),
    requestId,
    status,
  };
}

export function getVehicleNotificationDetails(notification: UserNotification) {
  if (notification.relatedEntityType !== 'vehicle_request') return undefined;

  const metadata = notification.metadata ?? {};
  const status = notification.eventType === 'vehicle_available'
    ? 'Pending Plant Director Approval'
    : notification.eventType === 'vehicle_not_available'
      ? 'Rejected - Vehicle Not Available'
      : notification.eventType === 'request_approved'
        ? 'Approved'
        : notification.eventType === 'request_rejected'
          ? 'RejectedPlantDirector'
          : 'Submitted';

  if (notification.eventType === 'vehicle_available' || notification.eventType === 'vehicle_not_available') {
    return {
      status,
      noteLabel: 'Catatan Admin',
      note: String(metadata.adminNote ?? '-'),
    };
  }

  if (notification.eventType === 'request_approved' || notification.eventType === 'request_rejected') {
    return {
      status,
      noteLabel: 'Catatan Plant Director',
      note: String(metadata.plantDirectorNote ?? '-'),
    };
  }

  if (notification.eventType === 'request_submitted') {
    return { status };
  }

  return undefined;
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
    mutationFn: ({ approval, decision, note }: { approval: InboxApproval; decision: 'approve' | 'reject'; note?: string }) => {
      if (approval.type === 'vehicle') {
        if (!approval.vehicleId) throw new Error('Vehicle request ID is missing.');
        const changedFields = approval.actionStage === 'vehicle_availability'
          ? { adminDecisionKey: decision === 'approve' ? 'Available' : 'NotAvailable', adminNote: note?.trim() }
          : { plantDirectorDecisionKey: decision === 'approve' ? 'Approved' : 'Rejected', plantDirectorNote: note?.trim() };
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
