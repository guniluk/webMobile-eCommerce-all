# 🛍️ Web & Mobile Fullstack E-Commerce Platform
> **초보자도 쉽게 따라할 수 있는 풀스택 E-Commerce 처음부터 끝까지 구축 가이드**

풀스택 웹(React Vite)과 크로스 플랫폼 모바일(Expo / React Native)을 아우르는 **현대적인 E-Commerce 플랫폼** 프로젝트의 전체 소스코드 구축 가이드입니다.  
Node.js Express 백엔드, Cloud DB(MongoDB Atlas), Stripe 결제 게이트웨이, Clerk 사용자 인증, 1대1 주문-알림 DB 동기화 시스템을 순서대로 구축하는 전 과정을 세세하게 설명합니다.

---

## 📌 1. 프로젝트 개요 및 전체 구조

본 프로젝트는 최신 Web & Mobile 풀스택 아키텍처를 기반으로 한 통합 커머스 플랫폼입니다.

- **안정적인 Stripe 결제 파이프라인**: 웹/모바일 결제창 승인 후 서버 멱등성(Idempotency) 가드가 적용된 직통 주문 생성 파이프라인
- **일관된 1대1 알림(Notification) DB 연동**: 주문(`Order`) 1개당 단 하나의 알림 문서가 연결되어 배송 상태 변경 시 실시간 동기화
- **원자적 재고 관리 & N+1 최적화**: Mongoose 트랜잭션을 통한 결제 후 자동 재고 차감 및 Batch Read 쿼리 처리
- **다단계 사용자 인증**: Clerk 기반 웹/모바일 SSO 및 JWT 보안 미들웨어 연동

### 📁 디렉터리 구조

