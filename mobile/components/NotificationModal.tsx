import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppNotification } from '../types';

interface NotificationModalProps {
  visible: boolean;
  isDark: boolean;
  notifications: AppNotification[];
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAllNotifications?: () => void;
  onDeleteNotification?: (id: string) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = React.memo(
  function NotificationModal({
    visible,
    isDark,
    notifications,
    onClose,
    onMarkAsRead,
    onMarkAllAsRead,
    onClearAllNotifications,
    onDeleteNotification,
  }) {
    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        hardwareAccelerated
        onRequestClose={onClose}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View className="flex-1 bg-black/60 justify-center items-center p-4">
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View className="w-full max-w-sm rounded-3xl dark:bg-slate-800 bg-white p-5 border dark:border-slate-700 border-slate-200 shadow-xl max-h-[80%]">
                {/* 헤더 */}
                <View className="flex-row items-center justify-between border-b dark:border-slate-700 border-slate-100 pb-3.5 mb-3">
                  <View className="flex-row items-center">
                    <Ionicons
                      name="notifications-sharp"
                      size={22}
                      color={isDark ? '#38bdf8' : '#0284c7'}
                    />
                    <Text className="text-base font-extrabold dark:text-white text-slate-900 ml-2">
                      주문 변동 알림
                    </Text>
                    {unreadCount > 0 && (
                      <View className="ml-2 px-2 py-0.5 rounded-full bg-rose-500">
                        <Text className="text-[10px] font-extrabold text-white">
                          N {unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={onClose}
                    className="p-1 rounded-full bg-slate-100 dark:bg-slate-700"
                  >
                    <Ionicons
                      name="close"
                      size={18}
                      color={isDark ? '#cbd5e1' : '#64748b'}
                    />
                  </TouchableOpacity>
                </View>

                {/* 알림 본문 */}
                {notifications.length === 0 ? (
                  /* 🔔 알림이 없는 상태 */
                  <View className="py-10 items-center justify-center">
                    <View className="w-16 h-16 rounded-full bg-sky-500/10 dark:bg-cyan-500/20 items-center justify-center mb-3 border border-sky-500/20">
                      <Ionicons
                        name="notifications-off-outline"
                        size={32}
                        color={isDark ? '#38bdf8' : '#0284c7'}
                      />
                    </View>
                    <Text className="text-base font-extrabold dark:text-slate-200 text-slate-800 text-center">
                      새로운 알림이 없습니다 🔔
                    </Text>
                    <Text className="text-xs dark:text-slate-400 text-slate-500 text-center mt-1.5 px-2 leading-4">
                      주문하신 상품의 결제 및 배송 상태가 변동되면 바로 알림 메시지를 확인하실 수 있습니다.
                    </Text>
                  </View>
                ) : (
                  /* 알림 목록이 있는 상태 */
                  <View className="flex-1">
                    <View className="flex-row justify-end items-center gap-1.5 mb-2">
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

                      {onClearAllNotifications && (
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => {
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
                          }}
                          className="flex-row items-center px-2 py-1 rounded-lg bg-rose-500/10 dark:bg-rose-500/20"
                        >
                          <Ionicons name="trash-outline" size={12} color="#ef4444" />
                          <Text className="text-[11px] font-bold text-rose-500 ml-1">
                            전체 삭제
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <ScrollView
                      showsVerticalScrollIndicator={false}
                      className="max-h-96"
                    >
                      {notifications.map((noti) => {
                        const getIconName = () => {
                          switch (noti.type) {
                            case 'payment':
                              return 'card-outline';
                            case 'delivery':
                              return 'cube-outline';
                            default:
                              return 'notifications-outline';
                          }
                        };

                        return (
                          <TouchableOpacity
                            key={noti.id}
                            activeOpacity={0.8}
                            onPress={() => onMarkAsRead(noti.id)}
                            className={`rounded-2xl p-3.5 mb-2.5 border ${
                              noti.read
                                ? 'dark:bg-slate-800/60 bg-slate-50 border-slate-200/60 dark:border-slate-800'
                                : 'dark:bg-slate-750 bg-sky-50/50 border-sky-500/30 dark:border-cyan-500/30'
                            }`}
                          >
                            <View className="flex-row items-start">
                              <View
                                className={`p-2 rounded-xl mr-2.5 ${
                                  noti.read
                                    ? 'bg-slate-200/60 dark:bg-slate-700'
                                    : 'bg-sky-500/15 dark:bg-cyan-500/25'
                                }`}
                              >
                                <Ionicons
                                  name={getIconName() as any}
                                  size={18}
                                  color={isDark ? '#38bdf8' : '#0284c7'}
                                />
                              </View>

                              <View className="flex-1">
                                <View className="flex-row items-center justify-between mb-0.5">
                                  <View className="flex-row items-center flex-1 mr-1">
                                    <Text
                                      numberOfLines={1}
                                      className={`text-xs font-bold ${
                                        noti.read
                                          ? 'dark:text-slate-400 text-slate-600'
                                          : 'dark:text-white text-slate-900'
                                      }`}
                                    >
                                      {noti.title}
                                    </Text>
                                    {!noti.read && (
                                      <View className="w-1.5 h-1.5 rounded-full bg-rose-500 ml-1" />
                                    )}
                                  </View>
                                   <View className="flex-row items-center">
                                     <Text className="text-[10px] text-slate-400 mr-1.5">
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

                                <View className="flex-row items-center justify-between mt-2 pt-1.5 border-t dark:border-slate-700/50 border-slate-200/40">
                                  <Text
                                    numberOfLines={1}
                                    className="text-[10px] text-slate-400 flex-1 mr-2"
                                  >
                                    {noti.orderProductNames || '주문 상품'}
                                  </Text>
                                  <View className="bg-sky-500/10 dark:bg-cyan-500/20 px-1.5 py-0.5 rounded">
                                    <Text className="text-[9px] font-bold text-sky-600 dark:text-cyan-400">
                                      {noti.statusBadge}
                                    </Text>
                                  </View>
                                </View>
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                {/* 하단 닫기 버튼 */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={onClose}
                  className="mt-3.5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-700 items-center"
                >
                  <Text className="text-xs font-bold text-white">
                    확인 및 닫기
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  },
);
