import '../global.css';
import React, { useEffect, useState, useMemo } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { tokenCache } from '../lib/cache';
import * as Sentry from '@sentry/react-native';
import { NotificationModal } from '../components/NotificationModal';
import { useNotificationStore } from '../store/useNotificationStore';
import { useOrdersQuery } from '../hooks/useOrdersQuery';

// 🛡️ Sentry 에러 조용한 전송 설정 (콘솔 메세지 비표시, 오직 실제 Error 발생 시에만 백그라운드 전송)
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  sendDefaultPii: true,
  enableLogs: false,
  debug: false,
  tracesSampleRate: 0, // 🚫 화면 이동 트레이스 터미널 메시지 출력 비활성화
  replaysSessionSampleRate: 0, // 🚫 일반 세션 비디오 전송 비활성화
  replaysOnErrorSampleRate: 1.0, // ⚠️ 에러가 발생한 순간에만 Replay 캡처
  attachStacktrace: true,
  attachScreenshot: true, // 📸 에러 발생 시 스크린샷 캡처
  attachViewHierarchy: true,
  integrations: [
    Sentry.mobileReplayIntegration({
      maskAllText: false,
      maskAllImages: false,
      maskAllVectors: false,
    }),
  ],
});

WebBrowser.maybeCompleteAuthSession();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';

function AuthGuard() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (isSignedIn && inAuthGroup) {
      router.replace('/(tabs)');
    } else if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/login');
    }
  }, [isLoaded, isSignedIn, segments, router]);

  return null;
}

function InitialLayout() {
  const { isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <View className="flex-1 justify-center items-center dark:bg-slate-900 bg-slate-100">
        <ActivityIndicator size="large" color="#06b6d4" />
      </View>
    );
  }

  return (
    <>
      <AuthGuard />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

function RootLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5분
            gcTime: 1000 * 60 * 30, // 30분
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <StatusBar
              style={isDark ? 'light' : 'dark'}
              hidden={false}
              translucent={true}
            />
            <InitialLayout />
          </SafeAreaProvider>
        </QueryClientProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

// 🛡️ Sentry.wrap으로 루트 레이아웃 래핑하여 에러 수집 및 바운더리 활성화
export default Sentry.wrap(RootLayout);
