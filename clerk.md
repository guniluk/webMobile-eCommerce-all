# 🔐 Clerk 인증(Authentication) 풀스택 (Web, Backend, Mobile) 초보자 완전 가이드

이 문서는 **Vite React 웹 프론트엔드**, **Express.js 백엔드**, 그리고 **Expo(React Native) 모바일 앱** 환경에서 **Clerk(클러크)** 인증 서비스를 손쉽게 적용하고 데이터베이스를 연동하는 완벽한 풀스택 실전 가이드입니다.

---

## 📌 목차 (Table of Contents)
1. [Clerk 인증 구조 및 3중 유저 동기화 이해하기](#1-clerk-인증-구조-및-3중-유저-동기화-이해하기)
2. [Clerk 회원가입 및 API Key 발급](#2-clerk-회원가입-및-api-key-발급)
3. [백엔드(Express.js) Clerk 연동 가이드](#3-백엔드expressjs-clerk-연동-가이드)
4. [웹 프론트엔드(React Vite) Clerk 연동 가이드](#4-웹-프론트엔드react-vite-clerk-연동-가이드)
5. [모바일 앱(Expo / React Native) Clerk 연동 가이드](#5-모바일-앱expo--react-native-clerk-연동-가이드)
6. [자주 발생하는 오류 및 문제 해결 (Troubleshooting)](#6-자주-발생하는-오류-및-문제-해결-troubleshooting)

---

## 1. Clerk 인증 구조 및 3중 유저 동기화 이해하기

Clerk은 소셜 로그인(구글, 카카오 등), 이메일 로그인, 세션 토큰(JWT) 관리, 프로필 UI를 즉시 사용할 수 있도록 제공하는 서비스입니다.

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

### 💡 3중 회원 데이터 동기화 (Triple Sync System)
사용자가 Clerk으로 로그인할 때 MongoDB에도 사용자 정보([User.js](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/backend/src/models/user.model.js))가 안전하게 생성/업데이트되어야 합니다:

1. **클라이언트 자동 Sync (`/api/users/sync`)**: 웹/모바일 앱 접속 및 로그인 시 즉시 백엔드로 프로필을 전송하여 DB에 없으면 자동 생성(Upsert)
2. **Inngest 백그라운드 Worker (`/api/inngest`)**: Clerk 웹훅 이벤트를 Inngest가 전달받아 비동기로 안전하게 반영
3. **Direct Clerk Webhook (`/api/users/webhook`)**: 예비 직접 웹훅 수신 핸들러

---

## 2. Clerk 회원가입 및 API Key 발급

1. [Clerk 공식 홈페이지(clerk.com)](https://clerk.com) 접속 후 회원가입
2. 대시보드에서 **`Add application`** 클릭 ➔ 애플리케이션 이름 입력 (예: `my-ecommerce-app`)
3. 로그인 수단(Google, Email 등) 선택 ➔ **`Create application`**
4. 발급된 2가지 API 키를 복사해둡니다:
   - **Publishable Key**: `pk_test_...` (웹/모바일 클라이언트용)
   - **Secret Key**: `sk_test_...` (백엔드 서버 전용)

---

## 3. 백엔드(Express.js) Clerk 연동 가이드

### 3.1 패키지 설치 & `.env` 설정

```bash
cd backend
npm install @clerk/express
```

`backend/.env`:
```env
CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
```

### 3.2 `server.js` 미들웨어 적용 ([server.js](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/backend/src/server.js))

```javascript
import { clerkMiddleware } from "@clerk/express";

const app = express();
app.use(clerkMiddleware()); // req.auth 객체 자동 주입
```

### 3.3 보호된 라우트 미들웨어 ([auth.middleware.js](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/backend/src/middleware/auth.middleware.js))

```javascript
import { getAuth } from "@clerk/express";
import { User } from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    return res.status(401).json({ message: "인증되지 않은 요청입니다." });
  }

  const user = await User.findOne({ clerkId });
  if (!user) {
    return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
  }

  req.user = user;
  next();
};
```

---

## 4. 웹 프론트엔드(React Vite) Clerk 연동 가이드

### 4.1 패키지 설치 & `.env` 설정

```bash
cd frontend
npm install @clerk/react
```

`frontend/.env`:
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
```

### 4.2 `main.jsx` 최상위 감싸기

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/react";
import App from "./App";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
  </React.StrictMode>
);
```

### 4.3 컴포넌트에서 로그인 상태 및 토큰 사용

```jsx
import { useAuth, UserButton, SignInButton } from "@clerk/react";

function Header() {
  const { isSignedIn, getToken } = useAuth();

  const handleFetchData = async () => {
    const token = await getToken();
    // 백엔드로 Bearer 토큰 헤더 포함 요청 전송
  };

  return (
    <div>
      {isSignedIn ? <UserButton /> : <SignInButton />}
    </div>
  );
}
```

---

## 5. 모바일 앱(Expo / React Native) Clerk 연동 가이드

### 5.1 패키지 설치

```bash
cd mobile
npx expo install @clerk/clerk-expo expo-secure-store expo-web-browser
```

### 5.2 SecureStore 캐시 모듈 (`mobile/lib/cache.ts`)

로그인 세션 유지를 위해 Expo 암호화 저장소(`expo-secure-store`)를 설정합니다:

```typescript
import * as SecureStore from 'expo-secure-store';

export const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return await SecureStore.setItemAsync(key, value);
    } catch (err) {}
  },
};
```

### 5.3 `mobile/app/_layout.tsx` 설정

```tsx
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { tokenCache } from '../lib/cache';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ClerkLoaded>
        {/* 앱 메인 화면 */}
      </ClerkLoaded>
    </ClerkProvider>
  );
}
```

---

## 6. 자주 발생하는 오류 및 문제 해결 (Troubleshooting)

| 현상 / 오류 메시지 | 원인 | 해결 방법 |
| :--- | :--- | :--- |
| `Unauthenticated` / 401 Error | Authorization 헤더에 `Bearer <token>` 미포함 | 클라이언트에서 `getToken()` 호출 후 요청 헤더에 토큰 첨부 |
| Expo 앱에서 로그인 세션 풀림 | `tokenCache` 설정 누락 | `expo-secure-store` 모듈을 `ClerkProvider`에 등록 |
| MongoDB에 유저 정보가 없음 | 유저 Sync 로직 미실행 | 로그인 성공 직후 `/api/users/sync` 호출 로직 확인 |

---

© Web & Mobile Fullstack E-Commerce Platform. All rights reserved.
