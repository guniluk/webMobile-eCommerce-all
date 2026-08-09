import React from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SignedIn, SignedOut, useUser, useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useSocialAuth } from '../hooks/useSocialAuth';

export function ClerkAuth() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const { loadingStrategy, errorMessage, onSelectOAuth } = useSocialAuth();

  return (
    <View className="w-full">
      {/* 🟢 로그인 완료 상태 (SignedIn) */}
      <SignedIn>
        <View className="dark:bg-slate-800 bg-white p-5 rounded-2xl border dark:border-slate-700 border-slate-200 shadow-md items-center">
          <View className="relative mb-3">
            {user?.imageUrl ? (
              <Image
                source={{ uri: user.imageUrl }}
                className="w-20 h-20 rounded-full border-2 border-sky-500 dark:border-cyan-400"
              />
            ) : (
              <View className="w-20 h-20 rounded-full bg-sky-600 dark:bg-cyan-500 justify-center items-center">
                <Text className="text-2xl font-bold text-white">
                  {user?.firstName?.[0] || 'U'}
                </Text>
              </View>
            )}
          </View>

          <Text className="text-xl font-bold dark:text-white text-slate-900 mb-1">
            {user?.fullName || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || '회원님'}
          </Text>
          <Text className="text-xs dark:text-slate-400 text-slate-500 mb-4">
            {user?.primaryEmailAddress?.emailAddress}
          </Text>

          <TouchableOpacity
            onPress={() => signOut()}
            accessibilityRole="button"
            accessibilityLabel="로그아웃 버튼"
            activeOpacity={0.8}
            className="flex-row items-center bg-rose-600 px-5 py-2.5 rounded-xl active:bg-rose-700 shadow-sm"
          >
            <Ionicons name="log-out-outline" size={18} color="white" />
            <Text className="text-white font-bold ml-2">로그아웃</Text>
          </TouchableOpacity>
        </View>
      </SignedIn>

      {/* 🔴 미로그인 상태 (SignedOut - Google / Apple ID 소셜 로그인) */}
      <SignedOut>
        <View className="dark:bg-slate-800 bg-white p-5 rounded-2xl border dark:border-slate-700 border-slate-200 shadow-md">
          <Text className="text-xl font-bold dark:text-cyan-400 text-sky-600 mb-2 text-center">
            간편 회원 로그인 🔐
          </Text>
          <Text className="text-xs dark:text-slate-400 text-slate-500 mb-5 text-center">
            Google 및 Apple 계정으로 3초만에 소셜 로그인하세요.
          </Text>

          {errorMessage ? (
            <View className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl mb-4">
              <Text className="text-xs text-rose-500 font-semibold text-center">{errorMessage}</Text>
            </View>
          ) : null}

          {/* 🌐 Google 소셜 로그인 버튼 */}
          <TouchableOpacity
            onPress={() => onSelectOAuth('oauth_google')}
            disabled={loadingStrategy !== null}
            accessibilityRole="button"
            accessibilityLabel="Google 계정으로 로그인"
            activeOpacity={0.85}
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 py-3.5 px-4 rounded-xl flex-row items-center justify-center mb-3 active:scale-[0.99] shadow-sm"
          >
            {loadingStrategy === 'google' ? (
              <ActivityIndicator color="#0284c7" size="small" />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color="#ea4335" />
                <Text className="text-slate-800 dark:text-white font-bold ml-3 text-base">
                  Google 계정으로 로그인
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* 🍏 Apple ID 소셜 로그인 버튼 */}
          <TouchableOpacity
            onPress={() => onSelectOAuth('oauth_apple')}
            disabled={loadingStrategy !== null}
            accessibilityRole="button"
            accessibilityLabel="Apple ID로 로그인"
            activeOpacity={0.85}
            className="w-full bg-slate-900 dark:bg-slate-950 py-3.5 px-4 rounded-xl flex-row items-center justify-center active:scale-[0.99] shadow-sm"
          >
            {loadingStrategy === 'apple' ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Ionicons name="logo-apple" size={20} color="white" />
                <Text className="text-white font-bold ml-3 text-base">
                  Apple ID로 로그인
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SignedOut>
    </View>
  );
}
