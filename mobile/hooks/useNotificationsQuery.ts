import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';
import { api } from '../lib/api';

export function useNotificationsQuery() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  // 1. DB 알림 목록 및 읽지 않은 개수 조회 (isRead가 false인 항목 개수 unreadCount 포함)
  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const token = await getToken();
      return api.getNotifications(token);
    },
    staleTime: 1000 * 60, // 1분 캐싱으로 반복 네트워크 요청 방지
  });

  // 2. 단일 알림 읽음 처리 Mutation (DB isRead -> true)
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const token = await getToken();
      return api.markNotificationAsRead(notificationId, token);
    },
    onSuccess: (data: any) => {
      if (data && data.success) {
        queryClient.setQueryData(['notifications'], (old: any) => {
          if (!old || !old.notifications) return old;
          const targetId = data.notification?._id;
          return {
            ...old,
            notifications: old.notifications.map((n: any) =>
              targetId && n._id === targetId ? data.notification : n,
            ),
            unreadCount: typeof data.unreadCount === 'number' ? data.unreadCount : old.unreadCount,
          };
        });
      }
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // 3. 전체 알림 일괄 읽음 처리 Mutation (DB isRead -> true)
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return api.markAllNotificationsAsRead(token);
    },
    onSuccess: () => {
      queryClient.setQueryData(['notifications'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          notifications: old.notifications.map((n: any) => ({ ...n, isRead: true })),
          unreadCount: 0,
        };
      });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // 4. 단일 알림 삭제 Mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const token = await getToken();
      return api.deleteNotification(notificationId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // 5. 전체 알림 삭제 Mutation
  const clearAllNotificationsMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return api.clearAllNotifications(token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return {
    notifications: notificationsQuery.data?.notifications || [],
    unreadCount: typeof notificationsQuery.data?.unreadCount === 'number' ? notificationsQuery.data.unreadCount : 0,
    isLoading: notificationsQuery.isLoading,
    isFetched: notificationsQuery.isFetched,
    refetch: notificationsQuery.refetch,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    clearAllNotifications: clearAllNotificationsMutation.mutate,
  };
}
