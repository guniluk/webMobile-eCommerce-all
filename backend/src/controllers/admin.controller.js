import cloudinary from "../config/cloudinary.js";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";

/**
 * req.files (Multer 폼데이터 파일 업로드) 및 req.body.images (JSON Base64/URL)에서
 * 이미지들을 추출하여 Cloudinary로 업로드하는 헬퍼 함수
 */
const processImageUploads = async (req) => {
  const imageUrls = [];

  // 1. Multer 폼데이터 파일 업로드 처리 (req.files 또는 req.file)
  const files = req.files || (req.file ? [req.file] : []);
  if (files && files.length > 0) {
    const filePromises = files.map(async (file) => {
      try {
        const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
        const result = await cloudinary.uploader.upload(dataUri, {
          folder: "products",
        });
        return result.secure_url || result.url;
      } catch (err) {
        console.error("[Multer File Upload Error]", err);
        throw new Error(`파일 업로드 실패: ${err.message || err}`);
      }
    });
    const uploadedFromFiles = await Promise.all(filePromises);
    imageUrls.push(...uploadedFromFiles);
  }

  // 2. JSON Body를 통한 Base64 / URL 이미지 업로드 처리 (req.body.images)
  let { images } = req.body || {};
  if (images) {
    if (!Array.isArray(images)) {
      images = [images];
    }
    const bodyPromises = images.map(async (img) => {
      // 이미 내 Cloudinary 계정(CLOUDINARY_CLOUD_NAME)에 업로드된 이미지 URL인 경우 재업로드 방지
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      if (
        typeof img === "string" &&
        img.includes("cloudinary.com") &&
        cloudName &&
        img.includes(cloudName)
      ) {
        return img;
      }
      try {
        const result = await cloudinary.uploader.upload(img, {
          folder: "products",
        });
        return result.secure_url || result.url;
      } catch (err) {
        console.error("[Base64/URL Upload Error]", err);
        throw new Error(`이미지 Cloudinary 업로드 실패: ${err.message || err}`);
      }
    });
    const uploadedFromBody = await Promise.all(bodyPromises);
    imageUrls.push(...uploadedFromBody);
  }

  return imageUrls;
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, category } = req.body;
    if (!name || !description || !price || !stock || !category) {
      return res.status(400).json({ message: "All fields are required" });
    }
    //프라이스에 숫자가 아니면 400 메세지
    if (isNaN(price)) {
      return res.status(400).json({ message: "Price must be a number" });
    }
    //재고에 숫자가 아니면 400 메세지
    if (isNaN(stock)) {
      return res.status(400).json({ message: "Stock must be a number" });
    }

    //이미지가 없으면 400 메세지
    const imageUrls = await processImageUploads(req);
    if (!imageUrls.length) {
      return res.status(400).json({ message: "Images are required" });
    }
    //이미지 3개 초과 시 400 메세지
    if (imageUrls.length > 3) {
      return res
        .status(400)
        .json({ message: "Images must be less than or equal to 3" });
    }

    const product = await Product.create({
      name,
      description,
      price: Number(price),
      stock: Number(stock || 0),
      category,
      images: imageUrls,
    });
    return res.status(201).json(product);
  } catch (error) {
    console.error("[CreateProduct Error]", error);
    return res
      .status(500)
      .json({ message: error.message, error: error.message });
  }
};

export const getAllProducts = async (_, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    return res.status(200).json(products);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { name, description, price, stock, category } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (name) product.name = name;
    if (description) product.description = description;
    if (price !== undefined && !isNaN(price)) product.price = Number(price);
    if (stock !== undefined && !isNaN(stock)) product.stock = Number(stock);
    if (category) product.category = category;

    // 신규 업로드할 이미지가 존재하는 경우 처리
    const newImageUrls = await processImageUploads(req);
    if (newImageUrls.length > 0) {
      if (newImageUrls.length > 3) {
        return res
          .status(400)
          .json({ message: "Images must be less than or equal to 3" });
      }
      // 기존 Cloudinary 이미지 삭제
      if (product.images && product.images.length > 0) {
        const deletePromises = product.images.map(async (img) => {
          if (img.includes("cloudinary.com")) {
            const publicId = img.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(`products/${publicId}`);
          }
        });
        await Promise.all(deletePromises);
      }
      product.images = newImageUrls;
    }

    await product.save();
    return res.status(200).json(product);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Cloudinary에 업로드된 이미지 삭제
    if (product.images && product.images.length > 0) {
      const deletePromises = product.images.map(async (img) => {
        if (typeof img === "string" && img.includes("cloudinary.com")) {
          const publicId = img.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(`products/${publicId}`);
        }
      });
      await Promise.all(deletePromises);
    }

    await Product.findByIdAndDelete(productId);
    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getAllOrders = async (_, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email")
      .populate("orderItems.productId")
      .sort({ createdAt: -1 });
    return res.status(200).json({ orders });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status || !["pending", "shipped", "delivered"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (status) order.status = status;
    if (status === "shipped" && !order.shippedAt) order.shippedAt = Date.now();
    if (status === "delivered" && !order.deliveredAt)
      order.deliveredAt = Date.now();

    await order.save();
    return res
      .status(200)
      .json({ message: "Order status updated successfully", order });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getAllCustomers = async (_, res) => {
  try {
    const customers = await User.find()
      .select("name email imageUrl")
      .sort({ createdAt: -1 });
    return res.status(200).json({ customers });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getDashboardStats = async (_, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalCustomers = await User.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);
    return res.status(200).json({
      totalProducts,
      totalOrders,
      totalCustomers,
      totalRevenue: totalRevenue[0]?.total || 0,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
