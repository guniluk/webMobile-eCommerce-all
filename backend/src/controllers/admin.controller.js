import { Product } from "../models/product.model.js";
import cloudinary from "../config/cloudinary.js";

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
      const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
      const result = await cloudinary.uploader.upload(dataUri, {
        folder: "products",
      });
      return result.secure_url || result.url;
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
      if (typeof img === "string" && img.startsWith("http")) {
        return img;
      }
      const result = await cloudinary.uploader.upload(img, {
        folder: "products",
      });
      return result.secure_url || result.url;
    });
    const uploadedFromBody = await Promise.all(bodyPromises);
    imageUrls.push(...uploadedFromBody);
  }

  return imageUrls;
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, category } = req.body;

    const imageUrls = await processImageUploads(req);

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
    return res.status(500).json({ error: error.message });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
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
    if (price !== undefined) product.price = Number(price);
    if (stock !== undefined) product.stock = Number(stock);
    if (category) product.category = category;

    // 신규 업로드할 이미지가 존재하는 경우 처리
    const newImageUrls = await processImageUploads(req);
    if (newImageUrls.length > 0) {
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
