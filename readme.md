# 🛍️ Web & Mobile Fullstack E-Commerce Platform

풀스택 웹(Web)과 크로스 플랫폼 모바일(Expo/React Native)을 아우르는 **현대적인 E-Commerce 플랫폼** 프로젝트입니다.  
Node.js Express 백엔드, Cloud DB(MongoDB), Stripe 결제 게이트웨이, Clerk 사용자 인증, 그리고 1대1 주문-알림 동기화 시스템을 탑재하고 있습니다.

---

## 📌 1. 프로젝트 개요 (Overview)

본 프로젝트는 최신 Web & Mobile 풀스택 아키텍처를 기반으로 한 전자상거래 통합 플랫폼입니다.

- **안정적인 Stripe 결제 시스템**: 모바일 네이티브 PaymentSheet 결제 모달 및 서버 측 주문 금액/재고 무결성 검증
- **일관된 1대1 알림(Notification) DB 연동**: 하나의 주문(Order)당 단 하나의 알림 문서가 연결되어 배송 상태에 따라 실시간 갱신 및 모바일 동기화
- **고성능 데이터 처리**: N+1 쿼리 방지 배치(Batch) 조회 및 동일 결제 요청 중복 방지 멱등성(Idempotency) 가드 적용
- **다단계 사용자 인증**: Clerk 및 JWT 토큰 기반의 유저/관리자 접근 제어

---

## 🛠 2. 기술 스택 (Tech Stack)

### 🟢 Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB & Mongoose ODM
- **Authentication**: Clerk Authentication Middleware
- **Payment**: Stripe SDK (`stripe`)
- **Background Tasks**: Inngest

### 📱 Mobile (Frontend)
- **Framework**: Expo (React Native, File-based Router)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State & Query**: Zustand + AsyncStorage, @tanstack/react-query
- **Payment**: `@stripe/stripe-react-native` (PaymentSheet)
- **Authentication**: `@clerk/clerk-expo`

### 💻 Web (Frontend)
- **Framework**: React (Vite)
- **Router**: React Router
- **Styling**: Tailwind CSS
- **State & Query**: Zustand, @tanstack/react-query

---

## 📁 3. 디렉터리 구조 (Directory Structure)

```text
webMobile-eCommerce-all/
 ├─ backend/                   # Node.js Express 백엔드 서버
 │   ├─ src/
 │   │   ├─ controllers/      # API 요청 처리 로직 (Payment, Order, Notification, Cart 등)
 │   │   ├─ models/           # Mongoose DB 스키마 (User, Product, Order, Notification 등)
 │   │   ├─ routes/           # API 엔드포인트 정의
 │   │   ├─ middleware/       # 인증 및 관리자 권한 미들웨어
 │   │   ├─ utils/            # notification.js 등 공통 유틸리티
 │   │   └─ server.js         # 백엔드 서버 진입점
 │   └─ .env                   # 백엔드 환경 변수 (키 및 시크릿)
 │
 ├─ mobile/                    # Expo 기반 크로스플랫폼 모바일 앱
 │   ├─ app/                  # Expo Router 파일 기반 라우팅 ((auth), (tabs) 등)
 │   ├─ components/           # 모바일 재사용 UI 컴포넌트 (Cart, Profile 등)
 │   ├─ hooks/                # TanStack React Query 커스텀 훅
 │   ├─ lib/                  # Axios HTTP 클라이언트 (api.ts) 및 캐시 설정
 │   ├─ store/                # Zustand 전역 상태 관리
 │   └─ app.json              # Expo 및 Stripe 플러그인 설정
 │
 └─ frontend/                  # React Vite 기반 웹 프론트엔드
```

---

## ⚙️ 4. 환경 변수 설정 (.env)

> **⚠️ 주의**: 보안을 위해 실제 API Key 및 데이터베이스 암호는 `.env` 파일에만 보관하고 Git에 커밋하지 않습니다.

### 백엔드 환경 변수 (`backend/.env.example`)
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/eCommerce

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key

STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
```

### 모바일 환경 변수 (`mobile/.env.example`)
```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
# EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

---

## 🚀 5. 주요 구현 기능 및 세부 진행 과정

### 💳 5.1 Stripe 결제 연동: Webhook vs 직통(Direct) 아키텍처

본 프로젝트는 **1) Stripe Webhook을 통한 비동기 수신 방법**과 **2) Expo Go 및 모바일/웹 개발 환경에서 웹훅 없이 100% 동일한 기능을 구현한 직통 결제 파이프라인**을 모두 상세히 지원합니다.

