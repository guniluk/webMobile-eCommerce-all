import express from "express";
import {
  createProduct,
  getAllProducts,
  updateProduct,
} from "../controllers/admin.controller.js";
import { protectRoute, adminOnly } from "../middleware/auth.middleware.js";
import { uploadMultipleImages } from "../middleware/multer.middleware.js";

const router = express.Router();

router.use(protectRoute, adminOnly);

router.post("/products", uploadMultipleImages, createProduct);
router.get("/products", getAllProducts);
router.put("/products/:productId", uploadMultipleImages, updateProduct);

export default router;
