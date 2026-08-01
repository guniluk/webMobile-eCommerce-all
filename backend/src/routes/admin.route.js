import express from "express";
import {
  createProduct,
  getAllProducts,
  updateProduct,
  getAllOrders,
  updateOrderStatus,
  getAllCustomers,
  getDashboardStats,
} from "../controllers/admin.controller.js";
import { protectRoute, adminOnly } from "../middleware/auth.middleware.js";
import { uploadMultipleImages } from "../middleware/multer.middleware.js";

const router = express.Router();

router.use(protectRoute, adminOnly);

router.post("/products", uploadMultipleImages, createProduct);
router.get("/products", getAllProducts);
router.put("/products/:productId", uploadMultipleImages, updateProduct);

router.get("/orders", getAllOrders);
router.patch("/orders/:orderId/status", updateOrderStatus);

router.get("/customers", getAllCustomers);

router.get("/stats", getDashboardStats);

export default router;
