import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { useSocialAuth } from '../../hooks/useSocialAuth';

export default function LoginScreen() {
  const { loadingStrategy, errorMessage, onSelectOAuth } = useSocialAuth();

  return (
    <SafeAreaView
      edges={['top', 'left', 'right', 'bottom']}
      className="flex-1 dark:bg-slate-900 bg-slate-100 justify-between px-5 py-2"
    >
      <Header title="Auth 🔑" subtitle="Sign in to your account" />

      {/* 히어로 & 소셜 로그인 섹션 */}
      <View className="items-center my-auto px-2">
        <View className="w-24 h-24 rounded-3xl bg-sky-500/10 dark:bg-cyan-500/20 border border-sky-500/30 dark:border-cyan-400/30 justify-center items-center mb-6 shadow-md">
          <Ionicons name="bag-check" size={48} color="#0284c7" />
        </View>

        <Text className="text-3xl font-black dark:text-white text-slate-900 text-center mb-2 tracking-tight">
          Welcome to Shop!
        </Text>
        <Text className="text-sm dark:text-slate-400 text-slate-600 text-center leading-6 mb-8 px-4 font-medium">
          소셜 계정으로 빠르고 안전하게 로그인하여{'\n'}스마트한 쇼핑 서비스를 경험해 보세요.
        </Text>

        {errorMessage ? (
          <View className="w-full bg-rose-500/10 border border-rose-500/30 p-3.5 rounded-2xl mb-6 flex-row items-center">
            <Ionicons name="alert-circle-outline" size={20} color="#f43f5e" />
            <Text className="text-xs text-rose-500 font-semibold flex-1 ml-2">
              {errorMessage}
            </Text>
          </View>
        ) : null}

        {/* 🌐 Google 로그인 버튼 */}
        <TouchableOpacity
          onPress={() => onSelectOAuth('oauth_google')}
          disabled={loadingStrategy !== null}
          accessibilityRole="button"
          accessibilityLabel="Google 계정으로 로그인"
          activeOpacity={0.85}
          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-4 px-4 rounded-2xl flex-row items-center justify-center mb-3.5 active:scale-[0.99] shadow-sm"
        >
          {loadingStrategy === 'google' ? (
            <ActivityIndicator color="#0284c7" size="small" />
          ) : (
            <>
              <Ionicons name="logo-google" size={22} color="#ea4335" />
              <Text className="text-slate-900 dark:text-white font-bold ml-3 text-base">
                Google 계정으로 로그인
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* 🍏 Apple ID 로그인 버튼 */}
        <TouchableOpacity
          onPress={() => onSelectOAuth('oauth_apple')}
          disabled={loadingStrategy !== null}
          accessibilityRole="button"
          accessibilityLabel="Apple ID로 로그인"
          activeOpacity={0.85}
          className="w-full bg-slate-900 dark:bg-slate-700 py-4 px-4 rounded-2xl flex-row items-center justify-center active:scale-[0.99] shadow-sm"
        >
          {loadingStrategy === 'apple' ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Ionicons name="logo-apple" size={22} color="white" />
              <Text className="text-white font-bold ml-3 text-base">
                Apple 계정으로 로그인
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* 하단 약관 안내 */}
      <View className="items-center mb-4">
        <Text className="text-[11px] dark:text-slate-500 text-slate-400 text-center leading-4">
          로그인 시 서비스 이용약관 및 개인정보 처리방침에 동의하는 것으로 간주됩니다.
        </Text>
      </View>
    </SafeAreaView>
  );
}