#### 📡 A. Stripe Webhook 공식 사용 방법
* **개념**: 카드 결제가 성공(`payment_intent.succeeded`)했을 때 Stripe 서버가 개발자의 백엔드 엔드포인트(`POST /api/payment/webhook`)로 비동기 콜백을 전달하여 주문을 자동 생성합니다.
* **대시보드 등록**: [Stripe Dashboard](https://dashboard.stripe.com/) ➔ Developers ➔ Webhooks ➔ URL (`https://your-domain.com/api/payment/webhook`) 등록 후 발급받은 Signing secret (`whsec_...`)을 `STRIPE_WEBHOOK_SECRET`에 입력합니다.
* **로컬 CLI 테스트**:
  ```bash
  stripe listen --forward-to localhost:3000/api/payment/webhook
  ```

#### 🚀 B. 웹훅 없이 100% 동일한 비즈니스 로직을 구현한 직통 결제 아키텍처 (프로젝트 적용)
* **도입 이유**: Expo Go 앱이나 로컬 개발/웹 환경에서는 포워딩 주소 미설정 또는 비동기 콜백 수신 시점과의 타이밍 문제로 결제가 누락되는 위험이 존재합니다.
* **직통 파이프라인 (Direct Client-Server Payment & Order Pipeline)**:
  1. **PaymentIntent 생성 (`/api/payment/create-intent`)**: 클라이언트가 장바구니 상품 및 배송지 정보로 Stripe `clientSecret`과 `paymentIntentId`를 발급받음.
  2. **PaymentSheet 결제 승인**: 모바일 네이티브 PaymentSheet 또는 Web 결제창에서 카드 결제 승인 완료.
  3. **직통 주문 생성 (`POST /api/orders`)**: 결제 성공 직후 앱이 Stripe 결제 결과(`paymentResult.id`)를 백엔드로 발송.
  4. **백엔드 원자적 비즈니스 처리 (`order.controller.js`)**:
     - **🛡️ 멱등성 단일 차감 가드**: `Order.findOne({ "paymentResult.id": finalPaymentResult.id })`로 동일 결제건에 대한 중복 생성 및 재고 이중 차감 100% 차단.
     - **📦 원자적 재고 차감**: DB 상의 상품 수량을 `product.stock -= item.quantity`로 차감 및 저장.
     - **📑 Order DB 생성**: 주문 내역 데이터베이스 저장.
     - **🛒 카트 리셋**: `Cart.findOneAndUpdate({ userId }, { items: [] })`로 유저 장바구니 자동 비우기.
     - **🔔 실시간 알림 발송**: `createOrderNotification`으로 1대1 주문 접수 알림 DB 기록.

### 🔔 5.2 1대1 Order-Notification DB 시스템
- 하나의 주문(`orderId`)에 정확히 하나의 알림 문서만 연결되도록 Mongoose 스키마에 `unique: true, sparse: true` 인덱스를 적용했습니다.
- 주문 생성(`created`) 및 배송 상태 변경(`shipped`, `delivered`, `cancelled`) 시 `findOneAndUpdate`와 Mongoose v9 최신 옵션인 `{ returnDocument: 'after' }`를 활용하여 알림을 업데이트하고 `isRead: false`로 동기화합니다.
- 모바일에서 알림 확인 시 DB `isRead`가 `true`로 저장되어 앱 재접속 시에도 읽음 상태가 유지됩니다.

### 🛡️ 5.3 멱등성(Idempotency) 및 N+1 쿼리 최적화
- **중복 결제/주문 방지**: 동일한 Stripe `paymentIntentId`로 중복 주문 생성이 요청되더라도 DB에 이중 등록되지 않도록 멱등성 가드를 구축했습니다.
- **배치 DB 조회 (Batch Read)**: N+1 DB 쿼리를 제거하여 `Product.find({ _id: { $in: productIds } })`로 일괄 처리, 네트워크 I/O 성능을 극대화했습니다.

---

## 🏃‍♂️ 6. 실행 방법 (Getting Started)

### 1) 백엔드 서버 실행
```bash
cd backend
npm install
npm run dev
```

### 2) 모바일 앱 실행 (Expo)
```bash
cd mobile
npm install
npx expo start        # Expo 모바일 실행
npx expo start --web  # Web 브라우저 실행
```

---

## 📄 7. 관련 문서 가이드

- [stripe-payment.md](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/stripe-payment.md): Stripe 대시보드 세팅부터 모바일 PaymentSheet 연동, Webhook 사용법 및 웹훅 없는 직통 결제 아키텍처 세세한 가이드

---

© Web & Mobile Fullstack E-Commerce Platform. All rights reserved.
