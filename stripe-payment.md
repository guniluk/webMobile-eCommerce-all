# 💳 Stripe 결제 파이프라인 & 멱등성 완벽 가이드 (Web, Backend, Mobile)

이 문서는 **Stripe 결제 게이트웨이**를 사용하여 **Expo 모바일 앱**, **Vite React 웹**, 그리고 **Express 백엔드**에 안전하고 결점 없는 결제 아키텍처를 연동하는 전 과정 완벽 가이드입니다.

---

## 📌 목차 (Table of Contents)
1. [아키텍처 비교: Webhook vs 직통(Direct Client-Server) 파이프라인](#1-아키텍처-비교-webhook-vs-직통direct-client-server-파이프라인)
2. [Stripe 계정 세팅 및 API Key 획득](#2-stripe-계정-세팅-및-api-key-획득)
3. [백엔드 결제 & 주문 원자적 처리 로직](#3-백엔드-결제--주문-원자적-처리-로직)
   - 3.1 PaymentIntent 생성 ([payment.controller.js](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/backend/src/controllers/payment.controller.js))
   - 3.2 멱등성 단일 차감 가드 & 재고 원자적 차감 ([order.controller.js](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/backend/src/controllers/order.controller.js))
4. [모바일 앱 (Expo) PaymentSheet 결제 구현 ([cart.tsx](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/mobile/app/(tabs)/cart.tsx))](#4-모바일-앱-expo-paymentsheet-결제-구현)
5. [Stripe Webhook 공식 사용 방법 (옵션)](#5-stripe-webhook-공식-사용-방법-옵션)
6. [자주 하는 실수 & 검증 (Troubleshooting)](#6-자주-하는-실수--검증-troubleshooting)

---

## 1. 아키텍처 비교: Webhook vs 직통(Direct Client-Server) 파이프라인

본 프로젝트는 **1) Stripe Webhook 방식**과 **2) Expo Go/개발 환경에 최적화된 직통 결제 파이프라인**을 모두 지원합니다.

```text
[ 모바일/웹 클라이언트 ] ─── 1. POST /api/payment/create-intent ───► [ 백엔드 ] ───► [ Stripe API ]
         │                                                                             │
         │<───────────────── 2. clientSecret 반환 ─────────────────────────────────────┘
         │
         ├─── 3. PaymentSheet / 카드 결제 승인 (Stripe Client SDK)
         │
         └─── 4. POST /api/orders (Stripe PaymentIntent ID 전송) ────► [ 백엔드 (Order Controller) ]
                                                                             │ 🛡️ 멱등성 가드 (중복 차감 100% 방지)
                                                                             │ 📦 원자적 재고 차감 (Mongoose Session)
                                                                             │ 📑 Order DB 생성 & 🛒 Cart 비우기
                                                                             └ 🔔 1대1 주문 접수 알림 생성
```

---

## 2. Stripe 계정 세팅 및 API Key 획득

1. [Stripe Dashboard](https://dashboard.stripe.com) 접속 및 로그인 (Test Mode 활성화)
2. **`Developers`** ➔ **`API keys`** 메뉴로 이동
3. 다음 2가지 키를 복사합니다:
   - **Publishable Key**: `pk_test_...` (클라이언트용)
   - **Secret Key**: `sk_test_...` (백엔드 전용)

---

## 3. 백엔드 결제 & 주문 원자적 처리 로직

### 3.1 PaymentIntent 생성 (`/api/payment/create-intent`)

서버에서 상품 재고와 총 결제 금액을 재산정한 후 Stripe 결제 의도(`paymentIntent`)를 생성합니다.

```javascript
// backend/src/controllers/payment.controller.js
export const createPaymentIntent = async (req, res) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const { cartItems, shippingAddress } = req.body;

  // 1. 서버 측 금액 & 재고 검증 (Batch Read)
  let subtotal = 0;
  for (const item of cartItems) {
    const product = await Product.findById(item.productId);
    if (product.stock < item.quantity) {
      return res.status(400).json({ message: `'${product.name}' 재고가 부족합니다.` });
    }
    subtotal += product.price * item.quantity;
  }

  const shippingFee = subtotal >= 100000 ? 0 : 3000;
  const taxAmount = Math.round(subtotal * 0.1);
  const totalAmount = subtotal + shippingFee + taxAmount;

  // 2. Stripe PaymentIntent 생성
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmount,
    currency: "krw",
    automatic_payment_methods: { enabled: true },
  });

  res.status(200).json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amountDetails: { subtotal, shippingFee, taxAmount, totalAmount },
  });
};
```

### 3.2 멱등성 단일 차감 가드 & 재고 원자적 차감 (`/api/orders`)

결제 성공 후 주문 생성 시 이중 결제 요청이 오더라도 DB 중복 생성을 막는 가드입니다.

```javascript
// backend/src/controllers/order.controller.js
export const createOrder = async (req, res) => {
  const { orderItems, shippingAddress, paymentResult, totalPrice } = req.body;

  // 🛡️ 1. 멱등성 가드: 동일한 paymentResult.id로 이미 존재하는 주문 확인
  if (paymentResult?.id) {
    const existingOrder = await Order.findOne({ "paymentResult.id": paymentResult.id });
    if (existingOrder) {
      return res.status(200).json({ message: "이미 접수된 주문입니다. (이중 차감 방지)", order: existingOrder });
    }
  }

  // 📦 2. Mongoose 트랜잭션으로 원자적 재고 차감 & 주문 생성
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    for (const item of orderItems) {
      const product = await Product.findById(item.productId).session(session);
      product.stock -= item.quantity;
      await product.save({ session });
    }

    const [order] = await Order.create([{ ... }], { session });
    await Cart.findOneAndUpdate({ userId: req.user._id }, { items: [] }, { session });

    await session.commitTransaction();
    res.status(201).json(order);
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
};
```

---

## 4. 모바일 앱 (Expo) PaymentSheet 결제 구현

`mobile/app/(tabs)/cart.tsx`에서의 결제 4단계 흐름:

```typescript
import { useStripe } from '@stripe/stripe-react-native';

const { initPaymentSheet, presentPaymentSheet } = useStripe();

const handleCheckout = async () => {
  // 1. PaymentIntent clientSecret 발급
  const intentResult = await api.createPaymentIntent({ cartItems, shippingAddress });

  // 2. PaymentSheet 초기화
  const { error: initError } = await initPaymentSheet({
    paymentIntentClientSecret: intentResult.clientSecret,
    merchantDisplayName: 'E-Commerce Store',
  });

  // 3. 결제 모달 띄우기
  const { error: presentError } = await presentPaymentSheet();
  if (presentError) {
    if (presentError.code === 'Canceled') {
      Alert.alert('안내', '결제가 취소되었습니다.');
    } else {
      Alert.alert('결제 실패', presentError.message);
    }
    return; // ⛔ 승인 실패 시 중단되어 주문 API가 호출되지 않음!
  }

  // 4. 결제 성공 승인 후 직통 주문 DB 생성 API 호출
  await createOrderMutation.mutateAsync({
    orderItems,
    totalPrice: intentResult.amountDetails.totalAmount,
    paymentResult: { id: intentResult.paymentIntentId, status: 'COMPLETED' },
    shippingAddress,
  });
};
```

---

## 5. Stripe Webhook 공식 사용 방법 (옵션)

로컬 개발 환경에서 Webhook 테스트 시 Stripe CLI를 활용합니다:

```bash
stripe listen --forward-to localhost:3000/api/payment/webhook
```

발급받은 `whsec_...` 키를 `backend/.env`의 `STRIPE_WEBHOOK_SECRET`에 설정합니다.

---

## 6. 자주 하는 실수 & 검증 (Troubleshooting)

| 현상 | 원인 | 해결 방법 |
| :--- | :--- | :--- |
| Stripe PaymentSheet 오픈 실패 | Merchant ID 미지정 또는 API Key 누락 | `app.json`에 `@stripe/stripe-react-native` 플러그인 지정 확인 |
| 결제 취소 시 DB에 주문 생성 | 결제 실패 분기 처리 미흡 | `presentError` 발생 시 `return`으로 주문 API 호출 중단 확인 |

---

© Web & Mobile Fullstack E-Commerce Platform. All rights reserved.
