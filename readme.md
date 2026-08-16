# 🛍️ Web & Mobile Fullstack E-Commerce Platform

> **풀스택 E-Commerce 웹 & 모바일 통합 구축 및 운영 가이드**

본 프로젝트는 최신 **Web(React 19 + Vite + DaisyUI v5)**과 **모바일 크로스 플랫폼(Expo 54 / React Native + NativeWind v4)**을 아우르는 **통합 E-Commerce 플랫폼**입니다.  
Node.js Express 백엔드, Cloud DB(MongoDB Atlas), Cloudinary 이미지 호스팅, Stripe 결제 게이트웨이, Clerk 사용자 인증, 1대1 주문-알림 DB 동기화 시스템을 기반으로 설계되었습니다.

---

## 📌 목차 (Table of Contents)

1. [프로젝트 개요 및 핵심 기능](#-1-프로젝트-개요-및-핵심-기능)
2. [기술 스택 (Tech Stack)](#-2-기술-스택-tech-stack)
3. [프로젝트 디렉터리 구조](#-3-프로젝트-디렉터리-구조)
4. [사전 준비 및 환경 변수 설정](#-4-사전-준비-및-환경-변수-설정)
5. [설치 및 로컬 실행 가이드](#-5-설치-및-로컬-실행-가이드)
6. [핵심 아키텍처 및 데이터 흐름](#-6-핵심-아키텍처-및-데이터-흐름)
7. [주요 가이드 문서 모음](#-7-주요-가이드-문서-모음)

---

## 🌟 1. 프로젝트 개요 및 핵심 기능

- **안정적인 Stripe 결제 파이프라인**: 결제 승인 후 서버 멱등성(Idempotency) 가드가 적용된 직통 주문 생성 파이프라인 (Expo Native PaymentSheet & React Stripe Elements 지원)
- **엄격한 서버 측 데이터 검증**: 배송지 정보(`shippingAddress`) 6대 필수 필드 검증 및 클라이언트 `totalPrice` vs 서버 계산 금액 일관성 자동 검증
- **일관된 1대1 알림(Notification) DB 연동**: 주문(`Order`) 1개당 단 하나의 알림 문서가 연결되어 배송 상태 변경 시 실시간 동기화 (RESTful `PATCH` 메서드 표준화)
- **Multer MemoryStorage + Cloudinary CDN 연동**: 디스크 저장 없이 서버 메모리 버퍼 스트림을 통해 Cloudinary 호스팅 및 HTTPS 보안 URL 제공
- **원자적 재고 관리 & N+1 최적화**: Mongoose 트랜잭션/세션을 통한 결제 후 자동 재고 차감 및 장바구니 비우기 동시 처리
- **다단계 사용자 인증**: Clerk 기반 웹/모바일 SSO 및 JWT 보안 미들웨어 연동 (`/users/sync` 기반 3중 유저 DB 동기화)
- **반응형 UI & 디바운스 검색**: 모바일에서도 글자가 잘리지 않는 반응형 검색바(`min-w-0`) 및 2글자 이상 입력 시 400ms 디바운스 필터링 적용
- **다크 모드 완벽 지원**: 웹(DaisyUI Theme)과 모바일(NativeWind v4 `useColorScheme`) 모두 완벽한 다크/라이트 테마 전환

---

## 🛠️ 2. 기술 스택 (Tech Stack)

| 영역 | 기술 및 라이브러리 | 설명 |
| :--- | :--- | :--- |
| **Backend** | Node.js (ES Modules), Express.js | RESTful API 서버 및 미들웨어 |
| **Database** | MongoDB Atlas, Mongoose ODM | 클라우드 NoSQL 데이터베이스 |
| **Auth** | Clerk (@clerk/express, @clerk/react, @clerk/clerk-expo) | 웹/모바일 소셜 로그인 및 세션 관리 |
| **Payment** | Stripe (@stripe/stripe-react-native, stripe) | 결제 인텐트 발급 및 안전한 체크아웃 |
| **Media** | Cloudinary CDN, Multer (memoryStorage) | 이미지 업로드, 변환 및 호스팅 |
| **Web Frontend** | React 19, Vite, Tailwind CSS v4, DaisyUI v5, Lucide React | 관리자 대시보드 및 웹 쇼핑몰 UI |
| **Mobile App** | Expo 54, React Native, NativeWind v4, Expo Router | iOS / Android 크로스플랫폼 모바일 앱 |
| **State & Async** | TanStack Query v5 (React Query), Axios | 서버 상태 관리, 캐싱 및 비동기 통신 |
| **Monitoring** | Sentry (@sentry/react, @sentry/react-native) | 실시간 에러 추적 및 브레드크럼 로깅 |

---

## 📁 3. 프로젝트 디렉터리 구조

```text
webMobile-eCommerce-all/
 ├─ backend/                   # 🟢 Node.js Express 백엔드 서버
 │   ├─ src/
 │   │   ├─ config/           # DB(MongoDB), Inngest, Cloudinary 연결
 │   │   ├─ controllers/      # API 컨트롤러 (Order, Payment, Product, Cart, Notification 등)
 │   │   ├─ middleware/       # Clerk Auth, Admin, Multer 미들웨어
 │   │   ├─ models/           # Mongoose DB 스키마 (User, Product, Order, Cart, Notification 등)
 │   │   ├─ routes/           # RESTful API 라우터
 │   │   ├─ utils/            # notification.js, cronKeepAlive.js 공통 유틸리티
 │   │   └─ server.js         # 백엔드 서버 진입점
 │   ├─ seed.js               # 초기 데이터베이스 시드 스크립트
 │   └─ package.json
 │
 ├─ frontend/                  # 💻 React Vite 웹 프론트엔드 (관리자/웹 매장)
 │   ├─ src/
 │   │   ├─ components/       # ProductModal, WishlistModal, Header 등 UI 컴포넌트
 │   │   ├─ pages/            # DashboardPage, ProductsPage, OrdersPage, CustomersPage 등
 │   │   ├─ services/         # API 요청 모듈 (orderApi.js, productApi.js, userApi.js 등)
 │   │   └─ App.jsx           # 라우팅 & Query Client 설정
 │   ├─ index.html
 │   └─ vite.config.js
 │
 └─ mobile/                    # 📱 Expo React Native 크로스플랫폼 모바일 앱
     ├─ app/                  # Expo Router 파일 기반 라우팅 ((tabs), (auth))
     ├─ components/           # ProductCard, WishlistTab, AddAddressModal, Header 등
     ├─ hooks/                # TanStack React Query 커스텀 훅
     ├─ lib/                  # Axios 클라이언트 (api.ts), productUtils.ts, cache.ts
     └─ app.json              # Expo 설정 및 플러그인
```

---

## 🔑 4. 사전 준비 및 환경 변수 설정

프로젝트 실행 전 각 서비스에서 발급받은 API 키를 환경 변수 파일에 등록해야 합니다. **(보안을 위해 실제 API 키는 절대 깃허브 등에 공개하지 마세요)**

### 4.1 백엔드 (`backend/.env`)

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/eCommerce

# Cloudinary 이미지 호스팅
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Clerk 인증
CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key

# Stripe 결제
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
```

### 4.2 웹 프론트엔드 (`frontend/.env`)

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
VITE_API_URL=http://localhost:3000
VITE_SENTRY_DSN=your_sentry_dsn_url
```

### 4.3 모바일 앱 (`mobile/.env`)

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_PROD_API_URL=https://your-production-url.onrender.com
EXPO_PUBLIC_USE_PRODUCTION_API=false
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn_url
```

---

## 🚀 5. 설치 및 로컬 실행 가이드

### 1단계: 패키지 설치

루트 디렉터리에서 한 번에 설치하거나 각 폴더별로 설치할 수 있습니다:

```bash
# 루트 디렉터리에서
npm run install:all

# 또는 각 디렉터리에서
cd backend && npm install
cd ../frontend && npm install
cd ../mobile && npm install
```

### 2단계: 백엔드 초기 시드 데이터 삽입 (선택 사항)

```bash
cd backend
npm run seed
```

### 3단계: 각 서비스 실행

#### 1) 백엔드 서버 실행
```bash
cd backend
npm run dev
# ➔ Server is running on port 3000
```

#### 2) 웹 프론트엔드 실행
```bash
cd frontend
npm run dev
# ➔ Local: http://localhost:5173
```

#### 3) 모바일 앱 실행 (Expo)
```bash
cd mobile
npx expo start
# ➔ Expo Go 앱으로 QR 코드 스캔 또는 터미널에서 'w'(Web), 'a'(Android), 'i'(iOS) 선택
```

---

## 💡 6. 핵심 아키텍처 및 데이터 흐름

### 💳 1. 결제 & 직통 주문 생성 흐름
1. 모바일/웹 클라이언트에서 배송지 정보와 장바구니 데이터를 백엔드 `/api/payment/create-intent`로 전송.
2. 백엔드에서 재고 및 금액을 재검증 후 Stripe `clientSecret` 발급.
3. 클라이언트에서 Stripe UI(PaymentSheet / Elements)로 결제 승인.
4. 승인 즉시 `/api/orders`를 호출하여 **원자적 재고 차감 + 멱등성 이중 결제 방지 가드 + 1대1 알림 생성** 동시 완료.

### 🔔 2. 1대1 주문-알림 DB 동기화 시스템
- 각 주문(`Order`) 문서에 1개의 알림(`Notification`)이 고유하게 매핑(`orderId: unique`).
- 웹 관리자 페이지에서 주문 배송 상태(`shipped`, `delivered` 등)를 변경하면 모바일 유저의 알림 탭과 뱃지가 실시간 동기화.

---

## 📚 7. 주요 가이드 문서 모음

프로젝트의 각 영역별 상세 구현 및 심화 가이드는 아래 문서를 참고하세요:

- [clerk.md](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/clerk.md) : Clerk 인증 및 3중 유저 DB 동기화 완벽 가이드
- [stripe-payment.md](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/stripe-payment.md) : Stripe 결제 게이트웨이 및 멱등성 직통 주문 처리 가이드
- [multer.md](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/multer.md) : Multer 메모리 스토리지 및 Cloudinary CDN 이미지 호스팅 가이드
- [daisy_UI.md](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/daisy_UI.md) : DaisyUI v5 및 시맨틱 컴포넌트 스타일링 가이드
- [nativewind.md](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/nativewind.md) : NativeWind v4 모바일 반응형 UI 및 다크 모드 가이드
- [tailwind.md](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/tailwind.md) : Tailwind CSS v4 Vite 설정 및 반응형 유틸리티 가이드
- [tanstack_query.md](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/tanstack_query.md) : TanStack Query v5 서버 상태 관리 및 캐시 무효화 가이드
- [inngest.md](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/inngest.md) : Inngest v4 백그라운드 이벤트 처리 가이드
- [sentry_errorLog.md](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/sentry_errorLog.md) : Sentry 실시간 에러 로깅 및 모니터링 가이드
- [render.md](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/render.md) : Render.com 원클릭 클라우드 배포 가이드

---

© Web & Mobile Fullstack E-Commerce Platform. All rights reserved.
