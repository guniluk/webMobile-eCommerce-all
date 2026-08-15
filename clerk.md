# 🔐 Clerk 인증(Authentication) 풀스택 (Web, Backend, Mobile) 완벽 가이드

이 문서는 **Vite React 웹 프론트엔드**, **Express.js 백엔드**, 그리고 **Expo (React Native) 모바일 앱** 환경에서 **Clerk(클러크)** 인증 서비스를 연동하고 안전한 3중 유저 데이터베이스 동기화를 구현하는 최신 가이드입니다.

---

## 📌 목차 (Table of Contents)
1. [Clerk 인증 구조 및 작동 원리](#1-clerk-인증-구조-및-작동-원리)
2. [Clerk 회원가입 및 API Key 발급](#2-clerk-회원가입-및-api-key-발급)
3. [백엔드 (Express.js) Clerk 연동 가이드](#3-백엔드-expressjs-clerk-연동-가이드)
4. [웹 프론트엔드 (React Vite) Clerk 연동 가이드](#4-웹-프론트엔드-react-vite-clerk-연동-가이드)
5. [모바일 앱 (Expo / React Native) Clerk 연동 가이드](#5-모바일-앱-expo--react-native-clerk-연동-가이드)
6. [3중 회원 데이터 동기화 (Triple Sync System)](#6-3중-회원-데이터-동기화-triple-sync-system)
7. [자주 발생하는 오류 및 문제 해결 (Troubleshooting)](#7-자주-발생하는-오류-및-문제-해결-troubleshooting)

---

## 1. Clerk 인증 구조 및 작동 원리

Clerk은 소셜 로그인(구글, 애플 등), 이메일/비밀번호 로그인, 세션 토큰(JWT) 관리 및 프로필 UI를 손쉽게 제공하는 클라우드 인증 솔루션입니다.

```text
[ React 웹 / Expo 모바일 앱 ] ─── 1. 로그인 요청 (UI/SDK) ───► [ Clerk 인증 서버 ]
         │                                                           │
         │<───────────── 2. JWT 토큰 & 세션 발급 ────────────────────┤
         │                                                           │
         └────────────── 3. API 요청 (Authorization: Bearer Token) ──┼───► [ Express 백엔드 & MongoDB ]
                                                                              │  4. clerkMiddleware()
                                                                              │     토큰 검증 및 req.auth 주입
                                                                              │  5. 3중 회원 데이터 동기화
```

---

## 2. Clerk 회원가입 및 API Key 발급

1. [Clerk 공식 웹사이트(clerk.com)](https://clerk.com) 접속 후 무료 회원가입을 진행합니다.
2. 대시보드에서 **`Add application`**을 클릭하고 프로젝트 이름을 입력합니다. (예: `webMobile-eCommerce`)
3. 원하는 로그인 방식(Google, Email 등)을 선택한 뒤 **`Create application`**을 누릅니다.
4. 발급된 API 키를 복사합니다:
   - **Publishable Key** (`pk_test_...`): 웹 및 모바일 클라이언트에서 사용
   - **Secret Key** (`sk_test_...`): 백엔드 서버에서만 안전하게 사용 (절대 클라이언트에 노출 금지)

---

## 3. 백엔드 (Express.js) Clerk 연동 가이드

### 3.1 패키지 설치 & 환경변수 설정

```bash
cd backend
npm install @clerk/express
```

`backend/.env`:
```env
CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
```

### 3.2 서버 진입점 미들웨어 등록 ([server.js](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/backend/src/server.js))

```javascript
import express from 'express';
import { clerkMiddleware } from '@clerk/express';

const app = express();

// Express 글로벌 미들웨어로 등록하여 모든 요청에 req.auth 객체 주입
app.use(clerkMiddleware());
```

### 3.3 보호된 라우트 미들웨어 ([auth.middleware.js](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/backend/src/middleware/auth.middleware.js))

```javascript
import { getAuth } from '@clerk/express';
import { User } from '../models/user.model.js';

export const protectRoute = async (req, res, next) => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return res.status(401).json({ message: '인증되지 않은 요청입니다. (로그인 필요)' });
    }

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ message: '등록된 사용자 정보를 찾을 수 없습니다.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ message: '인증 처리 중 오류가 발생했습니다.' });
  }
};
```

---

## 4. 웹 프론트엔드 (React Vite) Clerk 연동 가이드

### 4.1 패키지 설치 & 환경변수 설정

```bash
cd frontend
npm install @clerk/react
```

`frontend/.env`:
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
```

### 4.2 최상위 Provider 감싸기 ([main.jsx](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/frontend/src/main.jsx))

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/react';
import App from './App';
import './index.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('VITE_CLERK_PUBLISHABLE_KEY 환경변수가 설정되지 않았습니다.');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
  </React.StrictMode>
);
```

### 4.3 인증 상태 확인 및 Bearer 토큰 획득

```jsx
import { useAuth, useUser } from '@clerk/react';

export function UserProfileHeader() {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  const handleCallApi = async () => {
    const token = await getToken();
    const response = await fetch('/api/orders', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  };

  return (
    <div>
      {isSignedIn ? (
        <p>환영합니다, {user?.fullName || '고객'}님!</p>
      ) : (
        <p>로그인이 필요합니다.</p>
      )}
    </div>
  );
}
```

---

## 5. 모바일 앱 (Expo / React Native) Clerk 연동 가이드

### 5.1 패키지 설치

```bash
cd mobile
npx expo install @clerk/clerk-expo expo-secure-store expo-web-browser
```

### 5.2 암호화 세션 캐시 모듈 ([cache.ts](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/mobile/lib/cache.ts))

앱을 종료해도 로그인 세션이 유지되도록 `expo-secure-store`를 활용합니다:

```typescript
import * as SecureStore from 'expo-secure-store';

export const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {}
  },
};
```

### 5.3 모바일 최상위 레이아웃 설정 ([_layout.tsx](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/mobile/app/_layout.tsx))

```tsx
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { tokenCache } from '../lib/cache';
import { Stack } from 'expo-router';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ClerkLoaded>
        <Stack screenOptions={{ headerShown: false }} />
      </ClerkLoaded>
    </ClerkProvider>
  );
}
```

---

## 6. 3중 회원 데이터 동기화 (Triple Sync System)

본 프로젝트는 사용자가 Clerk으로 로그인할 때 MongoDB에 사용자 데이터가 누락 없이 안전하게 생성/동기화되도록 3중 방어 체계를 가집니다:

1. **클라이언트 자동 Sync (`/api/users/sync`)**: 웹/모바일 앱에서 로그인 감지 시 프로필 정보를 백엔드로 전송하여 MongoDB에 자동 생성(Upsert).
2. **Inngest 백그라운드 Worker (`/api/inngest`)**: Clerk 웹훅 이벤트를 수신하여 비동기로 안전하게 최신 정보를 동기화.
3. **Direct Clerk Webhook (`/api/users/webhook`)**: 직접 웹훅 수신을 위한 예비 핸들러.

---

## 7. 자주 발생하는 오류 및 문제 해결 (Troubleshooting)

| 오류 현상 | 발생 원인 | 해결 방법 |
| :--- | :--- | :--- |
| **`401 Unauthenticated`** | API 요청 시 `Authorization` 헤더 누락 | `getToken()`을 호출하여 `Authorization: Bearer <token>` 헤더를 첨부합니다. |
| **앱 재시작 시 로그인 풀림** | `tokenCache` 설정 누락 | `ClerkProvider`에 `tokenCache={tokenCache}`가 전달되었는지 확인합니다. |
| **MongoDB 유저 정보 부재** | 동기화 API 미호출 | 로그인 완료 시 `/api/users/sync` 엔드포인트가 정상 호출되는지 점검합니다. |

---

© Web & Mobile Fullstack E-Commerce Platform. All rights reserved.
