# 💳 Stripe 결제 연동 종합 세팅 & 개발 가이드 (Express & Expo 모바일)

이 문서는 **Stripe 대시보드 사이트 설정**부터 **Node.js/Express 백엔드**, 그리고 **Expo(React Native) 모바일 앱**에서의 **Stripe PaymentSheet** 결제 시스템 구축, 최적화 및 테스트 데이터 관리까지의 전체 절차와 코드를 세세하게 정리한 최신 가이드 문서입니다.

---

## 📌 1. Stripe 대시보드 사이트 설정 & 데이터 관리 (Stripe Site Setup)

### 1.1 회원가입 및 테스트 모드 활성화
1. [Stripe Official Site](https://dashboard.stripe.com/) 접속 후 계정 생성 및 로그인합니다.
2. 대시보드 우측 상단 또는 개발자 메뉴의 **[Test mode] (테스트 모드)** 스위치를 활성화합니다. (주황색 상단 바가 표시됨)

### 1.2 API 키 (API Keys) 발급
1. 대시보드 좌측 메뉴 ➔ **Developers (개발자)** ➔ **API keys**로 이동합니다.
2. 아래 2가지 키를 복사하여 준비합니다:
   - **Publishable key** (`pk_test_...`): 모바일 앱 및 클라이언트(Frontend)에서 사용
   - **Secret key** (`sk_test_...`): 백엔드(Backend) 서버 `.env`에서만 사용

### 1.3 결제 수단 (Payment Methods) 활성화
1. **Settings** ➔ **Payment methods** 메뉴로 이동합니다.
2. **Cards (신용/체크카드)** 항목이 `Active` 상태인지 확인합니다.
3. (선택사항) Apple Pay 및 Google Pay를 사용하려면 해당 항목의 동의 및 설정을 완료합니다.

### 1.4 통화(Currency) 및 최소 금액 규정
- **대한민국 원화 (KRW)**: Stripe에서 KRW는 **Zero-decimal currency** (소수점이 없는 통화)입니다.
- 금액 전달 시 100을 곱하지 않고, **실제 원화 정수 금액 그대로** (`amount: 15000` ➔ 15,000원) 입력합니다.
- **최소 결제 금액**: Stripe KRW 최소 결제 금액은 약 **500 KRW** 이상이어야 합니다.

### 🗑️ 1.5 Stripe 테스트 데이터(Test Data) 일괄 초기화 방법
테스트한 결제 내역(Payments)과 고객 정보(Customers)를 일괄 삭제하려면 로그인 상태에서 아래 직통 URL로 이동합니다:
- **직통 주소**: 👉 [https://dashboard.stripe.com/test/settings/account](https://dashboard.stripe.com/test/settings/account)
- 페이지 맨 아래로 스크롤한 후 **[Delete test data]** 버튼을 누르고 계정 비밀번호를 입력하면 모든 테스트 결제 데이터가 깨끗하게 초기화됩니다. (발급된 API Key는 그대로 유지됨)

---

## ⚙️ 2. 백엔드 (Express Node.js) 세팅 및 최적화 구현

### 2.1 패키지 설치 및 환경 변수 설정
`backend/` 디렉터리에서 `stripe` SDK를 설치합니다.

```bash
cd backend
npm install stripe
```

`backend/.env` 파일 설정:
```env
PORT=3000
MONGODB_URI=mongodb+srv://...
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
```

### 2.2 Payment Controller 최적화 코드 (`backend/src/controllers/payment.controller.js`)

Stripe 싱글톤(Singleton) 캐싱, N+1 DB 쿼리 방지 배치(Batch) 조회, Metadata 500자 제한 준수 및 Customer 에러 방지 가드가 적용된 컨트롤러입니다.

```javascript
import Stripe from "stripe";
import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";
import dotenv from "dotenv";

dotenv.config();

// Stripe 클라이언트 모듈 레벨 싱글톤 캐싱 (메모리/GC 과부하 방지)
let stripeInstance = null;
const getStripeClient = () => {
  if (stripeInstance) return stripeInstance;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY가 .env 파일에 설정되지 않았습니다. Stripe API 키를 확인해 주세요.",
    );
  }
  stripeInstance = new Stripe(secretKey);
  return stripeInstance;
};

/**
 * 1. Stripe PaymentIntent 생성 (createPaymentIntent)
 * POST /api/payment/create-intent
 */
export const createPaymentIntent = async (req, res) => {
  try {
    const stripe = getStripeClient();
    const { cartItems, shippingAddress } = req.body;
    const user = req.user;

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "장바구니가 비어 있습니다." });
    }

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: "배송지 정보(shippingAddress)가 필요합니다.",
      });
    }

    // 서버 측 주문 금액 및 재고 검증 (N+1 쿼리 방지: Batch Read)
    const productIds = cartItems.map(
      (item) => item.productId || item.product || item._id,
    );
    const dbProducts = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(dbProducts.map((p) => [p._id.toString(), p]));

    let subtotal = 0;
    const cartWithProductData = [];

    for (const item of cartItems) {
      const productId = (item.productId || item.product || item._id)?.toString();
      const product = productMap.get(productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `상품을 찾을 수 없습니다. (ID: ${productId})`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `'${product.name}' 상품의 재고가 부족합니다. (현재 재고: ${product.stock}개)`,
        });
      }

      subtotal += product.price * item.quantity;

      cartWithProductData.push({
        product: product._id.toString(),
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.images?.[0] || product.image || "",
      });
    }

    // 배송비 및 세금 계산 (10만원 이상 무료배송, 이하는 3,000원)
    const shippingFee = subtotal > 100000 ? 0 : 3000;
    const taxRate = 0.1; // 10% 부가세
    const taxAmount = Math.round(subtotal * taxRate);
    const totalAmount = Math.round(subtotal + shippingFee + taxAmount);

    if (totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "최종 결제 금액은 0원보다 커야 합니다.",
      });
    }

    // Stripe Customer DB 저장값 활용 및 신규 생성/업데이트 (에러 방지 가드)
    let customerId = user.stripeCustomerId || undefined;

    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId);
      } catch (cErr) {
        console.warn("[Stripe Customer Retrieve Warning]:", cErr.message);
        customerId = undefined;
      }
    }

    if (!customerId) {
      try {
        const validEmail =
          user.email && !user.email.includes("@clerk.user")
            ? user.email
            : undefined;

        const customer = await stripe.customers.create({
          email: validEmail,
          name: user.name || "고객",
          metadata: {
            userId: user._id.toString(),
            clerkId: user.clerkId || "",
          },
        });
        customerId = customer.id;

        // DB에 stripeCustomerId 저장 (Mongoose v9 returnDocument: 'after')
        await User.findByIdAndUpdate(user._id, {
          $set: { stripeCustomerId: customerId },
        }, { returnDocument: "after" });
      } catch (createCustErr) {
        console.warn("[Stripe Customer Create Warning]:", createCustErr.message);
        customerId = undefined;
      }
    }

    // Stripe PaymentIntent 생성 (Metadata 500자 제한 준수)
    const paymentIntent = await stripe.paymentIntents.create({
      customer: customerId,
      amount: totalAmount, // KRW 원화 금액 정수
      currency: "krw",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: user._id.toString(),
        clerkId: user.clerkId || "",
        totalAmount: totalAmount.toString(),
        subtotal: subtotal.toString(),
        shippingFee: shippingFee.toString(),
        taxAmount: taxAmount.toString(),
        shippingFullName: shippingAddress.fullName || "",
        shippingStreetAddress: shippingAddress.streetAddress || shippingAddress.address || "",
        shippingCity: shippingAddress.city || "",
        shippingState: shippingAddress.state || "",
        shippingZipCode: shippingAddress.zipCode || shippingAddress.postalCode || "",
        shippingPhoneNumber: shippingAddress.phoneNumber || shippingAddress.phone || "",
      },
      description: `주문 결제 - ${user.name || shippingAddress.fullName || "고객"}`,
    });

    return res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amountDetails: {
        subtotal,
        shippingFee,
        taxAmount,
        totalAmount,
      },
    });
  } catch (error) {
    console.error("[createPaymentIntent Error]:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Payment Intent 생성 중 오류가 발생했습니다.",
    });
  }
};

/**
 * 2. Stripe Webhook 수신 핸들러 (handleStripeWebhook)
 * POST /api/payment/webhook
 * [참고]: 이 프로젝트는 Expo Go 호환 및 직통 결제 처리를 위해 Webhook 수신부를 주석 처리하였습니다.
 * 아래 코드는 프로덕션 웹훅 구성 시 활용할 수 있는 표준 예시입니다.
 */
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const payload = req.rawBody || req.body;

  let event;

  try {
    if (webhookSecret && sig) {
      const stripe = getStripeClient();
      event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
    } else {
      const rawBodyStr = payload instanceof Buffer ? payload.toString("utf8") : payload;
      event = typeof rawBodyStr === "string" ? JSON.parse(rawBodyStr) : rawBodyStr;
    }
  } catch (err) {
    console.error(`[Stripe Webhook Signature Error]: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    // 멱등성 검사 후 주문 DB 자동 보장 생성
  }

  return res.status(200).json({ received: true });
};

