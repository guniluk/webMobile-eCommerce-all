# 🛍️ Web & Mobile Fullstack E-Commerce Platform

> **풀스택 E-Commerce 웹 & 모바일 통합 구축 가이드**

본 프로젝트는 최신 Web(React Vite)과 모바일 크로스 플랫폼(Expo / React Native)을 아우르는 **통합 E-Commerce 플랫폼** 프로젝트입니다.  
Node.js Express 백엔드, Cloud DB(MongoDB Atlas), Cloudinary 이미지 호스팅, Stripe 결제 게이트웨이, Clerk 사용자 인증, 1대1 주문-알림 DB 동기화 시스템을 기반으로 한 전체 소스코드 구축 가이드입니다.

---

## 📌 1. 프로젝트 개요 및 핵심 기능

본 프로젝트는 최신 풀스택 아키텍처를 기반으로 설계되었습니다.

- **안정적인 Stripe 결제 파이프라인**: 결제 승인 후 서버 멱등성(Idempotency) 가드가 적용된 직통 주문 생성 파이프라인
- **엄격한 서버 측 데이터 검증**: 배송지 정보(`shippingAddress`) 6대 필수 필드 검증 및 클라이언트 `totalPrice` vs 서버 계산 금액 일관성 자동 검증
- **일관된 1대1 알림(Notification) DB 연동**: 주문(`Order`) 1개당 단 하나의 알림 문서가 연결되어 배송 상태 변경 시 실시간 동기화 (RESTful `PATCH` 메서드 표준화)
- **Multer MemoryStorage + Cloudinary CDN 연동**: 디스크 저장 없이 서버 메모리 버퍼 스트림을 통해 Cloudinary 호스팅 및 HTTPS 보안 URL 제공
- **원자적 재고 관리 & N+1 최적화**: Mongoose 트랜잭션을 통한 결제 후 자동 재고 차감 및 Batch Read 쿼리 처리
- **다단계 사용자 인증**: Clerk 기반 웹/모바일 SSO 및 JWT 보안 미들웨어 연동
- **반응형 UI & 디바운스 검색**: 모바일에서도 글자가 잘리지 않는 반응형 검색바(`min-w-0`) 및 2글자 이상 입력 시 400ms 디바운스 필터링 적용

### 📁 디렉터리 구조

```text
webMobile-eCommerce-all/
 ├─ backend/                   # 🟢 Node.js Express 백엔드 서버
 │   ├─ src/
 │   │   ├─ config/           # DB, Inngest, Cloudinary 연결
 │   │   ├─ controllers/      # API 컨트롤러 (Order, Payment, Product, Cart, Notification 등)
 │   │   ├─ middleware/       # Clerk Auth, Admin, Multer 미들웨어
 │   │   ├─ models/           # Mongoose DB 스키마 (User, Product, Order, Cart, Notification 등)
 │   │   ├─ routes/           # RESTful API 라우터
 │   │   ├─ utils/            # notification.js 등 공통 유틸리티
 │   │   └─ server.js         # 백엔드 서버 진입점
 │   ├─ seed.js               # 초기 데이터베이스 시드 스크립트
 │   └─ .env                  # 백엔드 환경 변수
 │
 ├─ frontend/                  # 💻 React Vite 웹 프론트엔드 (관리자/웹 매장)
 │   ├─ src/
 │   │   ├─ components/       # ProductModal, WishlistModal, Header 등 UI 컴포넌트
 │   │   ├─ pages/            # DashboardPage, ProductsPage, OrdersPage 등
 │   │   ├─ services/         # API 요청 모듈 (orderApi.js, productApi.js 등)
 │   │   └─ App.jsx           # 라우팅 & Query Client 설정
 │   └─ tailwind.config.js    # Tailwind CSS + DaisyUI 설정
 │
 └─ mobile/                    # 📱 Expo React Native 크로스플랫폼 모바일 앱
     ├─ app/                  # Expo Router 파일 기반 라우팅 ((tabs), (auth))
     ├─ components/           # ProductCard, WishlistTab, Header 등
     ├─ hooks/                # TanStack React Query 커스텀 훅
     ├─ lib/                  # Axios/Fetch API 클라이언트 (api.ts) & productUtils.ts
     └─ app.json              # Expo & Stripe 플러그인 설정
```

