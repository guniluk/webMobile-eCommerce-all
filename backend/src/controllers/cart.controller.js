import { Product } from "../models/product.model.js";
import { Cart } from "../models/cart.model.js";

/**
 * 1. 장바구니 조회 API
 */
export const getCart = async (req, res) => {
  try {
    const userId = req.user._id;

    let cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart) {
      cart = await Cart.create({
        userId,
        clerkId: req.user.clerkId,
        items: [],
      });
    }

    return res.status(200).json({ cart });
  } catch (error) {
    console.error("장바구니 조회 실패:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * 2. 장바구니 상품 추가 API
 */
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user._id;
    const clerkId = req.user.clerkId;

    const addQuantity = Number(quantity);
    if (!productId || isNaN(addQuantity) || addQuantity <= 0) {
      return res.status(400).json({
        message: "유효한 productId와 1 이상의 수량을 입력해주세요.",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        message: "존재하지 않는 상품입니다.",
      });
    }
    if (product.stock <= addQuantity) {
      return res.status(400).json({
        message: `재고가 부족합니다. (현재 재고: ${product.stock}개)`,
      });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({
        userId,
        clerkId,
        items: [{ productId, quantity: addQuantity }],
      });
    } else {
      const existingItemIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId.toString(),
      );

      if (existingItemIndex > -1) {
        const potentialNewQuantity =
          cart.items[existingItemIndex].quantity + addQuantity;
        if (potentialNewQuantity > product.stock) {
          return res.status(400).json({
            message: `장바구니에 해당 상품을 추가할 경우 재고가 부족합니다. (현재 재고: ${product.stock}개)`,
          });
        }
        cart.items[existingItemIndex].quantity = potentialNewQuantity;
      } else {
        cart.items.push({ productId, quantity: addQuantity });
      }
    }

    await cart.save();
    await cart.populate("items.productId");

    return res.status(200).json({
      message: "장바구니에 상품이 추가되었습니다.",
      cart,
    });
  } catch (error) {
    console.error("장바구니 추가 실패:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * 3. 장바구니 수량 변경 API
 */
export const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const userId = req.user._id;

    const newQuantity = Number(quantity);
    if (!productId || isNaN(newQuantity)) {
      return res.status(400).json({
        message: "productId와 올바른 수량을 입력해주세요.",
      });
    }

    if (newQuantity <= 0) {
      return res.status(400).json({
        message: "수량은 1 이상으로 입력해주세요.",
      });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        message: "장바구니를 찾을 수 없습니다.",
      });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId.toString(),
    );

    if (existingItemIndex === -1) {
      return res.status(404).json({
        message: "장바구니에서 해당 상품을 찾을 수 없습니다.",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        message: "존재하지 않는 상품입니다.",
      });
    }
    if (product.stock <= newQuantity) {
      return res.status(400).json({
        message: `장바구니에 해당 상품을 추가할 경우 재고가 부족합니다. (현재 재고: ${product.stock}개)`,
      });
    }
    cart.items[existingItemIndex].quantity = newQuantity;

    await cart.save();
    await cart.populate("items.productId");

    return res.status(200).json({
      message: "장바구니 수량이 변경되었습니다.",
      cart,
    });
  } catch (error) {
    console.error("장바구니 수량 업데이트 실패:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * 4. 장바구니 상품 삭제 API
 */
export const deleteCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        message: "장바구니를 찾을 수 없습니다.",
      });
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId.toString(),
    );

    if (cart.items.length === initialLength) {
      return res.status(404).json({
        message: "장바구니에서 해당 상품을 찾을 수 없습니다.",
      });
    }

    await cart.save();
    await cart.populate("items.productId");

    return res.status(200).json({
      message: "장바구니에서 상품이 삭제되었습니다.",
      cart,
    });
  } catch (error) {
    console.error("장바구니 항목 삭제 실패:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        message: "장바구니를 찾을 수 없습니다.",
      });
    }

    cart.items = [];
    await cart.save();

    return res.status(200).json({
      message: "장바구니가 비워졌습니다.",
      cart,
    });
  } catch (error) {
    console.error("장바구니 비우기 실패:", error);
    return res.status(500).json({ message: error.message });
  }
};
