import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppNotification } from '../../types';

interface NotificationTabProps {
  notifications: AppNotification[];
  loading?: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAllNotifications: () => void;
  onDeleteNotification?: (id: string) => void;
}

export const NotificationTab: React.FC<NotificationTabProps> = React.memo(
  function NotificationTab({
    notifications,
    loading,
    onMarkAsRead,
    onMarkAllAsRead,
    onClearAllNotifications,
    onDeleteNotification,
  }) {
    if (loading && notifications.length === 0) {
      return (
        <View className="py-16 justify-center items-center">
          <ActivityIndicator size="large" color="#0284c7" />
          <Text className="text-xs dark:text-slate-400 text-slate-500 mt-3">
            알림 정보를 불러오는 중입니다...
          </Text>
        </View>
      );
    }

    if (notifications.length === 0) {
      return (
        <View className="py-14 items-center dark:bg-slate-800/50 bg-white/60 rounded-2xl p-6 border dark:border-slate-700 border-slate-200 mb-4">
          <Ionicons name="notifications-off-outline" size={48} color="#94a3b8" />
          <Text className="text-base font-bold dark:text-slate-300 text-slate-700 mt-3">
            도착한 알림 메시지가 없습니다.
          </Text>
          <Text className="text-xs dark:text-slate-400 text-slate-500 mt-1 text-center">
            주문 상품의 결제 및 배송 상태가 변경되면{'\n'}실시간 알림 메시지를 확인하실 수 있습니다.
          </Text>
        </View>
      );
    }

    const unreadCount = notifications.filter((n) => !n.read).length;

    const handleConfirmClearAll = () => {
      Alert.alert(
        '알림 전체 삭제 🗑️',
        '모든 알림 메시지를 삭제하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '삭제',
            style: 'destructive',
            onPress: onClearAllNotifications,
          },
        ],
      );
    };

    return (
      <View className="mb-4">
        {/* 상단 컨트롤 영역 (읽지 않은 알림 카운트, 모두 읽음, 전체 삭제) */}
        <View className="flex-row justify-between items-center mb-3 px-1">
          <View className="flex-row items-center">
            <Text className="text-xs font-bold dark:text-slate-300 text-slate-700">
              최신 주문 변동 알림
            </Text>
            {unreadCount > 0 && (
              <View className="ml-2 px-2 py-0.5 rounded-full bg-rose-500">
                <Text className="text-[10px] font-extrabold text-white">
                  안읽음 {unreadCount}개
                </Text>
              </View>
            )}
          </View>

          <View className="flex-row items-center gap-1.5">
            {unreadCount > 0 && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onMarkAllAsRead}
                className="px-2 py-1 rounded-lg bg-sky-500/10 dark:bg-cyan-400/20"
              >
                <Text className="text-[11px] font-bold text-sky-600 dark:text-cyan-400">
                  모두 읽음
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleConfirmClearAll}
              className="flex-row items-center px-2 py-1 rounded-lg bg-rose-500/10 dark:bg-rose-500/20"
            >
              <Ionicons name="trash-outline" size={12} color="#ef4444" />
              <Text className="text-[11px] font-bold text-rose-500 ml-1">
                전체 삭제
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 알림 카드 리스트 */}
        {notifications.map((noti) => {
          const getIconName = () => {
            switch (noti.type) {
              case 'payment':
                return 'card-outline';
              case 'delivery':
                return 'cube-outline';
              case 'status_change':
                return 'sync-outline';
              default:
                return 'notifications-outline';
            }
          };

          const getIconColor = () => {
            if (noti.title.includes('완료') || noti.statusBadge.includes('완료')) {
              return '#10b981'; // emerald
            }
            if (noti.title.includes('출발') || noti.statusBadge.includes('배송')) {
              return '#0284c7'; // sky
            }
            return '#f59e0b'; // amber
          };

          return (
            <TouchableOpacity
              key={noti.id}
              activeOpacity={0.8}
              onPress={() => onMarkAsRead(noti.id)}
              className={`rounded-2xl p-4 mb-3 border shadow-sm ${
                noti.read
                  ? 'dark:bg-slate-800/60 bg-white/70 border-slate-200/80 dark:border-slate-800'
                  : 'dark:bg-slate-800 bg-white border-sky-500/30 dark:border-cyan-500/30'
              }`}
            >
              <View className="flex-row items-start">
                {/* 알림 아이콘 헤더 */}
                <View
                  className={`p-2.5 rounded-xl mr-3 ${
                    noti.read
                      ? 'bg-slate-100 dark:bg-slate-700/60'
                      : 'bg-sky-500/10 dark:bg-cyan-500/20'
                  }`}
                >
                  <Ionicons
                    name={getIconName() as any}
                    size={20}
                    color={getIconColor()}
                  />
                </View>

                {/* 알림 정보 텍스트 */}
                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <View className="flex-row items-center flex-1 mr-2">
                      <Text
                        numberOfLines={1}
                        className={`text-xs font-extrabold ${
                          noti.read
                            ? 'dark:text-slate-300 text-slate-700'
                            : 'dark:text-white text-slate-900'
                        }`}
                      >
                        {noti.title}
                      </Text>
                      {!noti.read && (
                        <View className="w-2 h-2 rounded-full bg-sky-500 dark:bg-cyan-400 ml-1.5" />
                      )}
                    </View>

                    <View className="flex-row items-center">
                      <Text className="text-[10px] font-medium dark:text-slate-400 text-slate-500 mr-2">
                        {noti.createdAt}
                      </Text>
                      {onDeleteNotification && (
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={(e) => {
                            e.stopPropagation();
                            onDeleteNotification(noti.id);
                          }}
                          className="p-0.5 rounded-full"
                        >
                          <Ionicons name="close" size={14} color="#94a3b8" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  <Text
                    numberOfLines={2}
                    className="text-xs dark:text-slate-300 text-slate-600 leading-4 mt-0.5"
                  >
                    {noti.message}
                  </Text>

                  {/* 하단 뱃지 표시 */}
                  <View className="flex-row items-center justify-between mt-2.5 pt-2 border-t dark:border-slate-700/50 border-slate-100">
                    <Text
                      numberOfLines={1}
                      className="text-[11px] font-bold text-slate-400 dark:text-slate-500 flex-1 mr-2"
                    >
                      {noti.orderProductNames || '주문 상품'}
                    </Text>

                    <View className="bg-sky-500/10 dark:bg-cyan-500/20 px-2 py-0.5 rounded-md border border-sky-500/20">
                      <Text className="text-[10px] font-bold text-sky-600 dark:text-cyan-400">
                        {noti.statusBadge}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  },
);
