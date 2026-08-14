import Stripe from "stripe";
import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";
import dotenv from "dotenv";

dotenv.config();

const SHIPPING_FEE = 3000;
const TAX_RATE = 0.1; // 10% 부가세

// Stripe 클라이언트 싱글톤 캐스
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
 */
export const createPaymentIntent = async (req, res) => {
  try {
    const stripe = getStripeClient();
    const { cartItems, shippingAddress } = req.body;
    const user = req.user;

    // 🛡️ 1. 장바구니 유효성 검증
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "장바구니가 비어 있습니다." });
    }

    // 🛡️ 2. 배송지 정보(shippingAddress) 필수 항목 유효성 검증
    if (!shippingAddress || typeof shippingAddress !== "object") {
      return res.status(400).json({
        success: false,
        message: "배송지 정보(shippingAddress)가 올바르지 않습니다.",
      });
    }

    const fullName = String(shippingAddress.fullName || "").trim();
    const streetAddress = String(
      shippingAddress.streetAddress || shippingAddress.address || "",
    ).trim();
    const city = String(shippingAddress.city || "").trim();
    const state = String(shippingAddress.state || "").trim();
    const zipCode = String(
      shippingAddress.zipCode || shippingAddress.postalCode || "",
    ).trim();
    const phoneNumber = String(
      shippingAddress.phoneNumber || shippingAddress.phone || "",
    ).trim();

    if (
      !fullName ||
      !streetAddress ||
      !city ||
      !state ||
      !zipCode ||
      !phoneNumber
    ) {
      return res.status(400).json({
        success: false,
        message:
          "배송지 정보의 모든 필수 필드(이름, 주소, 도시, 도/시, 우편번호, 전화번호)를 입력해 주세요.",
      });
    }

    // 🛡️ 3. 서버 측 상품 재고 및 금액 산정 (N+1 쿼리 방지: Batch Read)
    const productIds = cartItems.map(
      (item) => item.productId || item.product || item._id,
    );
    const dbProducts = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(dbProducts.map((p) => [p._id.toString(), p]));

    let subtotal = 0;
    const compactItems = [];

    for (const item of cartItems) {
      const productId = (
        item.productId ||
        item.product ||
        item._id
      )?.toString();
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

      const itemPrice = product.price || 0;
      const itemQty = Number(item.quantity) || 1;
      subtotal += itemPrice * itemQty;

      // 단일 루프 내에서 Stripe Metadata용 Compact 아이템 생성 (중복 재맵핑 축소)
      compactItems.push({
        productId: product._id.toString(),
        name: product.name,
        quantity: itemQty,
        price: itemPrice,
        image: product.images?.[0] || product.image || "",
      });
    }

    // Stripe Metadata 500자 제한을 고려한 상품 목록 JSON 직렬화
    const itemsSummary = JSON.stringify(compactItems).slice(0, 480);

    // 배송비 및 세금 산정 (10만원 이상 무료배송, 10만원 미만 고정 3,000원)
    const shippingFee = subtotal >= 100000 ? 0 : SHIPPING_FEE;
    const taxAmount = Math.round(subtotal * TAX_RATE);
    const totalAmount = Math.round(subtotal + shippingFee + taxAmount);

    if (totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "최종 결제 금액은 0원보다 커야 합니다.",
      });
    }

    // 🛡️ 4. Stripe Customer 조회 및 생성 처리
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
          name: fullName || user.name || "고객",
          metadata: {
            userId: user._id.toString(),
            clerkId: user.clerkId || "",
          },
        });
        customerId = customer.id;

        await User.findByIdAndUpdate(user._id, {
          $set: { stripeCustomerId: customerId },
        });
      } catch (createCustErr) {
        console.warn(
          "[Stripe Customer Create Warning]:",
          createCustErr.message,
        );
        customerId = undefined;
      }
    }

    // 💳 5. Stripe PaymentIntent 생성
    const paymentIntent = await stripe.paymentIntents.create({
      customer: customerId,
      amount: totalAmount, // KRW 원화 정수 금액
      currency: "krw",
      automatic_payment_methods: {
        enabled: true,
      },
      shipping: {
        name: fullName,
        phone: phoneNumber,
        address: {
          line1: streetAddress,
          city,
          state,
          postal_code: zipCode,
          country: "KR",
        },
      },
      metadata: {
        userId: user._id.toString(),
        clerkId: user.clerkId || "",
        totalAmount: totalAmount.toString(),
        subtotal: subtotal.toString(),
        shippingFee: shippingFee.toString(),
        taxAmount: taxAmount.toString(),
        shippingFullName: fullName,
        shippingStreetAddress: streetAddress,
        shippingCity: city,
        shippingState: state,
        shippingZipCode: zipCode,
        shippingPhoneNumber: phoneNumber,
        itemsSummary,
      },
      description: `주문 결제 - ${fullName} 고객님`,
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
 * NOTE: Expo Go 및 웹/모바일 앱 직통 결제 승인 방식(`/api/orders`)을 사용하므로
 * 외부 Webhook 수신은 비활성화 상태로 응답만 반환합니다.
 */
export const handleStripeWebhook = async (req, res) => {
  return res.status(200).json({
    message: "Stripe Webhook은 Expo Go 직통 결제 모드로 동작 중입니다.",
    received: true,
  });
};