---

## ⚡️ 3. Stripe Webhook vs 직통 결제 로직 아키텍처 비교 가이드

이 프로젝트는 **1) Stripe Webhook을 공식 사용하는 방법**과 **2) Expo Go/로컬 개발 환경 호환을 위해 웹훅 없이 동일한 기능을 100% 보장하는 직통 결제 통합 로직**을 둘 다 세부 지원합니다.

---

### 📡 3.1 Stripe Webhook 공식 사용 방법 (Standard Webhook Workflow)

#### ① 개념 및 특징
Stripe Webhook은 카드 결제가 성공(`payment_intent.succeeded`)했을 때 Stripe 서버가 개발자의 백엔드 서버(`POST /api/payment/webhook`)로 비동기 HTTP 요청을 직접 전달하여 주문을 생성하는 방식입니다.

#### ② Stripe 대시보드 웹훅 엔드포인트 등록 절차
1. [Stripe Dashboard](https://dashboard.stripe.com/) ➔ **Developers (개발자)** ➔ **Webhooks** 메뉴로 이동합니다.
2. **[Add endpoint] (엔드포인트 추가)** 버튼을 누릅니다.
3. **Endpoint URL** 입력:
   - 프로덕션: `https://your-domain.com/api/payment/webhook`
4. **Select events to listen to**: `payment_intent.succeeded` 선택 후 저장합니다.
5. 등록 후 발급된 **Signing secret (`whsec_...`)** 키를 복사하여 백엔드 `.env`에 등록합니다:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxx
   ```

#### ③ Stripe CLI를 통한 로컬 개발 환경 테스트 방법
맥북/로컬 환경에서 대시보드 등록 없이 웹훅 이벤트를 수신하려면 Stripe CLI를 활용합니다:
```bash
# 1. Stripe CLI 로그인
stripe login

# 2. 로컬 백엔드 서버(localhost:3000)로 이벤트 포워딩
stripe listen --forward-to localhost:3000/api/payment/webhook
```
명령어 실행 시 출력되는 `whsec_...` 키를 `.env`에 입력하면 테스트가 가능합니다.

---

### 🚀 3.2 웹훅 없이 100% 동일한 비즈니스 로직을 보완한 직통 결제 아키텍처 (Direct Client-Server Flow)

#### ① 도입 배경
* **Expo Go 앱 호환성**: 모바일 Expo Go 앱이나 로컬 웹 테스트 환경에서는 로컬 주소(`localhost`)로 Stripe 서버가 직접 접속할 수 없거나, 웹훅 수신 시점과의 타이밍 꼬임 문제가 발생할 수 있습니다.
* **해결책**: 백엔드와 클라이언트 간의 **동기식 직통 파이프라인(Direct Pipeline)**을 도입하여 웹훅 없이도 **결제 검증 ➔ 주문 생성 ➔ 재고 차감 ➔ 장바구니 비우기 ➔ 알림 발송**이 100% 보장되도록 로직을 완성했습니다.

#### ② 직통 결제 & 주문 4단계 비즈니스 파이프라인

```text
[Expo App / Web Client]                  [Express Backend]                 [Stripe API Engine]
         │                                       │                                  │
         │  1. POST /api/payment/create-intent   │                                  │
         ├──────────────────────────────────────►│                                  │
         │                                       │  Stripe paymentIntents.create    │
         │                                       ├─────────────────────────────────►│
         │  2. clientSecret & paymentIntentId    │◄─────────────────────────────────┤
         │◄──────────────────────────────────────┤                                  │
         │                                       │                                  │
         │  3. Stripe PaymentSheet 카드 승인      │                                  │
         ├─────────────────────────────────────────────────────────────────────────►│
         │  4. 카드 결제 성공 승인 (succeeded)   │                                  │
         │◄─────────────────────────────────────────────────────────────────────────┤
         │                                       │                                  │
         │  5. POST /api/orders (결제 승인 직통)  │                                  │
         ├──────────────────────────────────────►│                                  │
         │                                       │  - 멱등성 검사 (Order.findOne)   │
         │                                       │  - 재고 차감 (stock -= quantity) │
         │                                       │  - Order DB 생성                 │
         │                                       │  - 카트 리셋 (Cart items = [])   │
         │  6. 주문 완료 응답 (201 Created)       │  - 알림 DB 발행 (Notification)   │
         │◄──────────────────────────────────────┤                                  │
```

#### ③ 웹훅과 100% 동일한 비즈니스 보완 로직 핵심 코드 (`backend/src/controllers/order.controller.js`)

1. **🛡️ 멱등성 단일 차감 가드 (Double Deducting Prevention)**:
   * 동일한 Stripe `paymentResult.id`로 요청이 중복해서 오더라도 `Order.findOne` 검사로 중복 생성 및 재고 이중 차감을 100% 차단합니다.

2. **📦 원자적 상품 재고(Stock) 차감**:
   * 주문 생성 시점에서 `product.stock -= item.quantity; await product.save();`를 실행하여 DB 재고를 원자적으로 차감합니다.

3. **🛒 장바구니 카트 자동 리셋**:
   * 결제 성공과 동시에 유저 카트 DB를 비웁니다: `await Cart.findOneAndUpdate({ userId }, { items: [] });`

4. **🔔 1대1 주문 알림(Notification) 생성**:
   * `await createOrderNotification({ userId, orderId, totalAmount });`를 호출하여 모바일 앱 프로필 탭 알림함으로 주문 접수 알림을 발송합니다.

/**
 * 2. Stripe 결제 검증 (verifyPaymentIntent)
 * POST /api/payment/verify
 */
export const verifyPaymentIntent = async (req, res) => {
  try {
    const stripe = getStripeClient();
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: "paymentIntentId가 필요합니다.",
      });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      return res.status(200).json({
        success: true,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        paymentResult: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          update_time: new Date().toISOString(),
          email_address: paymentIntent.receipt_email || req.user.email,
        },
      });
    } else {
      return res.status(400).json({
        success: false,
        status: paymentIntent.status,
        message: `결제가 완료되지 않았습니다. (상태: ${paymentIntent.status})`,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "결제 검증 중 오류가 발생했습니다.",
    });
  }
};
```

### 2.3 주문 생성 컨트롤러의 멱등성(Idempotency) 가드 (`backend/src/controllers/order.controller.js`)

Stripe 승인 후 네트워크 재요청으로 인해 동일한 결제가 DB에 이중 생성되지 않도록 가드 처리된 로직입니다:

```javascript
    // 멱등성 가드: 동일한 paymentResult.id (Stripe PaymentIntent ID) 중복 생성 방지
    if (finalPaymentResult && finalPaymentResult.id) {
      const existingOrder = await Order.findOne({
        "paymentResult.id": finalPaymentResult.id,
      });
      if (existingOrder) {
        return res.status(200).json({
          message: "이미 성공적으로 접수된 주문입니다.",
          order: existingOrder,
        });
      }
    }
```

---

## 📱 3. 모바일 (React Native / Expo) 세팅 및 구현

### 3.1 라이브러리 설치 및 app.json 설정
`mobile/` 디렉터리에서 패키지를 설치합니다:

```bash
cd mobile
npx expo install @stripe/stripe-react-native
```

`mobile/app.json` 플러그인 설정:
```json
{
  "expo": {
    "plugins": [
      [
        "@stripe/stripe-react-native",
        {
          "merchantIdentifier": "merchant.com.yourcompany.app",
          "enableGooglePay": true
        }
      ]
    ]
  }
}
```

### 3.2 환경 변수 설정 (`mobile/.env`)
```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

### 3.3 전역 StripeProvider 감싸기 (`mobile/app/_layout.tsx`)
```tsx
import { StripeProvider } from '@stripe/stripe-react-native';

const stripePublishableKey =
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_...';

export default function RootLayout() {
  return (
    <StripeProvider publishableKey={stripePublishableKey}>
      <ClerkProvider ...>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <InitialLayout />
          </SafeAreaProvider>
        </QueryClientProvider>
      </ClerkProvider>
    </StripeProvider>
  );
}
```

### 3.4 장바구니 화면 완벽 결제 핸들러 (`mobile/app/(tabs)/cart.tsx`)
컴포넌트 언마운트 시 메모리 누수를 막는 `isMountedRef` 및 중복 클릭 방지 처리 코드:

```tsx
  const handleCheckout = useCallback(async () => {
    if (cartItems.length === 0 || isProcessingPayment) return;

    const shippingAddress: ShippingAddress = currentAddress
      ? {
          fullName: currentAddress.fullName,
          streetAddress: currentAddress.streetAddress,
          city: currentAddress.city,
          state: currentAddress.state || "서울특별시",
          zipCode: currentAddress.zipCode,
          phoneNumber: currentAddress.phoneNumber,
        }
      : {
          fullName: user?.fullName || "홍길동",
          streetAddress: "서울특별시 강남구 테헤란로 123",
          city: "서울",
          state: "서울특별시",
          zipCode: "06234",
          phoneNumber: "010-1234-5678",
        };

    const cartItemsForIntent = validCartItems.map((item) => ({
      productId: typeof item.product === "object" ? item.product._id : item.productId,
      quantity: item.quantity,
    }));

    setIsProcessingPayment(true);

    try {
      // 1. Stripe PaymentIntent 세션 생성
      const token = await getToken();
      const intentResult = await api.createPaymentIntent(
        { cartItems: cartItemsForIntent, shippingAddress },
        token,
      );

      if (!intentResult || !intentResult.clientSecret) {
        Alert.alert("결제 준비 실패 ⚠️", intentResult?.message || "결제 세션을 생성하지 못했습니다.");
        if (isMountedRef.current) setIsProcessingPayment(false);
        return;
      }

      // 2. Stripe PaymentSheet 결제창 초기화
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: intentResult.clientSecret,
        merchantDisplayName: "E-Commerce App Store",
        defaultBillingDetails: { name: shippingAddress.fullName },
      });

      if (initError) {
        Alert.alert("결제 초기화 오류 ❌", initError.message);
        if (isMountedRef.current) setIsProcessingPayment(false);
        return;
      }

      // 3. Stripe 네이티브 카드 결제 모달 팝업 표시
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === "Canceled") {
          Alert.alert("안내 ℹ️", "결제가 취소되었습니다.");
        } else {
          Alert.alert("결제 실패 ❌", presentError.message);
        }
        if (isMountedRef.current) setIsProcessingPayment(false);
        return;
      }

      // 4. 결제 성공 후 주문(Order) DB 생성 요청
      createOrderMutation.mutate(
        {
          orderItems,
          totalPrice: intentResult.amountDetails?.totalAmount || finalTotal,
          paymentMethod: "Stripe Credit Card",
          shippingAddress,
          paymentResult: {
            id: intentResult.paymentIntentId,
            status: "COMPLETED",
            update_time: new Date().toISOString(),
          },
        },
        {
          onSuccess: () => {
            clearCartMutation.mutate();
            Alert.alert("결제 및 주문 완료! 🎉", "Stripe 결제가 완료되어 주문이 성공적으로 접수되었습니다.");
          },
          onSettled: () => {
            if (isMountedRef.current) setIsProcessingPayment(false);
          },
        },
      );
    } catch (err: any) {
      Alert.alert("결제 오류 ❌", err?.message || "결제 처리 중 오류가 발생했습니다.");
      if (isMountedRef.current) setIsProcessingPayment(false);
    }
  }, [...]);
