import Stripe from "stripe";
import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import { Cart } from "../models/cart.model.js";
import { createOrderNotification } from "../utils/notification.js";
import dotenv from "dotenv";

dotenv.config();

// Stripe 클라이언트 모듈 레벨 싱글톤 캐싱 (메모리 낭비 방지)
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

    // Stripe Metadata 500자 제한을 고려한 compact 상품 목록 JSON 직렬화
    const compactItems = cartWithProductData.map((p) => ({
      productId: p.product,
      name: p.name,
      quantity: p.quantity,
      price: p.price,
      image: p.image,
    }));
    const itemsSummary = JSON.stringify(compactItems).slice(0, 480);

    // 배송비 및 세금 계산 (10만원 이상 무료배송, 10만원 미만 고정 3,000원)
    const shippingFee = subtotal >= 100000 ? 0 : 3000;
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

        // DB에 stripeCustomerId 저장
        await User.findByIdAndUpdate(user._id, {
          $set: { stripeCustomerId: customerId },
        }, { returnDocument: "after" });
      } catch (createCustErr) {
        console.warn("[Stripe Customer Create Warning]:", createCustErr.message);
        customerId = undefined;
      }
    }

    // Stripe PaymentIntent 생성 (Metadata 및 Shipping 정보 연동)
    const paymentIntent = await stripe.paymentIntents.create({
      customer: customerId,
      amount: totalAmount, // KRW 원화 금액 정수
      currency: "krw",
      automatic_payment_methods: {
        enabled: true,
      },
      shipping: {
        name: shippingAddress.fullName || user.name || "고객",
        phone: shippingAddress.phoneNumber || shippingAddress.phone || "",
        address: {
          line1: shippingAddress.streetAddress || shippingAddress.address || "",
          city: shippingAddress.city || "",
          state: shippingAddress.state || "",
          postal_code: shippingAddress.zipCode || shippingAddress.postalCode || "",
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
        shippingFullName: shippingAddress.fullName || "",
        shippingStreetAddress: shippingAddress.streetAddress || shippingAddress.address || "",
        shippingCity: shippingAddress.city || "",
        shippingState: shippingAddress.state || "",
        shippingZipCode: shippingAddress.zipCode || shippingAddress.postalCode || "",
        shippingPhoneNumber: shippingAddress.phoneNumber || shippingAddress.phone || "",
        itemsSummary,
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
 * [Expo Go 환경 호환을 위해 주석 처리됨]
 * Expo Go 환경에서는 외부 Webhook 비동기 콜백 대신 결제 승인 후 직통 API 요청(/api/orders)을 통해
 * 웹훅과 동일한 효과(주문 생성, 재고 차감, 카트 비우기, 알림 발송)를 처리합니다.
 */
export const handleStripeWebhook = async (req, res) => {
  // Expo Go 및 직통 결제 흐름 사용으로 인해 Webhook 수신 비활성화
  return res.status(200).json({
    message: "Stripe Webhook은 Expo Go 직통 결제 모드로 동작 중입니다.",
    received: true,
  });
  /*
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const payload = req.rawBody || req.body;

  let event;

  try {
    if (webhookSecret && sig) {
      const stripe = getStripeClient();
      event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
    } else {
      // 개발 및 로컬 테스트 환경인 경우 Signature 검증 생략 파싱 fallback
      const rawBodyStr = payload instanceof Buffer ? payload.toString("utf8") : payload;
      event = typeof rawBodyStr === "string" ? JSON.parse(rawBodyStr) : rawBodyStr;
    }
  } catch (err) {
    console.error(`[Stripe Webhook Signature Verification Error]: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (!event || !event.type) {
    return res.status(400).send("Invalid event payload");
  }

  // 🔔 결제 성공 이벤트 수신 (payment_intent.succeeded)
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;

    try {
      const metadata = paymentIntent.metadata || {};
      const {
        userId,
        clerkId,
        shippingFullName,
        shippingStreetAddress,
        shippingCity,
        shippingState,
        shippingZipCode,
        shippingPhoneNumber,
        itemsSummary,
      } = metadata;

      if (userId) {
        // 1. 🛡️ 멱등성 단일 차감 가드: 클라이언트 앱(/api/orders) 또는 이전 Webhook에 의해 이미 Order DB가 생성된 경우 중복 차감 완전 차단
        const existingOrder = await Order.findOne({
          "paymentResult.id": paymentIntent.id,
        });

        if (!existingOrder) {
          const subtotal = Number(metadata.subtotal) || 0;
          const shippingFee = Number(metadata.shippingFee) || 0;
          const taxAmount = Number(metadata.taxAmount) || 0;
          const totalPrice = Number(metadata.totalAmount) || paymentIntent.amount || 0;

          let restoredOrderItems = [];
          if (itemsSummary) {
            try {
              restoredOrderItems = JSON.parse(itemsSummary);
              
              // 📦 최초 1등 주문 DB 생성 시점에 단 1회만 상품 재고(stock) 차감 처리
              for (const item of restoredOrderItems) {
                const pId = item.productId || item.product;
                const qty = Number(item.quantity) || 1;
                if (pId) {
                  await Product.findByIdAndUpdate(pId, {
                    $inc: { stock: -qty },
                  });
                }
              }
            } catch (pErr) {
              console.warn("[Stripe Webhook]: itemsSummary JSON parse / stock update error", pErr.message);
            }
          }

          const formattedShippingAddress = {
            fullName: shippingFullName || paymentIntent.shipping?.name || "홍길동",
            streetAddress: shippingStreetAddress || paymentIntent.shipping?.address?.line1 || "테헤란로 123",
            city: shippingCity || paymentIntent.shipping?.address?.city || "서울",
            state: shippingState || paymentIntent.shipping?.address?.state || "서울특별시",
            zipCode: shippingZipCode || paymentIntent.shipping?.address?.postal_code || "06234",
            phoneNumber: shippingPhoneNumber || paymentIntent.shipping?.phone || "010-0000-0000",
          };

          const paymentResult = {
            id: paymentIntent.id,
            status: "COMPLETED",
            update_time: new Date().toISOString(),
            email_address: paymentIntent.receipt_email || "",
          };

          // 2. 주문 DB 자동 생성 (Webhook 비동기 100% 보장 복원)
          const order = await Order.create({
            userId,
            clerkId: clerkId || "",
            orderItems: restoredOrderItems,
            shippingAddress: formattedShippingAddress,
            paymentResult,
            subtotal,
            shippingFee,
            taxAmount,
            totalPrice,
            status: "processing",
          });

          // 3. 해당 유저 장바구니 비우기
          await Cart.findOneAndUpdate({ userId }, { items: [] });

          // 4. DB 알림 자동 연동
          await createOrderNotification({
            userId,
            orderId: order._id,
            status: "created",
            orderItems: [],
            totalPrice,
          });

          console.log(`[Stripe Webhook Success]: Order ${order._id} created for PaymentIntent ${paymentIntent.id}`);
        } else {
          console.log(`[Stripe Webhook]: Order already exists for PaymentIntent ${paymentIntent.id}`);
        }
      }
    } catch (webhookProcessingErr) {
      console.error("[Stripe Webhook Processing Error]:", webhookProcessingErr);
      return res.status(500).json({ message: webhookProcessingErr.message });
    }
  }

  return res.status(200).json({ received: true });
  */
};