---

## 🛠️ 2. 사전 준비 및 환경 세팅

프로젝트 시작 전 아래 서비스 계정 및 환경이 필요합니다.

1. **Node.js**: v18.x 이상 설치
2. **MongoDB Atlas**: 무료 클러스터 생성 및 `MONGODB_URI` 발급
3. **Cloudinary 계정**: Cloud Name, API Key, API Secret 발급
4. **Clerk Auth**: 계정 생성 후 `Publishable Key` & `Secret Key` 발급
5. **Stripe 계정**: 테스트용 `Publishable Key` & `Secret Key` 발급

---

```bash
cd backend
npm init -y
npm install express mongoose cors dotenv @clerk/express stripe cloudinary inngest node-cron multer
npm install -D nodemon
```

`package.json`에 ES Modules (`"type": "module"`) 및 실행 스크립트를 추가합니다:

```json
{
  "type": "module",
  "scripts": {
    "dev": "node --watch src/server.js",
    "start": "node src/server.js",
    "seed": "node seed.js"
  }
}
```

### 1.2 `.env` 환경 변수 설정

`backend/.env` 파일 생성:

```env
PORT=5000
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

### 1.3 DB 스키마 정의 (`src/models/`)

1. **[Product.js](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/backend/src/models/product.model.js)**: 상품명, 가격, 재고(`stock`), 카테고리(`books`, `electronics`, `fashion`, `home`, `sports`), 이미지 URL 관리
2. **[Order.js](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/backend/src/models/order.model.js)**: 주문 상품 목록, 배송지 주소(`fullName`, `streetAddress`, `city`, `state`, `zipCode`, `phoneNumber`), 결제 결과(`paymentResult`), 배송 상태(`pending`, `processing`, `shipped`, `delivered`, `cancelled`)
3. **[Notification.js](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/backend/src/models/notification.model.js)**: `orderId` 필드에 `unique: true, sparse: true`를 부여하여 1대1 주문-알림 연결
4. **[Cart.js](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/backend/src/models/cart.model.js)** & **[User.js](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/backend/src/models/user.model.js)**: 장바구니 및 유저 프로필/위시리스트

### 1.4 DB 연결 & 알림 유틸 구현 (`src/config/`, `src/utils/`)

- [connectDB.js](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/backend/src/config/connectDB.js): Mongoose `connect()`로 MongoDB Atlas에 연결
- [cloudinary.js](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/backend/src/config/cloudinary.js): Cloudinary SDK 설정
- [notification.js](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/backend/src/utils/notification.js): `createOrderNotification()` 구현. 주문 생성/상태 변경 시 `findOneAndUpdate`로 알림 문서 생성 및 실시간 갱신

### 1.5 핵심 컨트롤러 작성 (`src/controllers/`)

- **[payment.controller.js](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/backend/src/controllers/payment.controller.js)**:
  - `createPaymentIntent`: 서버 측에서 재고 및 주문 금액을 재검증 후 Stripe `clientSecret`과 `paymentIntentId` 발급. `shippingAddress` 필수 항목 검증.
- **[order.controller.js](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/backend/src/controllers/order.controller.js)**:
  - `createOrder`: Stripe 결제 성공 승인 후 클라이언트가 호출하는 직통 주문 처리 함수
  - **🛡️ 멱등성 가드**: 동일한 Stripe PaymentIntent ID로 중복 등록 시 이중 차감 및 중복 주문 방지
  - **📦 원자적 재고 차감**: MongoDB Session/Transaction으로 재고 차감 + 주문 생성 + 카트 비우기를 한 번에 실행
  - **🛡️ 엄격한 유효성 검증**: `shippingAddress` 6개 필수 필드 및 `totalPrice` 일치 검증

### 1.6 API 라우터 & 서버 진입점 ([server.js](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/backend/src/server.js))

```javascript
app.use("/api/products", productRoute);
app.use("/api/orders", orderRoute);
app.use("/api/payment", paymentRoute);
app.use("/api/carts", cartRoute);
app.use("/api/notifications", notificationRoute);
```

---

## 💻 Step 2: 웹 프론트엔드(Web Frontend) 구축 순서

### 2.1 React Vite 프로젝트 생성 & 패키지 설치

```bash
cd ../frontend
npm install
```

### 2.2 카테고리 동기화 및 관리자 페이지 구축

1. **[ProductsPage.jsx](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/frontend/src/pages/ProductsPage.jsx)**:
   - 카테고리 필터: `ALL`, `Books`, `Electronics`, `Fashion`, `Home & Living`, `Sports` (모바일과 100% 동일한 비구분 검색 적용)
2. **[OrdersPage.jsx](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/frontend/src/pages/OrdersPage.jsx)**:
   - 주문 목록 조회 및 배송 상태(`shipped`, `delivered` 등) 변경 시 백엔드를 통해 1대1 알림 자동 업데이트

---

## 📱 Step 3: 크로스 플랫폼 모바일 앱(Mobile App) 구축 순서

### 3.1 Expo Router 프로젝트 설정 & 라이브러리 설치

```bash
cd ../mobile
npx create-expo-app@latest ./
npx expo install @stripe/stripe-react-native @clerk/clerk-expo @tanstack/react-query zustand nativewind tailwindcss react-native-reanimated react-native-safe-area-context
```

### 3.2 모바일 이미지 포맷팅 유틸 세팅 (`lib/productUtils.ts`)

Cloudinary 호스팅 이미지 URL의 모바일 이중 인코딩 및 보안 방어 유틸:

```typescript
export const formatImageUrl = (url?: string | null): string => {
  if (!url) return '';
  let secureUrl = url.trim().replace(/^http:\/\//i, 'https://');
  if (secureUrl.includes('cloudinary.com')) return secureUrl;
  try {
    return encodeURI(decodeURI(secureUrl));
  } catch (e) {
    return secureUrl;
  }
};
```

---

## 🚀 Step 4: 프로젝트 실행 & 테스트 가이드

### 1) 백엔드 서버 가동
```bash
cd backend
npm run dev
# ➔ Server is running on port 5000
```

### 2) 웹 프론트엔드 가동
```bash
cd frontend
npm run dev
# ➔ Local: http://localhost:5173
```

### 3) 모바일 앱 가동 (Expo)
```bash
cd mobile
npx expo start
# ➔ Expo Go 앱으로 QR 코드 스캔 또는 브라우저 테스트 ('w' 누름)
```

---

## 💡 핵심 아키텍처 특장점 요약

1. **웹훅 없는 직통 결제 파이프라인**: Expo Go 시뮬레이터나 ngrok 없이도 Stripe 테스트 카드로 결제가 100% 정상 완료 및 저장됩니다.
2. **멱등성 중복 결제 차단**: 동일한 PaymentIntent ID로 중복 주문 생성 요청이 들어와도 이중 차감 및 중복 주문 생성을 차단합니다.
3. **1대1 Order-Notification DB 시스템**: 모바일 앱과 웹 관리자 간의 배송 상태 변경 알림이 DB unique index를 통해 실시간으로 100% 일치합니다.
4. **Cloudinary 안전 모바일 호스팅**: `formatImageUrl`을 통한 이중 인코딩 방지 및 모바일 이미지 렌더링 최적화.

---

© Web & Mobile Fullstack E-Commerce Platform. All rights reserved.
