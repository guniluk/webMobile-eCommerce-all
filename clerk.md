# 🔐 Clerk 인증(Authentication) 풀스택 (Web, Backend, Mobile) 초보자 완전 가이드

이 문서는 **Vite React 프론트엔드**, **Express.js 백엔드**, 그리고 **Expo(React Native) 모바일** 환경에서 **Clerk(클러크)** 인증 서비스를 쉽고 완벽하게 적용하는 전체 풀스택 가이드입니다.

---

## 📌 1. Clerk 인증 구조 및 처리 흐름 이해하기

Clerk은 소셜 로그인(구글, 카카오, 네이버 등), 이메일/비밀번호 로그인, 세션 관리, 프로필 관리 UI를 완제품 형태로 제공하는 회원 인증 플랫폼입니다.

```
[ React 웹 / Expo 모바일 앱 ] ──── 1. 로그인 요청 (UI/SDK) ───► [ Clerk 인증 서버 ]
         │                                                            │
         │<────────────── 2. JWT 토큰 & 세션 발급 ─────────────────────┤
         │                                                            │
         ├─────────────── 3. API 요청 (Authorization: Bearer Token) ──┼───► [ Express 백엔드 & MongoDB ]
                                                                             │  4. clerkMiddleware()
                                                                             │     토큰 검증 및 getAuth()
                                                                             │  5. 3중 회원 데이터 동기화
```

### 💡 3중 회원 데이터 동기화 (Triple Sync)
사용자가 Clerk으로 로그인하거나 회원가입을 할 때, MongoDB에도 사용자 정보(`User` 모델)가 안전하게 저장되어야 합니다. 이 프로젝트는 데이터 누락을 방지하기 위해 **3중 동기화 방식**을 적용했습니다:

1. **클라이언트 자동 Sync (`/api/user/sync`)**: 사용자가 로그인하는 즉시 웹/모바일 클라이언트가 백엔드로 프로필을 전송하여 DB에 유저가 없으면 자동 생성(Upsert)합니다.
2. **Inngest 백그라운드 Worker (`/api/inngest`)**: Clerk 웹훅 이벤트를 Inngest가 전달받아 자동 재시도를 거쳐 MongoDB에 안전하게 반영합니다.
3. **Direct Clerk Webhook (`/api/user/webhook`)**: 예비 직접 웹훅 엔드포인트를 제공합니다.

---

## 🔑 2. 1단계: Clerk 회원가입 및 API Key 획득

