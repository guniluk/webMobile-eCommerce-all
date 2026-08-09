import { Router } from "express";
import { getAllProducts } from "../controllers/admin.controller.js";
import { getProductById } from "../controllers/product.controller.js";

const router = Router();

// 상품 목록 및 상세 조행은 공개(Public) 라우트입니다.
router.get("/", getAllProducts);
router.get("/:productId", getProductById);

export default router;
