# 💳 Stripe 결제 & 주문 통합 시스템 완전 가이드

이 문서는 **Express.js 백엔드**, **Vite React 웹**, 그리고 **Expo(React Native) 모바일 앱** 환경에서 **Stripe 결제 게이트웨이**를 연동하고, 서버 측 멱등성 가드(Idempotency Guard), 엄격한 배송지/금액 유효성 검증, 1대1 주문-알림 DB 동기화 시스템을 구현하는 전체 가이드입니다.

---

## 📌 목차
1. [결제 & 주문 처리 다이어그램](#1-결제--주문-처리-다이어그램)
2. [백엔드 구현 (Stripe PaymentIntent & Direct Order)](#2-백엔드-구현-stripe-paymentintent--direct-order)
   - [2.1 `createPaymentIntent` (서버 금액 및 배송지 검증)](#21-createpaymentintent-서버-금액-및-배송지-검증)
   - [2.2 `createOrder` (원자적 재고 차감 및 멱등성 가드)](#22-createorder-원자적-재고-차감-및-멱등성-가드)
3. [모바일 앱 (Expo Stripe Native PaymentSheet) 연동](#3-모바일-앱-expo-stripe-native-paymentsheet-연동)
4. [웹 프론트엔드 (React Stripe Elements) 연동](#4-웹-프론트엔드-react-stripe-elements-연동)
5. [⚠️ 결제 보안 및 이슈 트러블슈팅](#5-️-결제-보안-및-이슈-트러블슈팅)

---

## 1. 결제 & 주문 처리 다이어그램

```text
[ 클라이언트 (Web / Mobile Expo) ]                       [ Express 백엔드 ]                        [ Stripe API ]
               │                                                  │                                      │
               │─── 1. POST /api/payment/create-intent ──────────►│                                      │
               │     (cartItems, shippingAddress 전송)            │─── 2. stripe.paymentIntents.create ─►│
               │                                                  │◄── 3. clientSecret & Intent ID 반환 ─┤
               │◄── 4. clientSecret 및 계산된 금액 반환 ────────────┤                                      │
               │                                                  │                                      │
               │─── 5. Stripe 결제 모달 (PaymentSheet) 승인 ─────────────────────────────────────────────►│
               │◄── 6. 결제 성공 (PaymentIntent ID 획득) ────────────────────────────────────────────────┤
               │                                                  │                                      │
               │─── 7. POST /api/orders (직통 주문 생성) ─────────►│                                      │
               │     (PaymentIntent ID, shippingAddress, totalPrice)│─── 8. 🛡️ 멱등성 가드 및 금액 검증      │
               │                                                  │─── 9. 원자적 재고 차감 & DB 저장       │
               │                                                  │─── 10. 🔔 1대1 알림 동기화 생성      │
               │◄── 11. 주문 접수 성공 응답 ────────────────────────┤                                      │
```

---

## 2. 백엔드 구현 (Stripe PaymentIntent & Direct Order)

### 2.1 `createPaymentIntent` (서버 금액 및 배송지 검증)

- **위치**: [`backend/src/controllers/payment.controller.js`](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/backend/src/controllers/payment.controller.js)
- **주요 기능**:
  - `shippingAddress` 6개 필수 필드(`fullName`, `streetAddress`, `city`, `state`, `zipCode`, `phoneNumber`)의 유효성 검증
  - 장바구니 상품 재고 확인 및 서버 측 배송비(10만원 이상 무료, 미만 3,000원) 및 세금(10%) 자동 산정
  - Stripe Customer 자동 조회/생성
  - Compact 메타데이터 직렬화 (500자 제한 준수)

### 2.2 `createOrder` (원자적 재고 차감 및 멱등성 가드)

- **위치**: [`backend/src/controllers/order.controller.js`](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/backend/src/controllers/order.controller.js)
- **주요 기능**:
  - **🛡️ 멱등성 이중 차감 방지 가드**: 동일한 `paymentResult.id` (Stripe PaymentIntent ID)로 요청이 재전송되더라도 이중 재고 차감 및 중복 주문 생성을 완벽 차단
  - **🛡️ 금액 및 배송지 엄격 검증**: 클라이언트 `totalPrice`가 서버에서 계산된 `calculatedTotalPrice`와 다르면 400 에러 처리
  - **📦 Mongoose Session/Transaction**: 재고 차감 + 주문 생성 + 장바구니 비우기를 원자적(Atomic)으로 실행

---

## 3. 모바일 앱 (Expo Stripe Native PaymentSheet) 연동

`mobile/app/(tabs)/cart.tsx`:

```typescript
import { useStripe } from '@stripe/stripe-react-native';

const { initPaymentSheet, presentPaymentSheet } = useStripe();

const handleCheckout = async () => {
  // 1. PaymentIntent 생성 요청
  const { clientSecret, paymentIntentId } = await api.createPaymentIntent({
    cartItems,
    shippingAddress,
  });

  // 2. Stripe Native PaymentSheet 초기화
  const { error: initError } = await initPaymentSheet({
    paymentIntentClientSecret: clientSecret,
    merchantDisplayName: 'My Commerce Store',
  });
  if (initError) return alert(initError.message);

  // 3. 결제 모달 표시
  const { error: paymentError } = await presentPaymentSheet();
  if (paymentError) return alert(paymentError.message);

  // 4. 결제 성공 후 직통 주문 생성
  await createOrderMutation.mutateAsync({
    orderItems: cartItems,
    shippingAddress,
    totalPrice: calculatedTotal,
    paymentResult: {
      id: paymentIntentId,
      status: 'COMPLETED',
    },
  });
};
```

---

## 4. 웹 프론트엔드 (React Stripe Elements) 연동

React 웹에서는 `@stripe/react-stripe-js` 및 `@stripe/stripe-js`를 활용하여 동일한 파이프라인으로 결제 및 주문 작성을 수행합니다.

---

## 5. ⚠️ 결제 보안 및 이슈 트러블슈팅

1. **`LIMIT_FILE_SIZE` 및 배송지 유효성 검증 오류**:
   - `shippingAddress`의 6개 필수 필드 중 하나라도 누락되면 400 에러와 함께 명확한 안내 메시지가 전달됩니다.
2. **이중 결제 차감 방지**:
   - 동일한 PaymentIntent ID로 여러 번 요청이 오더라도 DB 가드에 의해 200 OK와 함께 기존 주문 정보를 안전하게 반환합니다.
3. **KRW 원화 결제 금액 정수 전달**:
   - Stripe API는 원화(KRW) 결제 시 소수점을 취하지 않고 정수 금액(`Math.round`)으로 전송해야 합니다.

---

© Web & Mobile Fullstack E-Commerce Platform. All rights reserved.
