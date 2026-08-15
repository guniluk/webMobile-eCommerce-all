# 🛡️ Sentry 실시간 에러 로깅 & 모니터링 가이드

이 문서는 **Vite React 웹 프론트엔드** 및 **Expo (React Native) 모바일 앱** 환경에서 **Sentry (v10.69.0 이상)**를 연동하여 실시간 모니터링, 결제/장바구니 브레드크럼(Breadcrumbs) 기록 및 에러 로깅을 처리하는 설정 가이드입니다.

---

## 📌 목차
1. [Sentry 개요 및 DSN 발급](#1-sentry-개요-및-dsn-발급)
2. [웹 프론트엔드 (React Vite) Sentry 연동](#2-웹-프론트엔드-react-vite-sentry-연동)
3. [모바일 앱 (Expo React Native) Sentry 연동](#3-모바일-앱-expo-react-native-sentry-연동)
4. [결제 & 체크아웃 브레드크럼 (Breadcrumbs) 활용](#4-결제--체크아웃-브레드크럼-breadcrumbs-활용)
5. [에러 포착 테스트 및 대시보드 검증](#5-에러-포착-테스트-및-대시보드-검증)

---

## 1. Sentry 개요 및 DSN 발급

Sentry는 사용자의 브라우저나 모바일 앱에서 발생하는 예외(Exception), 네트워크 실패, 렌더링 에러를 캡처하여 개발자에게 실시간 알림과 스택 트레이스(Stack Trace)를 제공하는 모니터링 서비스입니다.

1. [Sentry.io](https://sentry.io/) 가입 후 새 프로젝트 생성
2. 발급된 **DSN (Data Source Name)** 복사:
   `https://examplePublicKey@o0.ingest.sentry.io/0`

---

## 2. 웹 프론트엔드 (React Vite) Sentry 연동

```bash
cd frontend
npm install @sentry/react
```

`frontend/src/main.jsx` ([main.jsx](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/frontend/src/main.jsx)):

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
});

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
```

---

## 3. 모바일 앱 (Expo React Native) Sentry 연동

```bash
cd mobile
npx expo install @sentry/react-native
```

`mobile/app/_layout.tsx` ([_layout.tsx](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/mobile/app/_layout.tsx)):

```tsx
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  debug: __DEV__,
});
```

---

## 4. 결제 & 체크아웃 브레드크럼 (Breadcrumbs) 활용

사용자가 결제를 진행하는 주요 단계마다 디버깅을 위해 이벤트를 기록합니다. ([cart.tsx](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/mobile/app/(tabs)/cart.tsx) 예시):

```typescript
import * as Sentry from '@sentry/react-native';

// Sentry 결제 진행 브레드크럼 기록
Sentry.addBreadcrumb({
  category: 'checkout',
  message: 'Cart checkout process initiated',
  level: 'info',
  data: {
    itemCount: validCartItems.length,
    finalTotal,
  },
});
```

---

## 5. 에러 포착 테스트 및 대시보드 검증

의도적으로 에러를 발생시켜 Sentry 대시보드로 수신되는지 테스트합니다:

```javascript
try {
  throw new Error('Sentry 실시간 에러 로깅 테스트!');
} catch (error) {
  Sentry.captureException(error);
}
```

---

© Web & Mobile Fullstack E-Commerce Platform. All rights reserved.

