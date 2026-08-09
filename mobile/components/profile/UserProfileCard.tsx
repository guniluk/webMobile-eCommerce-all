import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface UserProfileCardProps {
  user: any;
  onLogout: () => void;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = React.memo(function UserProfileCard({
  user,
  onLogout,
}) {
  const userEmail = user?.primaryEmailAddress?.emailAddress || 'user@example.com';
  const userName = user?.fullName || user?.firstName || user?.username || '고객님';
  const userImage = user?.imageUrl;

  return (
    <View className="dark:bg-slate-800 bg-white rounded-3xl p-5 mb-5 border dark:border-slate-700 border-slate-200 shadow-sm flex-row items-center justify-between">
      <View className="flex-row items-center flex-1 mr-3">
        {userImage ? (
          <Image
            source={{ uri: userImage }}
            className="w-14 h-14 rounded-2xl mr-3.5 border-2 border-sky-500/30"
          />
        ) : (
          <View className="w-14 h-14 rounded-2xl bg-sky-500/10 dark:bg-cyan-500/20 border border-sky-500/30 justify-center items-center mr-3.5">
            <Ionicons name="person" size={28} color="#0284c7" />
          </View>
        )}
        <View className="flex-1">
          <Text
            numberOfLines={1}
            className="text-base font-bold dark:text-white text-slate-900"
          >
            {userName}
          </Text>
          <Text
            numberOfLines={1}
            className="text-xs dark:text-slate-400 text-slate-500 mt-0.5"
          >
            {userEmail}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onLogout}
        className="px-3.5 py-2 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/30 flex-row items-center"
      >
        <Ionicons name="log-out-outline" size={16} color="#f43f5e" />
        <Text className="text-xs font-bold text-rose-600 dark:text-rose-400 ml-1">
          로그아웃
        </Text>
      </TouchableOpacity>
    </View>
  );
});