1. [Clerk 공식 홈페이지(clerk.com)](https://clerk.com) 접속 후 회원가입.
2. 대시보드 메인에서 **`Add application`** 클릭 ➔ 프로젝트 이름 입력 (예: `web-mobile-ecommerce`).
3. 사용할 로그인 방식(Google, Email 등) 선택 ➔ **`Create application`** 클릭.
4. 발급된 **API Keys** 2가지를 복사합니다:
   - **Publishable Key** (공개 키): `pk_test_...`
   - **Secret Key** (비밀 키): `sk_test_...` (백엔드 전용, 노출 엄금!)

---

## 📱 3. 2단계: Mobile (Expo / React Native) 세팅 ★ 최신 추가

### 1) 패키지 설치
`mobile` 디렉터리에서 Clerk Expo SDK 및 암호화 토큰 저장소 패키지를 설치합니다:

```bash
cd mobile
npx expo install @clerk/clerk-expo expo-secure-store expo-web-browser
```

### 2) SecureStore 토큰 캐싱 모듈 작성 (`mobile/lib/cache.ts`)
로그인 유지 및 보안 세션 관리를 위해 Expo 하드웨어 암호화 저장소(`expo-secure-store`)를 연동합니다:

```typescript
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export interface TokenCache {
  getToken: (key: string) => Promise<string | null | undefined>;
  saveToken: (key: string, value: string) => Promise<void>;
  clearToken?: (key: string) => Promise<void>;
}

const createNativeTokenCache = (): TokenCache => ({
  async getToken(key: string) {
    try {
      const item = await SecureStore.getItemAsync(key);
      if (item) console.log(`${key} token fetched 🔐`);
      return item;
    } catch (error) {
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return await SecureStore.setItemAsync(key, value);
    } catch (err) {}
  },
  async clearToken(key: string) {
    try {
      return await SecureStore.deleteItemAsync(key);
    } catch (err) {}
  },
});

export const tokenCache = createNativeTokenCache();
```

### 3) 환경 변수 설정 (`mobile/.env`)
Expo 환경 변수는 반드시 `EXPO_PUBLIC_` 접두사를 붙여야 합니다:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_여기에_본인의_Publishable_Key_입력
```

### 4) `mobile/app/_layout.tsx`에 `ClerkProvider` 및 `WebBrowser` 적용
최상위 레이아웃을 `ClerkProvider`로 감싸고, OAuth 딥링크 리다이렉션 수신을 위해 `WebBrowser.maybeCompleteAuthSession()`을 추가합니다:

```tsx
import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import { tokenCache } from '../lib/cache';

// 웹브라우저 기반 OAuth 리다이렉션 완료 헬퍼
WebBrowser.maybeCompleteAuthSession();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <SafeAreaProvider>
          <StatusBar style={isDark ? 'light' : 'dark'} hidden={false} translucent={true} />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </SafeAreaProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
```

### 5) 모바일 소셜 OAuth 인증 컴포넌트 (`mobile/components/ClerkAuth.tsx`)
웹(Frontend)과 일관성 있게 **Google 계정 및 Apple ID 소셜 로그인**을 지원하도록 Clerk 최신 권장 방식인 `useSSO` 훅을 사용해 구현합니다:

```tsx
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SignedIn, SignedOut, useUser, useAuth, useSSO } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

// OAuth 실행 전 브라우저 미리 웜업 헬퍼
export function useWarmUpBrowser() {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
}