```text
webMobile-eCommerce-all/
 ├─ backend/                   # 🟢 Node.js Express 백엔드 서버
 │   ├─ src/
 │   │   ├─ config/           # DB 연결 (connectDB.js)
 │   │   ├─ controllers/      # API 컨트롤러 (Order, Payment, Product, Cart, Notification 등)
 │   │   ├─ middleware/       # Clerk Auth & Admin 미들웨어 (auth.middleware.js)
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

프로젝트 시작 전 아래 개발 도구 및 서비스 계정이 필요합니다.

1. **Node.js**: v18.x 이상 설치
2. **MongoDB Atlas**: 무료 클러스터 생성 및 `MONGODB_URI` 발급
3. **Clerk Auth**: 계정 생성 후 `Publishable Key` & `Secret Key` 발급
4. **Stripe 계정**: 테스트용 `Publishable Key` & `Secret Key` 발급

---

## 🟢 Step 1: 백엔드(Backend) 구축 순서

### 1.1 프로젝트 초기화 및 패키지 설치

`backend` 디렉터리를 만들고 필수 패키지를 설치합니다.

```bash
cd backend
npm init -y
npm install express mongoose cors dotenv @clerk/express stripe cloudinary inngest node-cron
npm install -D nodemon
```

`package.json`에 ES Modules (`"type": "module"`) 및 실행 스크립트를 추가합니다:

```json
{
  "type": "module",
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "seed": "node seed.js"
  }
}
```

### 1.2 `.env` 환경 변수 설정

`backend/.env` 파일 생성:

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

### 1.3 DB 스키마 정의 (`src/models/`)

Mongoose를 사용하여 컬렉션 스키마를 정의합니다.

1. **[Product.js](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/backend/src/models/product.model.js)**: 상품명, 가격, 재고(`stock`), 카테고리(`books`, `electronics`, `fashion`, `home`, `sports`), 이미지 URL 관리
2. **[Order.js](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/backend/src/models/order.model.js)**: 주문 상품 목록, 배송지 주소, 결제 결과(`paymentResult`), 배송 상태(`pending`, `processing`, `shipped`, `delivered`, `cancelled`)
3. **[Notification.js](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/backend/src/models/notification.model.js)**: `orderId` 필드에 `unique: true, sparse: true`를 부여하여 1대1 주문-알림 연결
4. **[Cart.js](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/backend/src/models/cart.model.js)** & **[User.js](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/backend/src/models/user.model.js)**: 장바구니 및 유저 프로필/위시리스트

### 1.4 DB 연결 & 알림 유틸 구현 (`src/config/`, `src/utils/`)

- `src/config/connectDB.js`: Mongoose `connect()`로 MongoDB Atlas에 연결
- `src/utils/notification.js`: `createOrderNotification()` 구현. 주문 생성/상태 변경 시 `findOneAndUpdate`로 알림 문서 생성 및 실시간 갱신

### 1.5 핵심 컨트롤러 작성 (`src/controllers/`)

- **[payment.controller.js](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/backend/src/controllers/payment.controller.js)**:
  - `createPaymentIntent`: 서버 측에서 재고 및 주문 금액을 재검증 후 Stripe `clientSecret`과 `paymentIntentId` 발급
- **[order.controller.js](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/backend/src/controllers/order.controller.js)**:
  - `createOrder`: Stripe 결제 성공 승인 후 클라이언트가 호출하는 직통 주문 처리 함수
  - **🛡️ 멱등성 가드**: 동일한 Stripe PaymentIntent ID로 중복 등록 시 이중 차감 및 중복 주문 방지
  - **📦 원자적 재고 차감**: MongoDB Session/Transaction으로 재고 차감 + 주문 생성 + 카트 비우기를 한 번에 실행

### 1.6 API 라우터 & 서버 진입점 (`src/server.js`)

`express.json()`, `cors()`, `clerkMiddleware()`를 적용하고 라우트 매핑:

```javascript
app.use("/api/products", productRoute);
app.use("/api/orders", orderRoute);
app.use("/api/payment", paymentRoute);
app.use("/api/carts", cartRoute);
app.use("/api/notifications", notificationRoute);
```

### 1.7 초기 데이터 시드 실행

```bash
npm run seed
```

---

## 💻 Step 2: 웹 프론트엔드(Web Frontend) 구축 순서

### 2.1 React Vite 프로젝트 생성 & 패키지 설치

```bash
cd ../frontend
npx create-vite@latest ./ --template react
npm install @clerk/react @tanstack/react-query zustand react-router-dom lucide-react axios daisyui tailwindcss postcss autoprefixer
```

### 2.2 스타일링 설정 (`tailwind.config.js`)

TailwindCSS와 DaisyUI 플러그인을 연결합니다.

```javascript
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [require("daisyui")],
};
```

### 2.3 카테고리 동기화 및 관리자 페이지 구축

1. **[ProductsPage.jsx](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/frontend/src/pages/ProductsPage.jsx)**:
   - 카테고리 필터: `ALL`, `Books`, `Electronics`, `Fashion`, `Home & Living`, `Sports` (모바일과 100% 동일한 대소문자 비구분 검색 적용)
2. **[ProductModal.jsx](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/frontend/src/components/ProductModal.jsx)**:
   - 신규 상품 등록 및 수정 모달 내 카테고리 선택 드롭다운 통일
3. **[OrdersPage.jsx](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/frontend/src/pages/OrdersPage.jsx)**:
   - 주문 목록 조회 및 배송 상태(`shipped`, `delivered` 등) 변경 시 백엔드를 통해 1대1 알림 자동 업데이트

---

## 📱 Step 3: 크로스 플랫폼 모바일 앱(Mobile App) 구축 순서

### 3.1 Expo Router 프로젝트 설정 & 라이브러리 설치

```bash
cd ../mobile
npx create-expo-app@latest ./
npx expo install @stripe/stripe-react-native @clerk/clerk-expo @tanstack/react-query zustand nativewind tailwindcss react-native-reanimated react-native-safe-area-context
```

### 3.2 NativeWind & Stripe 설정 (`app.json`)

`app.json`에 `@stripe/stripe-react-native` 플러그인을 추가합니다:

```json
"plugins": [
  [
    "@stripe/stripe-react-native",
    {
      "merchantIdentifier": "merchant.com.ecommerce",
      "enableGooglePay": true
    }
  ]
]
```

### 3.3 모바일 카테고리 및 유틸 세팅 (`lib/productUtils.ts`)

모바일 상품 카테고리 아이콘 매핑:

```typescript
export const CATEGORY_IMAGES = {
  books: require('../assets/images/books.png'),
  electronics: require('../assets/images/electronics.png'),
  fashion: require('../assets/images/fashion.png'),
  home: require('../assets/images/home.png'),
  sports: require('../assets/images/sports.png'),
};
```

### 3.4 Stripe Native PaymentSheet & 직통 주문 생성 (`app/(tabs)/cart.tsx`)

결제 및 주문 생성 4단계 파이프라인:

1. **PaymentIntent 요청**: 백엔드 `/api/payment/create-intent`에 요청하여 `clientSecret` 획득
2. **PaymentSheet 초기화**: `initPaymentSheet({ paymentIntentClientSecret: clientSecret })`
3. **결제 모달 표시**: `presentPaymentSheet()` 호출하여 사용자 카드 결제 진행
4. **직통 주문 생성**: 결제 성공 시 `POST /api/orders`를 통해 백엔드에 주문 등록 ➔ 성공 후 `clearCart()` 실행

---

## 🚀 Step 4: 프로젝트 실행 & 테스트 가이드

### 1) 백엔드 서버 가동

```bash
cd backend
npm run dev
# ➔ Server is running on port 3000
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

1. **웹훅 없는 직통 결제 파이프라인 (Direct Client-Server Payment)**:
   - Expo Go 시뮬레이터나 ngrok 없이도 Stripe 테스트 카드로 결제가 100% 정상 완료 및 저장됩니다.
2. **멱등성 중복 결제 차단 (Idempotent Direct Guard)**:
   - 동일한 PaymentIntent ID로 중복 주문 생성 요청이 들어와도 백엔드가 이를 인지하여 이중 차감 및 중복 주문 생성을 완벽히 차단합니다.
3. **1대1 Order-Notification DB 시스템**:
   - 모바일 앱과 웹 관리자 간의 배송 상태 변경 알림이 DB unique index를 통해 실시간으로 100% 일치하도록 보장됩니다.

---

© Web & Mobile Fullstack E-Commerce Platform. All rights reserved.
