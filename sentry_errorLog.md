# 🛡️ Sentry 에러 로깅 & 모니터링 초보자 완전 가이드

이 문서는 **Vite React 웹**, **Node.js Express 백엔드**, **Expo 모바일 앱** 환경에서 **Sentry(센트리)**를 연동하여 실시간 에러 트래킹 및 브레드크럼(Breadcrumb) 추적 시스템을 구축하는 가이드입니다.

---

## 📌 목차 (Table of Contents)
1. [Sentry 소개 & 추적 아키텍처](#1-sentry-소개--추적-아키텍처)
2. [Sentry DSN 발급 및 계정 세팅](#2-sentry-dsn-발급-및-계정-세팅)
3. [모바일 앱 (Expo) Sentry 적용 가이드 ([cart.tsx](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/mobile/app/(tabs)/cart.tsx))](#3-모바일-앱-expo-sentry-적용-가이드)
4. [백엔드 (Node.js Express) Sentry 적용 가이드](#4-백엔드-nodejs-express-sentry-적용-가이드)
5. [브레드크럼(Breadcrumbs) 및 맞춤형 에러 캡처](#5-브레드크럼breadcrumbs-및-맞춤형-에러-캡처)
6. [자주 하는 실수 & 검증 (Troubleshooting)](#6-자주-하는-실수--검증-troubleshooting)

---

## 1. Sentry 소개 & 추적 아키텍처

**Sentry**는 애플리케이션에서 발생하는 런타임 예외(Runtime Error), 네트워크 실패, 렌더링 붕괴(Crash)를 실시간으로 수집하고 어떤 유저가 어떤 조작 경로(Breadcrumb)를 거쳐 에러를 만났는지 시각화해 주는 모니터링 플랫폼입니다.

---

## 2. Sentry DSN 발급 및 계정 세팅

1. [Sentry.io](https://sentry.io) 회원가입 및 조직(Organization) 생성
2. **`Projects`** ➔ **`Create Project`** ➔ 플랫폼 선택 (`React Native` / `Node` / `React`)
3. 발급된 **DSN 주소** (`https://<key>@o<org>.ingest.sentry.io/<project>`) 복사

---

## 3. 모바일 앱 (Expo) Sentry 적용 가이드

### 3.1 패키지 설치

```bash
cd mobile
npx expo install sentry-expo
```

### 3.2 Sentry 초기화 (`mobile/app/_layout.tsx`)

```typescript
import * as Sentry from 'sentry-expo';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || 'https://your-dsn@sentry.io/project',
  enableInExpoDevelopment: true,
  debug: false,
});
```

---

## 4. 백엔드 (Node.js Express) Sentry 적용 가이드

### 4.1 패키지 설치

```bash
cd backend
npm install @sentry/node
```

### 4.2 백엔드 에러 핸들러 미들웨어 적용 (`backend/src/server.js`)

```javascript
import * as Sentry from "@sentry/node";

Sentry.init({ dsn: process.env.SENTRY_DSN });

// 백엔드 라우터들 아래에 Sentry 에러 핸들러 배치
app.use(Sentry.Handlers.errorHandler());

app.use((err, req, res, next) => {
  res.status(500).json({ message: "서버 내부 오류가 발생했습니다." });
});
```

---

## 5. 브레드크럼(Breadcrumbs) 및 맞춤형 에러 캡처

프로젝트의 결제 처리([cart.tsx](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/mobile/app/(tabs)/cart.tsx))와 같이 유저의 조작 기록과 예외를 정교하게 캡처하는 코드 예시입니다:

```typescript
import * as Sentry from 'sentry-expo';

// 1. 유저의 주요 이동 동선 기록 (Breadcrumb)
Sentry.addBreadcrumb({
  category: 'checkout',
  message: 'User initiated PaymentSheet presentation',
  level: 'info',
});

// 2. 결제 실패 시 선택적 예외 캡처 (유저의 단순 모달 취소 제외)
if (presentError) {
  if (presentError.code === 'Canceled') {
    console.log('유저가 결제를 취소함');
  } else {
    Sentry.captureException(presentError, {
      tags: { section: 'stripe_payment_sheet' },
    });
  }
}
```

---

## 6. 자주 하는 실수 & 검증 (Troubleshooting)

| 현상 | 원인 | 해결 방법 |
| :--- | :--- | :--- |
| 개발 환경에서 에러 수집 안 됨 | `enableInExpoDevelopment` 옵션 false | `Sentry.init`에서 `enableInExpoDevelopment: true` 적용 확인 |
| DSN 유효성 실패 | 올바르지 않은 DSN 문자열 | `.env`에 DSN이 정확하게 설정되었는지 확인 |

---

© Web & Mobile Fullstack E-Commerce Platform. All rights reserved.