export function ClerkAuth() {
  useWarmUpBrowser();

  const { user } = useUser();
  const { signOut } = useAuth();
  const [loadingStrategy, setLoadingStrategy] = useState<'google' | 'apple' | null>(null);

  // Clerk SSO hook
  const { startSSOFlow } = useSSO();

  const onSelectOAuth = useCallback(
    async (strategy: 'oauth_google' | 'oauth_apple') => {
      const currentStrategy = strategy === 'oauth_google' ? 'google' : 'apple';
      setLoadingStrategy(currentStrategy);
      try {
        const { createdSessionId, setActive } = await startSSOFlow({ strategy });

        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId });
        }
      } catch (err) {
        console.error('OAuth Error:', err);
      } finally {
        setLoadingStrategy(null);
      }
    },
    [startGoogleOAuth, startAppleOAuth]
  );

  return (
    <View className="w-full">
      {/* 🟢 로그인 상태 */}
      <SignedIn>
        <View className="dark:bg-slate-800 bg-white p-5 rounded-2xl border items-center">
          <Image source={{ uri: user?.imageUrl }} className="w-20 h-20 rounded-full mb-3" />
          <Text className="text-xl font-bold dark:text-white text-slate-900">{user?.fullName}</Text>
          <Text className="text-xs text-slate-400 mb-4">{user?.primaryEmailAddress?.emailAddress}</Text>
          <TouchableOpacity onPress={() => signOut()} className="bg-rose-600 px-5 py-2 rounded-xl">
            <Text className="text-white font-bold">로그아웃</Text>
          </TouchableOpacity>
        </View>
      </SignedIn>

      {/* 🔴 미로그인 상태 (Google / Apple ID 소셜 로그인) */}
      <SignedOut>
        <View className="dark:bg-slate-800 bg-white p-5 rounded-2xl border">
          <Text className="text-xl font-bold dark:text-cyan-400 text-sky-600 mb-4 text-center">
            소셜 간편 로그인 🔐
          </Text>

          {/* Google 로그인 버튼 */}
          <TouchableOpacity
            onPress={() => onSelectOAuth('google')}
            disabled={loadingStrategy !== null}
            className="w-full bg-white dark:bg-slate-900 border py-3.5 px-4 rounded-xl flex-row items-center justify-center mb-3"
          >
            {loadingStrategy === 'google' ? (
              <ActivityIndicator color="#0284c7" size="small" />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color="#ea4335" />
                <Text className="text-slate-800 dark:text-white font-bold ml-3">Google 계정으로 로그인</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Apple ID 로그인 버튼 */}
          <TouchableOpacity
            onPress={() => onSelectOAuth('apple')}
            disabled={loadingStrategy !== null}
            className="w-full bg-black dark:bg-slate-950 py-3.5 px-4 rounded-xl flex-row items-center justify-center"
          >
            {loadingStrategy === 'apple' ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Ionicons name="logo-apple" size={20} color="white" />
                <Text className="text-white font-bold ml-3">Apple ID로 로그인</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SignedOut>
    </View>
  );
}
```

---

## 💻 4. 3단계: Frontend (React + Vite) 세팅

### 1) 패키지 설치
```bash
cd frontend
npm install @clerk/clerk-react
```

### 2) 환경 변수 설정 (`frontend/.env`)
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_여기에_본인의_Publishable_Key_입력
```

### 3) `main.jsx`에 `ClerkProvider` 적용
```jsx
import { ClerkProvider } from '@clerk/clerk-react'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  </React.StrictMode>
)
```

---

## ⚙️ 5. 4단계: Backend (Express.js) 세팅

### 1) 패키지 설치
```bash
cd backend
npm install @clerk/express
```

### 2) 환경 변수 설정 (`backend/.env`)
```env
CLERK_PUBLISHABLE_KEY=pk_test_여기에_본인의_Publishable_Key_입력
CLERK_SECRET_KEY=sk_test_여기에_본인의_Secret_Key_입력
```

### 3) `server.js` 미들웨어 적용
```javascript
import { clerkMiddleware, getAuth } from '@clerk/express'

app.use(clerkMiddleware())

app.get('/api/profile', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ message: '인증 필요' })
  // ...
})
```

---

## 📋 6. 플랫폼별 환경 변수 & SDK 비교 요약

풀스택 프로젝트에서는 웹, 백엔드, 모바일에서 **동일한 Clerk 애플리케이션의 Publishable Key**를 사용해야 모든 기기에서 사용자 회원 정보 및 JWT 세션이 호환됩니다.

| 구분 | 플랫폼 / 프레임워크 | SDK 패키지 | 환경 변수 Key 명칭 | 설정값 예시 |
| :--- | :--- | :--- | :--- | :--- |
| **Web Frontend** | React (Vite) | `@clerk/clerk-react` | `VITE_CLERK_PUBLISHABLE_KEY` | `pk_test_...` |
| **Mobile App** | Expo (React Native) | `@clerk/clerk-expo` + `expo-secure-store` | `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_...` |
| **Backend Server** | Node.js (Express) | `@clerk/express` | `CLERK_PUBLISHABLE_KEY`<br>`CLERK_SECRET_KEY` | `pk_test_...`<br>`sk_test_...` |


---

## 💡 7. 자주 묻는 질문 & 트러블슈팅 (Troubleshooting)

### Q1. Expo 앱에서 로그인 상태가 앱을 껐다 켜면 해제돼요!
- **원인**: `tokenCache` 설정이 누락된 경우 메모리에만 세션이 유지됩니다.
- **해결책**: `expo-secure-store`를 활용한 `tokenCache` 객체를 만들어 `ClerkProvider tokenCache={tokenCache}` 속성으로 전달해야 자동 로그인이 유지됩니다.

### Q2. `"Missing Publishable Key"` 에러가 나타나요.
- `mobile/.env` 파일에 `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` 키명이 오타 없이 설정되어 있는지 확인 후, `npx expo start --clear` 로 서버를 재시작하세요.

---
*가이드 보완 완료 - 프로젝트 루트 디렉터리 (`clerk.md`)*