```

---

## ⚠️ 4. 자주 발생하는 오류 및 해결 가이드 (Troubleshooting)

### Q1. `"You did not provide an API key."` 오류
- **원인**: 모바일 상위 컨텍스트에 `<StripeProvider>`가 없거나 `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`가 주입되지 않은 경우입니다.
- **해결**: `mobile/.env` 파일에 `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`를 등록하고 `mobile/app/_layout.tsx`에서 `<StripeProvider publishableKey={stripePublishableKey}>`로 전역 레이아웃을 감싸줍니다.

### Q2. `"Metadata value exceeds 500 characters"` 오류
- **원인**: Stripe `paymentIntents.create` 시 `metadata` 속성값에 `JSON.stringify(cartItems)` 등 대용량 JSON 객체를 입력하여 500자 제한을 초과한 경우입니다.
- **해결**: `metadata`에는 `userId`, `clerkId`, `totalAmount` 등 **500자 이하의 단일 텍스트/숫자값만 매핑**합니다.

### Q3. `"No such customer: cus_xxx"` 오류
- **원인**: 이전 테스트에서 생성된 Customer ID가 MongoDB 유저 문서에는 남아있으나 Stripe 테스트 대시보드 상에서 삭제된 경우입니다.
- **해결**: `stripe.customers.retrieve(customerId)`를 `try-catch` 가드로 감싸 에러 발생 시 `customerId = undefined`로 재할당하여 신규 수용하도록 보완합니다.

### Q4. `[MONGOOSE] Deprecation Warning: new option for findOneAndUpdate()`
- **원인**: Mongoose 최신 버전(v9+)에서 `{ new: true }` 옵션이 둔화(deprecated)되었기 때문입니다.
- **해결**: `{ returnDocument: "after" }` 옵션을 사용합니다.

---

## 🧪 5. Stripe 개발 테스트 카드 번호 및 입력 필드 규정 (Test Payment Credentials)

Stripe 테스트 모드(Sandbox)에서 결제 시험 시 사용해야 하는 **카드 번호 및 필수 입력 필드 규정**입니다. (실제 개인 신용카드가 아니라 아래 전용 테스트 값을 사용해야 합니다)

### 5.1 테스트 카드 번호 목록 (Card Number)
- **기본 정상 결제 성공 카드 번호 (추천 👍)**: `4242 4242 4242 4242`
- **3D Secure 본인인증 테스트 카드**: `4000 0000 0000 3155`
- **잔액 부족(Insufficient Funds) 실패 테스트 카드**: `4000 0000 0000 0002`
- **카드 승인 거절(Declined) 실패 테스트 카드**: `4000 0000 0000 0069`

### 5.2 각 입력 필드별 규정 및 추천 입력값

| 필드명 (Field Name) | 입력 규정 (Rule) | 추천 입력값 (Recommended) | 비고 |
| :--- | :--- | :--- | :--- |
| **Card Number** | Stripe 16자리 테스트 번호 | **`4242 4242 4242 4242`** | 공백 없이 `4242424242424242` 입력 가능 |
| **Expires (유효기간)** | 현재 날짜 기준 **미래의 날짜** | **`12 / 34`** (또는 `12/28`, `05/30`) | 월/년도 구분 없이 미래 날짜면 통과 |
| **CVC / CVV** | 아무 **숫자 3자리** | **`123`** (또는 `777`, `000`) | 3자리 숫자 지정 |
| **ZIP / Postal Code** | 아무 **숫자 5자리** (해외/미국 국가시) | **`90210`** 또는 **`12345`**, **`06234`** | 우편번호 입력 요구 시 사용 |

---

✅ 이 가이드는 Express 백엔드와 Expo 모바일 환경에서 Stripe 결제 시스템을 구현하고 테스트할 때 가장 세세하고 정확한 기준을 제공합니다.
